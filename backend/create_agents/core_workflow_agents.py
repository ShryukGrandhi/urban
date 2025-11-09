"""
Core Workflow Agents for URBAN Platform
These are the main agents that work together in the policy analysis workflow
"""

from typing import Dict, Any, Optional, List
from base_agent import BaseAgent
from agent_types import AgentType, AgentTask, AgentConfig
import json


class ConsultingSupervisorAgent(BaseAgent):
    """
    Acts as the Supervisor - determines the politician's goals
    Entry point for the entire workflow
    """
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.CONSULTING, task, config)
    
    def build_prompt(self) -> str:
        politician_info = self.custom_input.get("politician_info", {})
        initial_request = self.custom_input.get("initial_request", "")
        
        return f"""You are a Consulting Supervisor Agent - the strategic advisor and orchestrator for policy initiatives.

Your role is to determine and clarify the GOALS of the politician and create a strategic framework for analysis.

## CRITICAL: BE EXTREMELY TRANSPARENT AND VERBOSE

Don't just say "Analyzing goals..." 

Instead, write out your COMPLETE thought process:

"Looking at the request from {politician_info.get('name', 'the official')}, I need to deeply understand what they're trying to achieve.

INITIAL ASSESSMENT:
- The official is proposing: {initial_request or self.task.description}
- This appears to be a [traffic/housing/environmental/economic] policy
- Primary stakeholders will likely include: [list specific groups]
- Political context: [analyze political landscape]

GOAL CLARIFICATION:
Breaking down what the official REALLY wants:
1. Stated Goal: [what they said]
2. Underlying Motivation: [why they want this - political pressure? real problem? campaign promise?]
3. Success Metrics: [how will we measure if this works?]
4. Timeline Constraints: [when does this need to happen?]
5. Budget Limits: [what resources are available?]

STAKEHOLDER MAPPING:
Who cares about this and why:
- Supporters: [specific groups who will benefit]
- Opponents: [specific groups who will oppose]  
- Neutral parties who could swing either way: [groups to convince]

RISK ASSESSMENT:
What could go wrong:
- Political risks: [specific threats]
- Implementation risks: [practical challenges]
- Financial risks: [cost overruns, funding gaps]
- Public opinion risks: [backlash scenarios]

STRATEGIC RECOMMENDATIONS:
Based on this analysis, here's my framework..."

SHOW YOUR COMPLETE STRATEGIC THINKING PROCESS.

# POLITICIAN/CLIENT INFORMATION
{json.dumps(politician_info, indent=2) if politician_info else "Information to be gathered"}

# INITIAL REQUEST
{initial_request or self.task.description}

# YOUR RESPONSIBILITIES

As the supervisor, you must:

1. **Goal Clarification & Definition**
   - What is the politician trying to achieve?
   - What are the primary objectives?
   - What are the success criteria?
   - What is the timeline?
   - What are the constraints (political, budget, legal)?

2. **Strategic Framework**
   - Define the scope of analysis needed
   - Identify key stakeholders
   - Map political landscape
   - Assess risks and opportunities
   - Define metrics for success

3. **Workflow Orchestration Plan**
   - What simulations need to be run?
   - What perspectives need to be analyzed? (traffic, housing, environmental, etc.)
   - What data sources are needed?
   - What debate points need to be addressed?
   - What deliverables are required?

4. **Agent Task Assignment**
   - Simulation Agent: What scenarios to model and perspectives to analyze
   - Debate Agent: What arguments to generate and evaluate
   - Aggregator Agent: What to compile and how to present
   - Additional agents needed (media, planning, stakeholder, etc.)

5. **Decision Framework**
   - Key decision points
   - Information needed for each decision
   - Risk thresholds
   - Stakeholder approval requirements

# EXPECTED OUTPUT STRUCTURE

Provide a comprehensive strategic plan in the following format:

## 1. GOALS & OBJECTIVES
[Clear statement of what the politician wants to achieve]

## 2. STRATEGIC CONTEXT
[Political landscape, stakeholders, constraints, opportunities]

## 3. ANALYSIS APPROACH
[What needs to be analyzed and how]

## 4. SIMULATION REQUIREMENTS
For each simulation perspective needed:
- **Perspective**: (e.g., "Traffic Impact Analysis")
- **Focus**: What to analyze
- **Data Sources**: What data is needed
- **Visualization**: How to show results on Mapbox
- **Key Questions**: What questions need answering

## 5. DEBATE & VALIDATION
- Arguments to analyze (pro/con)
- Stakeholder perspectives to simulate
- Risk assessment requirements
- Public opinion considerations

## 6. DELIVERABLES
- Reports needed
- Presentations required
- Media materials
- Timeline for each

## 7. SUCCESS CRITERIA
[How we'll know if this initiative is successful]

## 8. NEXT STEPS
[Immediate actions to take]

Generate the complete strategic plan:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_plan = ""
        async for token in self.stream_execute():
            full_plan += token
        
        # Extract structured information for workflow orchestration
        return {
            "strategic_plan": full_plan,
            "workflow_ready": True,
            "agent_type": "consulting_supervisor"
        }


class EnhancedSimulationAgent(BaseAgent):
    """
    Enhanced Simulation Agent with 20+ detailed impact parameters
    Shows actual policy changes with realistic metrics
    Supports multiple perspectives (traffic, buildings, environment, etc.)
    Human-in-the-loop with flexible re-simulation
    """
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.SIMULATION, task, config)
        
        # Define 20+ parameters to track
        self.impact_parameters = {
            "traffic": [
                "peak_hour_congestion", "average_commute_time", "vehicle_volume",
                "public_transit_usage", "bike_lane_usage", "pedestrian_traffic"
            ],
            "environment": [
                "air_quality_index", "co2_emissions", "noise_pollution",
                "green_space_coverage", "tree_canopy", "water_quality"
            ],
            "economy": [
                "local_business_revenue", "property_values", "employment_rate",
                "retail_foot_traffic", "tax_revenue", "construction_jobs"
            ],
            "social": [
                "housing_affordability", "displacement_risk", "community_sentiment",
                "school_enrollment", "crime_rate", "public_safety_perception"
            ],
            "infrastructure": [
                "parking_availability", "road_maintenance_needs", "utility_capacity",
                "emergency_response_time", "waste_management", "street_lighting"
            ]
        }
    
    def build_prompt(self) -> str:
        perspective = self.custom_input.get("perspective", "comprehensive")
        city = self.custom_input.get("city", "")
        policy_document = self.custom_input.get("policy_document", "")
        policy_text = self.task.policy_data.get("document_text", "") if self.task.policy_data else ""
        baseline_environment = self.custom_input.get("baseline_environment", {})
        
        # Get all parameters as a formatted list
        all_params = []
        for category, params in self.impact_parameters.items():
            all_params.extend([f"{category}_{p}" for p in params])
        
        # Determine Mapbox visualization strategy
        viz_strategy = self._determine_visualization_strategy(perspective)
        
        return f"""You are an Enhanced Simulation Agent with deep knowledge of {city}'s geography, infrastructure, and urban dynamics.

