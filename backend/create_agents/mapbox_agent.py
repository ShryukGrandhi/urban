"""
Mapbox Agent - Intelligent geospatial visualization
Uses Mapbox MCP to select appropriate visualization tools
"""

import logging
import json
from typing import Dict, Any, AsyncGenerator
from .base_agent import BaseAgent
from .agent_types import AgentType, AgentTask, AgentConfig
import sys
import os

# Add tools directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'tools'))
from mapbox_mcp_integration import mapbox_mcp

logger = logging.getLogger(__name__)


class MapboxAgent(BaseAgent):
    """
    Intelligent Mapbox visualization agent
    Uses MCP to select the best visualization tools for the policy
    """
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.MAPBOX_AGENT, task, config)
    
    def get_capability_description(self) -> str:
        return """You are an expert Mapbox visualization agent with access to multiple visualization tools.

Your role is to:
1. Analyze the policy document and context
2. Select the BEST Mapbox visualization tools (heatmaps, markers, 3D extrusions, etc.)
3. Generate specific, real-world data for San Francisco
4. Create detailed visualization configurations

Available tools from Mapbox MCP:
- Heatmaps (density, traffic, crime)
- Markers (POIs, incidents, services)
- Choropleth (neighborhood statistics)
- 3D Extrusions (buildings, heights)
- Route Lines (transit, traffic)
- Fill Polygons (zones, areas)
- Circles (impact radius)
- Isochrones (travel time)
- Clusters (grouped data)
- Animated Flow (traffic, movement)

You have access to REAL San Francisco data and should use actual:
- Street names and intersections
- Neighborhood names
- Landmark locations
- Transit routes
- Real coordinates
"""
    
    def build_prompt(self) -> str:
        # Get policy info from custom_input
        policy_text = self.custom_input.get("policy_text", "")
        policy_overview = self.custom_input.get("overview", "")
        policy_type = self.custom_input.get("policy_type", "urban development")
        message_history = self.custom_input.get("message_history", "")
        
        # Get available tools from MCP
        available_tools = mapbox_mcp.get_available_tools()
        
        # Select recommended tools based on policy
        recommended_tools = mapbox_mcp.select_tools_for_policy(
            policy_type=policy_type,
            policy_text=policy_text,
            analysis_context=policy_overview
        )
        
        tools_description = "\n\n".join([
            f"### {tool['name'].upper()}\n"
            f"Description: {tool['description']}\n"
            f"Use cases: {', '.join(tool['use_cases'])}\n"
            f"Example: {json.dumps(tool.get('example', {}), indent=2)}"
            for tool in recommended_tools
        ])
        
        return f"""You are a Mapbox Visualization Agent with access to powerful geospatial tools.

{self.get_capability_description()}

# YOUR TASK
{self.task.description}

# POLICY INFORMATION
## Overview
{policy_overview}

## Full Policy Text
{policy_text[:2000]}{"..." if len(policy_text) > 2000 else ""}

## Recent Discussion
{message_history}

# RECOMMENDED MAPBOX TOOLS
Based on analysis, these tools are recommended:

{tools_description}

# CONTEXT FROM OTHER AGENTS
{self.build_context_section()}

# YOUR DELIVERABLE
Generate a JSON configuration for Mapbox visualization with the following structure:

```json
{{
  "selected_tools": ["tool1", "tool2", "tool3"],
  "visualizations": [
    {{
      "type": "heatmap",
      "title": "Traffic Density After Policy",
      "description": "Shows predicted traffic patterns",
      "data": [
        {{
          "lat": 37.7749,
          "lng": -122.4194,
          "intensity": 0.8,
          "label": "High congestion near Market St",
          "details": "Expected 40% increase during peak hours"
        }}
      ],
      "config": {{
        "colorScale": ["#10b981", "#f59e0b", "#ef4444"],
        "radius": 30,
        "opacity": 0.7
      }}
    }},
    {{
      "type": "marker",
      "title": "Impact Zones",
      "description": "Key areas affected by policy",
      "data": [
        {{
          "lat": 37.7599,
          "lng": -122.4194,
          "icon": "building",
          "color": "#3b82f6",
          "popup": "New affordable housing - 200 units",
          "details": "Mixed-income development opening 2026"
        }}
      ]
    }}
  ],
  "summary": {{
    "total_visualizations": 2,
    "coverage_area": "San Francisco Financial District and Mission Bay",
    "data_confidence": "high",
    "recommended_zoom": 13,
    "center": [-122.4194, 37.7749]
  }},
  "insights": [
    "Traffic will concentrate around...",
    "Housing demand highest in..."
  ]
}}
```

## REQUIREMENTS:
1. Use REAL San Francisco locations (actual street names, neighborhoods, landmarks)
2. Include at least 2-3 different visualization types
3. Each visualization should have:
   - Clear title and description
   - At least 5-10 data points with REAL coordinates
   - Detailed hover information (what, why, impact)
   - Appropriate configuration (colors, sizes, etc.)
4. Data should be SPECIFIC to the policy (not generic)
5. Include insights about what the visualization reveals

## IMPORTANT:
- Base everything on the policy document
- Use the recommended tools listed above
- Make data realistic and verifiable
- Explain WHY each visualization was chosen

Generate the complete JSON configuration now:
"""
    
    async def post_process(self, raw_output: str) -> Dict[str, Any]:
        """
        Extract and validate the Mapbox configuration JSON
        """
        try:
            # Try to extract JSON from the output
            json_start = raw_output.find('{')
            json_end = raw_output.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = raw_output[json_start:json_end]
                mapbox_config = json.loads(json_str)
                
                logger.info(f"✅ Extracted Mapbox config with {len(mapbox_config.get('visualizations', []))} visualizations")
                
                return {
                    "success": True,
                    "mapbox_config": mapbox_config,
                    "visualization_count": len(mapbox_config.get('visualizations', [])),
                    "tools_used": mapbox_config.get('selected_tools', []),
                    "raw_output": raw_output
                }
            else:
                logger.error("No JSON found in agent output")
                return {
                    "success": False,
                    "error": "No JSON configuration found",
                    "raw_output": raw_output
                }
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            return {
                "success": False,
                "error": f"Invalid JSON: {str(e)}",
                "raw_output": raw_output
            }
        except Exception as e:
            logger.error(f"Post-processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "raw_output": raw_output
            }
    
    async def execute(self) -> Dict[str, Any]:
        """Execute the agent and return Mapbox configuration"""
        full_output = ""
        async for token in self.stream_execute():
            full_output += token
        return self.result  # Result is set by stream_execute with post_process



