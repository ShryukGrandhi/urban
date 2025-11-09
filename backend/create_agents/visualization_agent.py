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
        import random
        import datetime
        
        city = self.custom_input.get("city", "San Francisco, CA")
        policy_goal = self.custom_input.get("policy_goal", "")
        
        # Generate unique seed for this run to ensure different visualizations
        run_seed = random.randint(1000, 9999)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        return f"""You are a Mapbox Visualization Agent. Your ONLY job is to create interactive map overlays.

# UNIQUE RUN ID: {run_seed} (Generated at {timestamp})
⚠️ CRITICAL: This run must be COMPLETELY UNIQUE from previous runs. Vary:
- Which specific streets are blocked
- Number and location of impact zones  
- Heatmap point positions and intensities
- Alternate route suggestions

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

⚠️ MANDATORY: Start your response with exactly: MAPBOX_JSON_START
Then output the JSON
Then end with exactly: MAPBOX_JSON_END

Format:
MAPBOX_JSON_START
{{
  "city": "{city}",
  "policy": "{policy_goal}",
  "run_id": "UNIQUE_ID_HERE",
  "blocked_roads": [
    {{
      "name": "Exact street name",
      "coordinates": [[-122.xxx, 37.xxx], [-122.xxx, 37.xxx]],
      "reason": "Why blocked",
      "impact": {{"delay": "+X min", "traffic_increase_on_alternates": "XX%"}},
      "severity": "high/medium/low"
    }}
  ],
  "impact_zones": [
    {{
      "center": {{"lng": -122.xxx, "lat": 37.xxx}},
      "radius": 0.010,
      "severity": "high/medium/low",
      "description": "What this zone represents"
    }}
  ],
  "traffic_heatmap": [
    {{"lat": 37.xxx, "lng": -122.xxx, "intensity": 0.8}}
  ],
  "alternate_routes": [
    {{
      "name": "Street name",
      "coordinates": [[-122.xxx, 37.xxx]],
      "delay": "+X min",
      "description": "Description",
      "traffic_increase": "XX%"
    }}
  ]
}}
MAPBOX_JSON_END

REQUIREMENTS:
1. Use RUN_ID {run_seed} to ensure uniqueness
2. Generate 4-8 blocked roads (vary the number each time!)
3. Generate 3-6 impact zones in different locations
4. Generate 15-25 heatmap points scattered across the city
5. Generate 2-4 alternate routes
6. Base ALL data on the policy analysis above
7. Use REAL coordinates for {city}
8. Make it DIFFERENT from any previous run

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
        """Extract JSON from output with improved parsing"""
        try:
            import re
            
            print(f"[DEBUG] Attempting to parse visualization output (length: {len(text)})")
            
            # First try to find JSON between markers
            marker_match = re.search(r'MAPBOX_JSON_START\s*(\{[\s\S]*?\})\s*MAPBOX_JSON_END', text, re.DOTALL)
            if marker_match:
                json_str = marker_match.group(1)
                print(f"[DEBUG] Found JSON between markers (length: {len(json_str)})")
                return json.loads(json_str)
            
            # Try to find JSON in code blocks
            json_match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                print(f"[DEBUG] Found JSON in code block (length: {len(json_str)})")
                return json.loads(json_str)
            
            # Try to find any JSON object
            json_match = re.search(r'(\{[\s\S]*"blocked_roads"[\s\S]*?\})', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                print(f"[DEBUG] Found JSON object with blocked_roads (length: {len(json_str)})")
                return json.loads(json_str)
            
            # Try to parse entire output as JSON
            print("[DEBUG] Attempting to parse entire output as JSON")
            return json.loads(text.strip())
            
        except Exception as e:
            print(f"[ERROR] Failed to parse visualization JSON: {e}")
            print(f"[ERROR] Output preview: {text[:500]}...")
            return {}