# POLICY TO SIMULATE
{policy_document or self.task.description}

{f"# FULL POLICY DOCUMENT:{policy_text[:3000]}" if policy_text else ""}

# LOCATION
{city}

# PERSPECTIVE
Focus on: **{perspective}**

# CRITICAL REQUIREMENT: USE REAL LOCATIONS

You MUST identify and use REAL, SPECIFIC locations in {city}:
- Real street names (e.g., "Mission St & 16th St", "Market St & Van Ness Ave")
- Real neighborhoods (e.g., "Mission District", "SOMA", "Tenderloin", "Castro")
- Real landmarks (e.g., "Civic Center", "Ferry Building", "Golden Gate Park")
- Real highways (e.g., "US-101", "I-280", "Highway 1")
- Real transit stations (e.g., "Powell St BART", "16th St Mission BART")

Use ACTUAL coordinates for {city}:
- Downtown SF: [-122.4194, 37.7749]
- Mission District: [-122.4194, 37.7599]  
- SOMA: [-122.3977, 37.7786]
- Financial District: [-122.4017, 37.7946]
- Tenderloin: [-122.4133, 37.7849]
- Castro: [-122.4350, 37.7609]
- Golden Gate Park: [-122.4862, 37.7694]
- Civic Center: [-122.4161, 37.7799]

