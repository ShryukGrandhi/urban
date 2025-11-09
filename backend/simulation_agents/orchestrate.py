"""
Agent Orchestration System
Manages execution of multiple agents working with simulated data and context
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
from datetime import datetime
import json

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'create_agents'))

from agent_types import AgentType, AgentTask, AgentConfig, Agent
from specialized_agents import create_agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orchestrates the execution of multiple agents
    Manages context aggregation and data flow between agents
    """
    
    def __init__(self):
        self.active_agents: Dict[str, Any] = {}
        self.completed_tasks: Dict[str, Dict[str, Any]] = {}
        self.aggregated_context: Dict[str, Any] = {}
        
    async def execute_agent(
        self,
        agent_id: str,
        agent_type: AgentType,
        task_description: str,
        simulation_data: Optional[Dict[str, Any]] = None,
        policy_data: Optional[Dict[str, Any]] = None,
        custom_input: Optional[Dict[str, Any]] = None,
        config: Optional[AgentConfig] = None,
        stream_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Execute a single agent task
        
        Args:
            agent_id: Unique identifier for the agent
            agent_type: Type of agent to execute
            task_description: What the agent should do
            simulation_data: Data from simulations
            policy_data: Policy documents and context
            custom_input: Task-specific input
            config: Agent configuration
            stream_callback: Optional callback for streaming tokens
            
        Returns:
            Dict with agent execution results
        """
        try:
            # Create task
            task = AgentTask(
                id=f"task-{agent_id}-{datetime.utcnow().timestamp()}",
                agent_id=agent_id,
                agent_type=agent_type,
                description=task_description,
                simulation_data=simulation_data,
                aggregated_context=self.aggregated_context,
                policy_data=policy_data,
                custom_input=custom_input or {},
                config=config or AgentConfig()
            )
            
            # Create agent
            agent = create_agent(agent_type, agent_id, task, config)
            self.active_agents[agent_id] = agent
            
            logger.info(f"Starting execution of {agent_type} agent: {agent_id}")
            
            # Execute with streaming if callback provided
            if stream_callback and config and config.streaming:
                full_output = ""
                async for token in agent.stream_execute():
                    full_output += token
                    await stream_callback({
                        "type": "token",
                        "agent_id": agent_id,
                        "agent_type": agent_type,
                        "token": token,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                result = agent.result
            else:
                result = await agent.execute()
            
            # Store completed task
            self.completed_tasks[task.id] = {
                "agent_id": agent_id,
                "agent_type": agent_type,
                "task": task.dict(),
                "result": result,
                "completed_at": datetime.utcnow().isoformat()
            }
            
            # Update aggregated context
            self._update_context(agent_type, result)
            
            # Remove from active agents
            if agent_id in self.active_agents:
                del self.active_agents[agent_id]
            
            logger.info(f"Completed execution of {agent_type} agent: {agent_id}")
            
            return {
                "success": True,
                "agent_id": agent_id,
                "agent_type": agent_type,
                "task_id": task.id,
                "result": result,
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Error executing agent {agent_id}: {e}")
            if agent_id in self.active_agents:
                del self.active_agents[agent_id]
            return {
                "success": False,
                "agent_id": agent_id,
                "agent_type": agent_type,
                "error": str(e),
                "status": "failed"
            }
    
    async def execute_agent_stream(
        self,
        agent_id: str,
        agent_type: AgentType,
        task_description: str,
        simulation_data: Optional[Dict[str, Any]] = None,
        policy_data: Optional[Dict[str, Any]] = None,
        custom_input: Optional[Dict[str, Any]] = None,
        config: Optional[AgentConfig] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Execute agent and yield streaming events
        """
        try:
            # Create task
            task = AgentTask(
                id=f"task-{agent_id}-{datetime.utcnow().timestamp()}",
                agent_id=agent_id,
                agent_type=agent_type,
                description=task_description,
                simulation_data=simulation_data,
                aggregated_context=self.aggregated_context,
                policy_data=policy_data,
                custom_input=custom_input or {},
                config=config or AgentConfig()
            )
            
            # Yield start event
            yield {
                "type": "progress",
                "agent_id": agent_id,
                "agent_type": agent_type.value,
                "task_id": task.id,
                "data": f"Starting {agent_type.value} agent...",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Create and execute agent
            agent = create_agent(agent_type, agent_id, task, config)
            self.active_agents[agent_id] = agent
            
            # Stream tokens
            async for token in agent.stream_execute():
                yield {
                    "type": "stream",
                    "agent_id": agent_id,
                    "agent_type": agent_type.value,
                    "data": token,
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            # Yield completion event
            result = agent.result
            self.completed_tasks[task.id] = {
                "agent_id": agent_id,
                "agent_type": agent_type.value,
                "task": task.dict(),
                "result": result,
                "completed_at": datetime.utcnow().isoformat()
            }
            
            self._update_context(agent_type, result)
            
            if agent_id in self.active_agents:
                del self.active_agents[agent_id]
            
            yield {
                "type": "complete",
                "agent_id": agent_id,
                "agent_type": agent_type.value,
                "data": f"✓ {agent_type.value} agent completed successfully!",
                "result": result,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error streaming agent {agent_id}: {e}")
            if agent_id in self.active_agents:
                del self.active_agents[agent_id]
            yield {
                "type": "error",
                "agent_id": agent_id,
                "data": str(e),
                "agent_type": agent_type.value,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def execute_agent_chain(
        self,
        agents: List[Dict[str, Any]],
        simulation_data: Optional[Dict[str, Any]] = None,
        policy_data: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute multiple agents in sequence, passing context between them
        
        Args:
            agents: List of agent configurations with type, description, etc.
            simulation_data: Initial simulation data
            policy_data: Policy documents
            
        Returns:
            List of results from each agent
        """
        results = []
        
        for i, agent_config in enumerate(agents):
            agent_id = agent_config.get("agent_id", f"chain-agent-{i}")
            agent_type = AgentType(agent_config["agent_type"])
            description = agent_config["description"]
            custom_input = agent_config.get("custom_input", {})
            config = agent_config.get("config")
            
            if config and not isinstance(config, AgentConfig):
                config = AgentConfig(**config)
            
            result = await self.execute_agent(
                agent_id=agent_id,
                agent_type=agent_type,
                task_description=description,
                simulation_data=simulation_data,
                policy_data=policy_data,
                custom_input=custom_input,
                config=config
            )
            
            results.append(result)
            
            # If agent failed, optionally stop the chain
            if not result["success"]:
                logger.warning(f"Agent {agent_id} failed, stopping chain")
                break
        
        return results
    
    def _update_context(self, agent_type: AgentType, result: Dict[str, Any]):
        """Update aggregated context with agent results"""
        context_key = f"{agent_type.value}_results"
        
        if context_key not in self.aggregated_context:
            self.aggregated_context[context_key] = []
        
        self.aggregated_context[context_key].append({
            "timestamp": datetime.utcnow().isoformat(),
            "result": result
        })
        
        # Keep only last 10 results per agent type to manage context size
        if len(self.aggregated_context[context_key]) > 10:
            self.aggregated_context[context_key] = self.aggregated_context[context_key][-10:]
    
    def get_context(self) -> Dict[str, Any]:
        """Get current aggregated context"""
        return self.aggregated_context
    
    def get_active_agents(self) -> List[str]:
        """Get list of currently active agent IDs"""
        return list(self.active_agents.keys())
    
    def get_completed_tasks(self) -> Dict[str, Any]:
        """Get all completed tasks"""
        return self.completed_tasks
    
    def clear_context(self):
        """Clear aggregated context"""
        self.aggregated_context = {}
        logger.info("Cleared aggregated context")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get orchestrator statistics"""
        agent_type_counts = {}
        success_count = 0
        failure_count = 0
        
        for task_data in self.completed_tasks.values():
            agent_type = task_data["agent_type"]
            agent_type_counts[agent_type] = agent_type_counts.get(agent_type, 0) + 1
            
            # Check if task was successful
            if task_data.get("result") and task_data["result"].get("success", True):
                success_count += 1
            else:
                failure_count += 1
        
        return {
            "active_agents": len(self.active_agents),
            "completed_tasks": len(self.completed_tasks),
            "success_count": success_count,
            "failure_count": failure_count,
            "agent_type_counts": agent_type_counts,
            "context_size": len(json.dumps(self.aggregated_context))
        }


# Global orchestrator instance
_orchestrator = None

def get_orchestrator() -> AgentOrchestrator:
    """Get or create global orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator

