"""
Mapbox Visualization Agent
Takes the full report/analysis and generates interactive map overlays
"""

from typing import Dict, Any
from base_agent import BaseAgent
from agent_types import AgentType, AgentTask, AgentConfig
import json


class MapboxVisualizationAgent(BaseAgent):
    """
    Specialized agent that ONLY focuses on creating map visualizations
    Reads the complete report and generates blocked roads, impact zones, heatmaps
    """
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.MAPBOX_AGENT, task, config)
    
    def build_prompt(self) -> str:
        city = self.custom_input.get("city", "San Francisco, CA")
        policy_goal = self.custom_input.get("policy_goal", "")
        
        return f"""You are a Mapbox Visualization Agent. Your ONLY job is to create interactive map overlays.

# YOUR MISSION
Read the complete policy analysis and report, then generate SPECIFIC, DETAILED map visualization data.

# POLICY BEING ANALYZED
{policy_goal or self.task.description}

# CITY
{city}

# ANALYSIS FROM OTHER AGENTS
{self.build_context_section()}

# YOUR TASK - CREATE VISUAL MAP DATA

Based on ALL the analysis above, you must create detailed map visualization data showing:

1. **BLOCKED ROADS** - Which specific streets are blocked/restricted by this policy
2. **IMPACT ZONES** - Circles showing affected areas with severity levels
3. **TRAFFIC HEATMAP** - Points showing where congestion increases/decreases
4. **ALTERNATE ROUTES** - Detour paths people will take

## CRITICAL REQUIREMENTS:

### 1. BLOCKED ROADS (3-8 roads)
For EACH road affected by the policy, provide:
- Exact street name (e.g., "Market Street from 5th to 8th")
- Array of coordinates forming the road segment
- Reason why it's blocked
- Impact on traffic

Example:
```json
{{
  "name": "Market Street (5th to 8th)",
  "coordinates": [
    [-122.4082, 37.7835],
    [-122.4092, 37.7840],
    [-122.4102, 37.7845],
    [-122.4112, 37.7850],
    [-122.4122, 37.7855]
  ],
  "reason": "Policy closes to car traffic",
  "impact": {{
    "delay": "+8 min for diverted traffic",
    "traffic_increase_on_alternates": "25%"
  }},
  "severity": "high"
}}
```

### 2. IMPACT ZONES (3-6 circular zones)
For areas affected by the policy:
```json
{{
  "center": {{"lng": -122.4102, "lat": 37.7845}},
  "radius": 0.010,
  "severity": "high",
  "description": "Primary impact - Market St closure"
}}
```

Severity levels:
- **high**: radius 0.008-0.012 (red/purple)
- **medium**: radius 0.006-0.010 (orange/yellow)
- **low**: radius 0.004-0.006 (green/blue)

### 3. TRAFFIC HEATMAP (15-25 points)
Spread points across the city showing traffic changes:
```json
{{
  "lat": 37.7845,
  "lng": -122.4102,
  "intensity": 0.9
}}
```

Intensity scale:
- 0.9-1.0: Severe congestion (RED)
- 0.7-0.9: Heavy traffic (ORANGE)
- 0.5-0.7: Moderate traffic (YELLOW)
- 0.3-0.5: Light traffic (LIGHT GREEN)
- 0.0-0.3: Improved traffic (DARK GREEN)

### 4. ALTERNATE ROUTES (2-4 routes)
Detour paths created by the policy:
```json
{{
  "name": "Mission Street (parallel route)",
  "coordinates": [
    [-122.4180, 37.7749],
    [-122.4190, 37.7755],
    [-122.4200, 37.7760],
    [-122.4210, 37.7765],
    [-122.4220, 37.7770]
  ],
  "delay": "+5 min",
  "description": "Primary alternate route",
  "traffic_increase": "30%"
}}
```

## REAL COORDINATES FOR {city.upper()}:

Use ACTUAL street coordinates:
- Market St @ 5th: [-122.4082, 37.7835]
- Market St @ 6th: [-122.4092, 37.7840]
- Market St @ 7th: [-122.4102, 37.7845]
- Market St @ 8th: [-122.4122, 37.7855]
- Mission St @ 16th: [-122.4194, 37.7599]
- Van Ness Ave: [-122.4216, 37.7799]
- Valencia St: [-122.4216, 37.7599]
- Harrison St: [-122.4130, 37.7700]
- Embarcadero: [-122.3933, 37.7955]
- Geary Blvd: [-122.4277, 37.7858]

## OUTPUT FORMAT - PURE JSON ONLY

Output ONLY a single JSON object (no markdown, no explanation, just JSON):

```json
{{
  "city": "{city}",
  "policy": "{policy_goal}",
  "blocked_roads": [
    // 3-8 roads with coordinates
  ],
  "impact_zones": [
    // 3-6 zones with centers and radii
  ],
  "traffic_heatmap": [
    // 15-25 points with lat/lng/intensity
  ],
  "alternate_routes": [
    // 2-4 routes with coordinates
  ],
  "highlight_areas": [
    // 5-10 key locations to highlight
  ],
  "summary": {{
    "total_blocked_roads": 0,
    "total_impact_zones": 0,
    "max_congestion_intensity": 0.0,
    "visualization_ready": true
  }}
}}
```

REMEMBER:
- Use REAL street names from {city}
- Use REAL coordinates 
- Base everything on the analysis and report
- Make it logical - if policy blocks Market St, show Mission St as alternate
- Create 15-25 heatmap points spread across affected areas
- Be specific and detailed

Output ONLY the JSON block. No other text.
"""

    async def execute(self) -> Dict[str, Any]:
        """Execute and return visualization data"""
        full_output = ""
        async for token in self.stream_execute():
            full_output += token
        
        # Extract JSON
        visualization_data = self._extract_json(full_output)
        
        return {
            "visualization_data": visualization_data,
            "raw_output": full_output,
            "agent_type": "mapbox_visualization"
        }
    
    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON from output"""
        try:
            import re
            # Look for JSON block
            json_match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', text)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Try to parse entire output as JSON
            return json.loads(text)
        except Exception as e:
            print(f"Error parsing visualization JSON: {e}")
            return {}