# BASELINE ENVIRONMENT
{json.dumps(baseline_environment, indent=2) if baseline_environment else "Use real current data for " + city}

# AVAILABLE CONTEXT
{self.build_context_section()}

# CRITICAL: YOU MUST ANALYZE ALL 20+ IMPACT PARAMETERS

For this policy, you MUST provide detailed analysis and specific numeric changes for ALL of these parameters:

## TRAFFIC PARAMETERS (6):
1. peak_hour_congestion (%)
2. average_commute_time (minutes)
3. vehicle_volume (vehicles/hour)
4. public_transit_usage (riders/day)
5. bike_lane_usage (%)
6. pedestrian_traffic (people/hour)

## ENVIRONMENT PARAMETERS (6):
7. air_quality_index (0-500 scale)
8. co2_emissions (tons/year)
9. noise_pollution (decibels)
10. green_space_coverage (%)
11. tree_canopy (%)
12. water_quality (score 0-100)

## ECONOMY PARAMETERS (6):
13. local_business_revenue ($ change/year)
14. property_values (% change)
15. employment_rate (%)
16. retail_foot_traffic (change %)
17. tax_revenue ($/year)
18. construction_jobs (number of jobs)

## SOCIAL PARAMETERS (6):
19. housing_affordability (% affordable units)
20. displacement_risk (people affected)
21. community_sentiment (score -100 to +100)
22. school_enrollment (change %)
23. crime_rate (% change)
24. public_safety_perception (score 0-100)

## INFRASTRUCTURE PARAMETERS (6):
25. parking_availability (spaces)
26. road_maintenance_needs ($/year)
27. utility_capacity (% available)
28. emergency_response_time (minutes)
29. waste_management (tons/day)
30. street_lighting (coverage %)

# MAPBOX VISUALIZATION STRATEGY
{viz_strategy}

# YOUR TASK - BE EXTREMELY TRANSPARENT AND DETAILED

You MUST be EXTREMELY VERBOSE and show your complete thinking process. Don't just say "Analyzing traffic..." 

Instead, write out your FULL thought process like:

"Looking at the policy, I need to understand the baseline conditions first.

BASELINE ANALYSIS:
- Current Market Street has 4 lanes carrying approximately 5,000 vehicles/hour during peak times
- Average speed is 15 mph due to congestion
- There are 3 major intersections: 5th St, 6th St, 7th St, and 8th St
- Current air quality index (AQI) is 85 (moderate)
- Noise levels average 78 decibels

POLICY IMPACT ANALYSIS:
If we close Market Street between 5th and 8th:
1. TRAFFIC REDISTRIBUTION: Those 5,000 vehicles/hour need alternate routes
   - 60% will likely divert to Mission Street (parallel, 2 blocks south)
   - 30% will use Harrison Street (4 blocks south)  
   - 10% will find other routes or change travel times
   
2. MISSION STREET IMPACT:
   - Currently handles 3,500 vehicles/hour
   - Adding 3,000 vehicles = 6,500 total (186% of current capacity)
   - This will increase congestion from 45% to 78%
   - Travel time increases from 8 minutes to 15 minutes (+87.5%)
   
3. AIR QUALITY:
   - Market Street: AQI improves from 85 to 45 (-47% improvement)
   - Mission Street: AQI worsens from 65 to 88 (+35% degradation)
   - Net citywide: Slight improvement of 3%

Now calculating all 30 parameters with this level of detail..."

SHOW YOUR WORK. EXPLAIN YOUR REASONING. BE TRANSPARENT.

Simulate the ACTUAL impact of the policy with REAL NUMBERS for each parameter.

## Output Format - MANDATORY:

First, write 2-3 pages of DETAILED ANALYSIS showing your complete thinking process, calculations, and reasoning.

Then, output TWO complete JSON blocks with ALL data.

### JSON Structure:
- baseline_value (before policy)
- projected_value (after policy)  
- change_amount (numeric change)
- change_percentage (% change)
- explanation (why this changed)

