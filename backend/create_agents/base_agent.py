"""
Base Agent Class - Foundation for all agent types
Works directly with simulated data + aggregated context
"""

import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, AsyncGenerator, List
from datetime import datetime
import google.generativeai as genai
import os
from dotenv import load_dotenv

from agent_types import AgentType, AgentConfig, AgentTask, AGENT_CAPABILITIES

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API - CRITICAL: This must use API key, not default credentials
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables!")
    logger.error("Create a .env file with: GEMINI_API_KEY=your_key_here")
    raise ValueError("GEMINI_API_KEY must be set in environment variables or .env file")

# Configure with API key explicitly to avoid default credentials error
try:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info(f"[OK] Gemini API configured with key (length: {len(GEMINI_API_KEY)})")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {e}")
    raise


class BaseAgent(ABC):
    """
    Base class for all agents in the multi-agentic system.
    Each task creates a unique agent instance with specific configuration.
    """
    
    def __init__(
        self,
        agent_id: str,
        agent_type: AgentType,
        task: AgentTask,
        config: Optional[AgentConfig] = None
    ):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.task = task
        self.config = config or AgentConfig()
        self.capability = AGENT_CAPABILITIES.get(agent_type)
        
        # Initialize LLM
        self.model = genai.GenerativeModel(self.config.model)
        
        # Context storage
        self.simulation_data = task.simulation_data or {}
        self.aggregated_context = task.aggregated_context or {}
        self.policy_data = task.policy_data or {}
        self.custom_input = task.custom_input or {}
        
        # Execution state
        self.status = "initialized"
        self.result = None
        self.error = None
        
        logger.info(f"Initialized {self.agent_type} agent: {self.agent_id}")
    
    @abstractmethod
    async def execute(self) -> Dict[str, Any]:
        """
        Main execution method - must be implemented by each agent type.
        Returns the result of the agent's work.
        """
        pass
    
    @abstractmethod
    def build_prompt(self) -> str:
        """
        Build the prompt for the LLM based on agent type and task.
        Must be implemented by each agent type.
        """
        pass
    
    async def stream_execute(self) -> AsyncGenerator[str, None]:
        """
        Execute the agent and stream results token by token.
        Use this for real-time updates to the frontend.
        """
        self.status = "running"
        self.task.status = "running"
        self.task.started_at = datetime.utcnow().isoformat()
        
        try:
            # Build the prompt
            prompt = self.build_prompt()
            logger.info(f"Agent {self.agent_id} starting execution with prompt length: {len(prompt)}")
            
            # Verify API key is configured
            if not GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY not configured")
            
            # Stream from LLM
            full_response = ""
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=self.config.temperature,
                    max_output_tokens=self.config.max_tokens,
                ),
                stream=True
            )
            
            # Stream tokens - properly handle async iteration
            async for chunk in response:
                if hasattr(chunk, 'text') and chunk.text:
                    full_response += chunk.text
                    yield chunk.text
            
            # Post-process the response after streaming completes
            processed_result = await self.post_process(full_response)
            
            self.result = processed_result
            self.task.result = processed_result
            self.status = "completed"
            self.task.status = "completed"
            self.task.completed_at = datetime.utcnow().isoformat()
            
            logger.info(f"Agent {self.agent_id} completed successfully")
            
        except StopAsyncIteration:
            # This should never happen in properly formed async generators
            # But if it does, treat as completion
            logger.warning(f"Agent {self.agent_id} received StopAsyncIteration - treating as completion")
            self.status = "completed"
            self.task.status = "completed"
            self.task.completed_at = datetime.utcnow().isoformat()
            
        except Exception as e:
            self.status = "failed"
            self.error = str(e)
            self.task.status = "failed"
            self.task.error = str(e)
            logger.error(f"Agent {self.agent_id} failed: {e}")
            # Don't re-raise, just log - this prevents breaking the generator
            logger.exception(e)
    
    async def post_process(self, raw_output: str) -> Dict[str, Any]:
        """
        Post-process the LLM output into structured format.
        Can be overridden by specific agent types.
        """
        return {
            "raw_output": raw_output,
            "processed_at": datetime.utcnow().isoformat(),
            "agent_type": self.agent_type,
            "agent_id": self.agent_id,
        }
    
    def build_context_section(self) -> str:
        """
        Build the context section from available data sources.
        This is used by all agents to get relevant context.
        """
        context_parts = []
        
        # Add simulation data if available and configured
        if self.config.use_simulation_data and self.simulation_data:
            context_parts.append("## SIMULATION DATA")
            context_parts.append("Recent simulation results and metrics:")
            context_parts.append(json.dumps(self.simulation_data, indent=2))
            context_parts.append("")
        
        # Add aggregated context if available and configured
        if self.config.use_aggregated_context and self.aggregated_context:
            context_parts.append("## AGGREGATED CONTEXT")
            context_parts.append("Compiled insights from multiple sources:")
            context_parts.append(json.dumps(self.aggregated_context, indent=2))
            context_parts.append("")
        
        # Add policy data if available
        if self.policy_data:
            context_parts.append("## POLICY DATA")
            context_parts.append("Related policy information:")
            context_parts.append(json.dumps(self.policy_data, indent=2))
            context_parts.append("")
        
        # Add custom input
        if self.custom_input:
            context_parts.append("## ADDITIONAL INPUT")
            context_parts.append(json.dumps(self.custom_input, indent=2))
            context_parts.append("")
        
        return "\n".join(context_parts)
    
    def get_capability_description(self) -> str:
        """Get a description of this agent's capabilities"""
        if self.capability:
            caps = []
            if self.capability.can_analyze_data:
                caps.append("data analysis")
            if self.capability.can_generate_content:
                caps.append("content generation")
            if self.capability.can_communicate_externally:
                caps.append("external communication")
            if self.capability.can_create_visualizations:
                caps.append("visualization creation")
            if self.capability.can_make_recommendations:
                caps.append("strategic recommendations")
            
            return f"This agent specializes in: {', '.join(caps)}."
        return ""
    
    def format_output(self, content: str, output_format: Optional[str] = None) -> str:
        """
        Format output according to specified format.
        """
        format_type = output_format or self.config.output_format or "markdown"
        
        if format_type == "json":
            # Try to structure as JSON
            return json.dumps({"content": content, "metadata": {
                "agent_type": self.agent_type,
                "timestamp": datetime.utcnow().isoformat()
            }}, indent=2)
        
        elif format_type == "html":
            # Convert markdown to HTML-friendly format
            lines = content.split("\n")
            html_lines = [f"<p>{line}</p>" if line.strip() else "<br>" for line in lines]
            return "\n".join(html_lines)
        
        else:  # markdown or default
            return content
    
    def __repr__(self) -> str:
        return f"<{self.agent_type} Agent {self.agent_id} [{self.status}]>"