Example for ONE parameter:
```json
{{
  "peak_hour_congestion": {{
    "baseline": 78,
    "projected": 65,
    "change": -13,
    "change_pct": -16.7,
    "unit": "%",
    "explanation": "Car curfew after 11pm reduces overall daily congestion"
  }}
}}
```

## Analysis Requirements:

1. **Baseline State**
   - Current conditions for ALL 30 parameters
   - Realistic baseline values for {city}
   - Current problem areas

2. **Policy Impact - Be Specific!**
   For example, if policy is "limit car curfew to 11pm":
   - Traffic reduces by 20-40% after 11pm
   - Air quality improves by 10-15% (less emissions)
   - Noise pollution drops 25-35 decibels at night
   - Public transit usage increases 5-10% during day
   - Local business revenue may drop 5-15% for nighttime venues
   - Crime rate might change ±5-10% (needs policing adjustment)
   - Emergency response time could increase 2-4 minutes at night
   - etc.

3. **Realistic Numbers**
   Use realistic ranges based on real urban planning data
   Consider interconnected effects
   Show both positive AND negative impacts

4. **Geospatial Analysis**
   For Mapbox visualization, provide:
   - **Highlight Areas**: Specific locations to highlight (with coordinates/addresses)
   - **Impact Zones**: Areas affected (with severity levels)
   - **New Features**: What gets added (buildings, roads, parks, etc.)
   - **Removed Features**: What gets demolished or changed
   - **Heatmap Data**: Intensity of impact by area
   
4. **Detailed Area Breakdowns**
   For each significant area affected, provide:
   - Location identifier
   - Type of change
   - Before metrics
   - After metrics
   - Percentage change
   - Why this area is affected
   - Who is impacted
   - Visual representation suggestions

5. **Interactive Elements**
   For hover-over explanations on Mapbox:
   - Per-building or per-area explanations
   - What changed and why
   - Impact on residents/users
   - Related policy action

6. **Metrics & Quantification**
   - Key performance indicators
   - Numerical changes
   - Comparison to baseline
   - Confidence levels

7. **Alternative Scenarios** (if requested)
   - Best case scenario
   - Worst case scenario
   - Likely scenario

8. **Data for Next Agents**
   - Summary statistics
   - Key findings
   - Areas of concern
   - Areas of success

# OUTPUT FORMAT - CRITICAL

Provide detailed analysis in markdown, then include TWO JSON blocks:

**JSON BLOCK 1: All 30 Parameters**
```json
{{
  "parameters": {{
    "peak_hour_congestion": {{"baseline": X, "projected": Y, "change": Z, "change_pct": W, "unit": "%", "explanation": "..."}},
    "average_commute_time": {{"baseline": X, "projected": Y, "change": Z, "change_pct": W, "unit": "min", "explanation": "..."}},
    ... [ALL 30 PARAMETERS - DO NOT SKIP ANY]
  }},
  "overall_impact_score": X,
  "recommendation": "proceed|modify|reconsider"
}}
```

**JSON BLOCK 2: Mapbox Visualization (MUST INCLUDE 10+ REAL LOCATIONS)**
```json
{{
  "perspective": "{perspective}",
  "city": "{city}",
  "center_coordinates": [-122.4194, 37.7749],
  "impact_zones": [
    {{
      "id": "zone_1",
      "location": "Mission St & 16th St (Mission District)",
      "coordinates": [-122.4194, 37.7599],
      "type": "intersection",
      "change_type": "traffic_reduced",
      "impact_level": "high",
      "icon": "traffic-cone",
      "color": "#22c55e",
      "description": "Traffic reduced 30% after 11pm",
      "before_metrics": {{"congestion": 78, "volume": 5000, "accidents_monthly": 12}},
      "after_metrics": {{"congestion": 55, "volume": 3500, "accidents_monthly": 7}},
      "hover_explanation": "With car curfew at 11pm, this major corridor sees 30% less traffic at night, reducing accidents by 42% and improving air quality for 5,000 nearby residents. Noise pollution drops 28 decibels.",
      "affected_businesses": 45,
      "affected_residents": 5000
    }},
    {{
      "id": "zone_2",
      "location": "Market St & Van Ness Ave (Civic Center)",
      "coordinates": [-122.4161, 37.7799],
      "type": "major_intersection",
      "change_type": "transit_improved",
      "impact_level": "medium",
      "icon": "bus",
      "color": "#3b82f6",
      "hover_explanation": "Public transit usage increased 15% as alternative to late-night driving. New night bus routes added.",
      "before_metrics": {{"transit_riders": 8000}},
      "after_metrics": {{"transit_riders": 9200}}
    }},
    {{
      "id": "zone_3",
      "location": "SOMA District (2nd & Folsom)",
      "coordinates": [-122.3977, 37.7786],
      "type": "neighborhood",
      "change_type": "air_quality_improved",
      "impact_level": "high",
      "icon": "wind",
      "color": "#10b981",
      "hover_explanation": "AQI improved from 85 to 68 due to 40% reduction in nighttime vehicle emissions. Asthma incidents reduced 18%.",
      "before_metrics": {{"aqi": 85}},
      "after_metrics": {{"aqi": 68}}
    }}
    // ADD 7+ MORE REAL ZONES WITH SPECIFIC IMPACTS
  ],
  "blocked_roads": [
    {{
      "name": "Market Street (5th to 8th)",
      "coordinates": [[-122.4082, 37.7835], [-122.4102, 37.7845], [-122.4122, 37.7855]],
      "reason": "Policy restricts traffic on this segment",
      "impact": {{"delay": "+8 min", "traffic_increase_on_alternates": "25%"}},
      "severity": "high"
    }}
    // ADD MORE BLOCKED/AFFECTED ROADS
  ],
  "alternate_routes": [
    {{
      "name": "Mission Street",
      "coordinates": [[-122.4180, 37.7749], [-122.4200, 37.7760], [-122.4220, 37.7770]],
      "delay": "+5 min",
      "description": "Primary alternate route",
      "traffic_increase": "30%"
    }}
    // ADD MORE ALTERNATE ROUTES
  ],
  "heatmap_data": [
    {{"lat": 37.7599, "lng": -122.4194, "intensity": 0.9, "metric": "traffic_reduction", "value": -30}},
    {{"lat": 37.7799, "lng": -122.4161, "intensity": 0.6, "metric": "transit_increase", "value": 15}},
    {{"lat": 37.7786, "lng": -122.3977, "intensity": 0.8, "metric": "air_quality_improvement", "value": 20}}
    // ADD 15+ MORE HEATMAP POINTS ACROSS THE CITY
  ],
  "summary_metrics": {{
    "total_affected_area": "22 square miles",
    "population_impacted": 380000,
    "overall_benefit_score": 74,
    "key_improvements": ["30% traffic reduction", "20% air quality improvement"],
    "key_concerns": ["15% nighttime business revenue drop", "4min emergency response delay"]
  }},
  "visualization_layers": ["roads", "zones", "heatmap", "markers", "3d-buildings"]
}}
```

CRITICAL REQUIREMENTS FOR REAL DATA - THIS IS MANDATORY:

YOU ABSOLUTELY MUST INCLUDE THE SECOND JSON BLOCK WITH MAPBOX DATA. WITHOUT IT, THE VISUALIZATION WILL NOT WORK.

1. **You MUST provide AT LEAST 10 different REAL impact zones** with:
   - Actual street addresses or intersections in {city}
   - Exact GPS coordinates (lat/lng)
   - Specific hover_explanation for EACH zone explaining:
     * What changed at this specific location
     * WHY this location was affected by the policy
     * WHO is impacted (residents, businesses, commuters)
     * NUMBERS (before/after metrics specific to this location)

2. **You MUST provide AT LEAST 15 heatmap points** spread across {city} with real coordinates showing intensity of impact

3. **You MUST include blocked_roads array** with specific streets affected by the policy (with real coordinates)

4. **You MUST include alternate_routes array** showing detour paths (with real coordinates)

5. **Each impact zone MUST have**:
   - Real location name (e.g., "16th & Mission BART Station")
   - Coordinates within {city}'s boundaries
   - Logical connection to the policy
   - Detailed hover_explanation (100-200 characters)

REMEMBER: You MUST output BOTH JSON blocks. The second one is for the map visualization!

EXAMPLE OF GOOD OUTPUT:
If policy is "11PM car curfew", impact zones might include:
- Mission St & 16th St: Major nightlife area, 40% traffic reduction, 2000 residents benefit
- US-101 @ Cesar Chavez: Highway exit, 35% nighttime volume reduction
- Valencia St corridor: Restaurant district, -20% late revenue but +15% daytime
- Embarcadero: Tourist area, safer nighttime walking
- Financial District intersections: Reduced delivery truck conflicts

Begin your comprehensive simulation with ALL 30 parameters AND 15+ REAL SPECIFIC IMPACT ZONES:

FINAL REMINDER - YOU MUST OUTPUT BOTH JSON BLOCKS:
1. First ```json block: parameters data
2. Second ```json block: mapbox_data with blocked_roads, impact_zones, traffic_heatmap, alternate_routes

WITHOUT THE SECOND JSON BLOCK, THE MAP WILL NOT WORK!
"""
    
    def _determine_visualization_strategy(self, perspective: str) -> str:
        """Determine which Mapbox APIs and visualizations to use"""
        strategies = {
            "traffic": """
- Use Mapbox Traffic API for current flow data
- Highlight road segments with projected changes
- Show congestion heatmaps (before/after)
- Display new roads, removed parking, transit additions
- Color-code by traffic impact (red=worse, green=better)
""",
            "buildings": """
- Use Mapbox 3D buildings layer
- Highlight new construction sites
- Show demolitions with markers
- Display building height changes
- Show density changes by area
- Use building footprints API
""",
            "housing": """
- Highlight residential areas affected
- Show new housing units locations
- Display affordability impact zones
- Mark areas with increased/decreased housing
- Color-code by affordability change
""",
            "environment": """
- Show green space changes
- Display air quality impact zones
- Mark tree coverage changes
- Show water feature modifications
- Highlight environmental sensitive areas
""",
            "comprehensive": """
- Use multiple Mapbox layers simultaneously
- Buildings (3D), Traffic, Land use
- Show all types of changes
- Integrated heatmap of overall impact
- Multiple hover explanations per location
"""
        }
        
        return strategies.get(perspective.lower(), strategies["comprehensive"])
    
    async def execute(self) -> Dict[str, Any]:
        full_analysis = ""
        async for token in self.stream_execute():
            full_analysis += token
        
        # Extract BOTH JSON blocks for complete visualization
        parameters_data = self._extract_parameters_data(full_analysis)
        mapbox_data = self._extract_mapbox_data(full_analysis)
        
        return {
            "analysis": full_analysis,
            "parameters": parameters_data,
            "mapbox_data": mapbox_data,
            "perspective": self.custom_input.get("perspective", "comprehensive"),
            "agent_type": "simulation"
        }
    
    def _extract_parameters_data(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract the parameters JSON from the analysis"""
        try:
            # Look for first JSON code block (parameters)
            import re
            json_blocks = re.findall(r'```json\s*(\{[\s\S]*?\})\s*```', text)
            if json_blocks and len(json_blocks) > 0:
                return json.loads(json_blocks[0])
        except:
            pass
        return None
    
    def _extract_mapbox_data(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract the SECOND JSON block for Mapbox visualization"""
        try:
            import re
            json_blocks = re.findall(r'```json\s*(\{[\s\S]*?\})\s*```', text)
            print(f"[DEBUG] Found {len(json_blocks)} JSON blocks in simulation output")
            
            if json_blocks and len(json_blocks) > 1:
                # Return the second JSON block (Mapbox data)
                mapbox_json = json.loads(json_blocks[1])
                print(f"[DEBUG] Extracted mapbox_data with keys: {list(mapbox_json.keys())}")
                return mapbox_json
            elif json_blocks and len(json_blocks) == 1:
                # Check if the single block contains mapbox data
                data = json.loads(json_blocks[0])
                if 'blocked_roads' in data or 'impact_zones' in data or 'traffic_heatmap' in data:
                    print(f"[DEBUG] Found mapbox data in single JSON block")
                    return data
            
            print("[WARNING] No mapbox_data found in AI output!")
            return None
        except Exception as e:
            print(f"[ERROR] Failed to extract mapbox_data: {e}")
            return None


class EnhancedDebateAgent(BaseAgent):
    """
    Debate Agent that uses simulation info to generate arguments
    Generates reports with human-in-the-loop capability
    """
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.DEBATE, task, config)
    
    def build_prompt(self) -> str:
        rounds = self.custom_input.get("rounds", 3)
        focus_areas = self.custom_input.get("focus_areas", [])
        human_question = self.custom_input.get("human_question", None)
        
        return f"""You are a Debate Agent conducting a CONVERSATIONAL back-and-forth analysis of the policy.

# POLICY PROPOSAL
{self.task.description}

# SIMULATION DATA AVAILABLE
{self.build_context_section()}

# DEBATE CONFIGURATION
- Rounds: {rounds}
- Focus Areas: {', '.join(focus_areas) if focus_areas else 'All aspects'}
{f"- Human Question: {human_question}" if human_question else ""}

NOTE: You have access to simulation results with ALL 30 parameters. Use this data in your arguments!

# OUTPUT FORMAT - CHAT STYLE MESSAGES

Structure your debate as a back-and-forth conversation between two agents.

For EACH message, use this format:

---
**SIDE**: FOR | AGAINST
**ROUND**: 1 | 2 | 3
**MESSAGE**:
[Your argument here - conversational, direct, engaging]

[Reference specific data from simulation]
[Make clear points]
[Be persuasive but fair]
---

Make it feel like a real debate - agents should:
- Reference each other's points
- Challenge assumptions
- Bring up new evidence
- Build on previous arguments
- Quote specific numbers from the simulation data

# YOUR TASK

Generate a dynamic, engaging debate analyzing the policy proposal.

## Debate Structure:

### Round 1: Opening Arguments
**FOR the Proposal:**
- Main benefits and positive impacts
- Evidence from simulations
- Why this policy is needed now
- Key constituencies that benefit

**AGAINST the Proposal:**
- Main concerns and negative impacts
- Evidence from simulations
- Why this policy is problematic
- Key constituencies that suffer

### Round 2: Rebuttal and Deep Analysis
**FOR (responding to concerns):**
- Address the criticisms
- Mitigation strategies
- Why benefits outweigh costs
- Long-term perspective

**AGAINST (responding to benefits):**
- Question the assumptions
- Highlight hidden costs
- Alternative approaches
- Short-term vs long-term trade-offs

### Round 3: Synthesis and Recommendations
**FOR:**
- Strongest arguments summary
- Conditions for success
- Modifications that would help

**AGAINST:**
- Strongest concerns summary
- Deal-breakers
- What would need to change

## Analysis Sections:

### Stakeholder Impact Analysis
For each major stakeholder group:
- Impact (positive/negative/mixed)
- Magnitude of impact
- Their likely position
- Their concerns/support

### Risk Assessment
- **Political Risks**: [high/medium/low] - explain
- **Implementation Risks**: [high/medium/low] - explain  
- **Financial Risks**: [high/medium/low] - explain
- **Social Risks**: [high/medium/low] - explain
- **Environmental Risks**: [high/medium/low] - explain

### Sentiment Analysis
- Overall sentiment balance (0-100, where 50 is neutral)
- Confidence level in projections
- Key uncertainty factors

### Areas for Human Review
Flag specific aspects that need human decision-making:
- Trade-offs that require value judgments
- Data gaps that need filling
- Political considerations
- Ethical considerations

## Final Recommendation
Based on the debate, provide:
- Proceed / Modify / Reconsider
- Key modifications needed
- Critical questions to resolve
- Next steps for decision-makers

Generate the complete debate analysis:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_debate = ""
        async for token in self.stream_execute():
            full_debate += token
        
        return {
            "debate_analysis": full_debate,
            "requires_human_review": True,
            "agent_type": "debate"
        }


class EnhancedAggregatorAgent(BaseAgent):
    """
    Aggregator Agent that compiles everything into a PDF draft
    Summarizes pros/cons and suggests next steps
    """
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.AGGREGATOR, task, config)
    
    def build_prompt(self) -> str:
        output_format = self.custom_input.get("format", "PDF")
        include_sections = self.custom_input.get("sections", [
            "executive_summary", "simulations", "debate", "recommendations"
        ])
        
        return f"""You are an Aggregator Agent compiling a comprehensive policy analysis report.

# OUTPUT FORMAT
{output_format} (structure content accordingly)

# SECTIONS TO INCLUDE
{', '.join(include_sections)}

# ALL AVAILABLE DATA
{self.build_context_section()}

# YOUR TASK

Compile a complete, publication-ready policy analysis document that synthesizes all the work from previous agents.

# DOCUMENT STRUCTURE

## Cover Page
- Title: [Policy/Initiative Name]
- Subtitle: Comprehensive Analysis and Recommendations
- Date
- Prepared for: [Politician/Office]
- Executive Summary Preview

## Table of Contents
[Auto-generated based on sections]

## Executive Summary (2-3 pages)
High-level overview for decision-makers who may only read this section:
- What is being proposed
- Why it matters
- Key findings from simulations
- Overall assessment (recommend/modify/reconsider)
- Critical next steps
- Timeline

## Background and Context (3-5 pages)
- Problem statement
- Current situation
- Policy objectives
- Stakeholder landscape
- Political context

## Simulation Results (5-10 pages)

For each perspective analyzed:
### [Perspective Name] Analysis
- Current baseline
- Projected changes
- Geographic impact distribution
- Key metrics and data
- Visual representation descriptions
- Confidence levels

### Comprehensive Impact Summary
- Overall changes across all perspectives
- Interconnections between impacts
- Cumulative effects
- Timeline of changes

## Debate Analysis and Stakeholder Perspectives (5-7 pages)

### Arguments FOR the Proposal
- Strongest supporting arguments
- Evidence and data
- Beneficiaries
- Long-term benefits

### Arguments AGAINST the Proposal
- Strongest concerns
- Evidence and data
- Those negatively affected
- Risks and downsides

### Stakeholder-by-Stakeholder Analysis
For each major stakeholder group:
- Their perspective
- Their interests
- Likely position
- Engagement strategy

### Risk Assessment Matrix
Political, Implementation, Financial, Social, Environmental risks with mitigation strategies

## Pros and Cons Summary (2-3 pages)

### PROS
1. [Benefit] - [Evidence] - [Magnitude]
2. [Benefit] - [Evidence] - [Magnitude]
...

### CONS
1. [Concern] - [Evidence] - [Magnitude]
2. [Concern] - [Evidence] - [Magnitude]
...

### Net Assessment
Overall balance and judgment

## Recommendations (3-5 pages)

### Primary Recommendation
[Proceed / Modify First / Reconsider]

### If Proceed:
- Implementation timeline
- Quick wins to pursue first
- Stakeholder engagement plan
- Communication strategy
- Success metrics
- Review points

### If Modify:
- Specific modifications needed
- Why each modification is important
- How to implement modifications
- Re-analysis requirements

### If Reconsider:
- Why the proposal isn't ready
- What would need to change
- Alternative approaches to consider
- Timeline for reconsideration

## Next Steps and Action Plan (2-3 pages)

### Immediate Actions (0-30 days)
1. [Action] - [Owner] - [Deadline]
2. [Action] - [Owner] - [Deadline]
...

### Short-term Actions (30-90 days)
1. [Action] - [Owner] - [Deadline]
...

### Medium-term Actions (90-180 days)
1. [Action] - [Owner] - [Deadline]
...

### Decision Points
- What decisions need to be made
- When they need to be made
- What information is needed
- Who should be involved

## Appendices
- Detailed simulation data
- Full debate transcripts
- Stakeholder analysis details
- Data sources and methodology
- Glossary of terms

## Conclusion
Final synthesis and call to action

---

# FORMATTING GUIDELINES

- Use professional, clear language
- Include page numbers
- Use consistent heading hierarchy
- Include data tables where appropriate
- Describe where charts/graphs should go
- Use bullet points for clarity
- Bold key findings
- Include executive-friendly summaries at start of each section

Generate the complete report document:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_report = ""
        async for token in self.stream_execute():
            full_report += token
        
        return {
            "final_report": full_report,
            "format": self.custom_input.get("format", "PDF"),
            "ready_for_export": True,
            "agent_type": "aggregator"
        }

