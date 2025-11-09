# URBAN Multi-Agent System - Complete Usage Guide

## 🎯 Overview

URBAN is a flexible multi-agent system for government policy analysis. Each task is executed by a unique agent that works directly with simulated data and aggregated context. The system is **extremely flexible** and supports any type of policy analysis workflow.

## 🏗️ Core Architecture

### The Four Core Agents

```
┌─────────────────────────────────────────────────────────┐
│  1. CONSULTING AGENT (SUPERVISOR)                       │
│  → Determines politician's goals                        │
│  → Creates strategic framework                          │
│  → Acts as workflow orchestrator                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. SIMULATION AGENT                                    │
│  → Simulates policy impacts                            │
│  → Works with Mapbox for visualization                 │
│  → Multiple perspectives (traffic, buildings, etc.)    │
│  → Human-in-the-loop for adjustments                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. DEBATE AGENT                                        │
│  → Analyzes pros and cons                              │
│  → Uses simulation data                                │
│  → Generates comprehensive reports                     │
│  → Human review points                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. AGGREGATOR AGENT                                    │
│  → Compiles final PDF report                           │
│  → Summarizes everything                               │
│  → Provides recommendations                            │
│  → Suggests next steps                                 │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

```bash
# Backend
Python 3.11+
Google Gemini API key

# Frontend
Node.js 18+
npm or yarn
```

### Installation

**Backend:**
```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_key_here" > .env
echo "BACKEND_PORT=3001" >> .env

# Run server
python main.py
```

**Frontend:**
```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env

# Run dev server
npm run dev
```

## 📋 Complete Workflow Example

### Scenario: Affordable Housing Initiative

#### Step 1: Consulting Agent (Supervisor)

**Input:**
```json
{
  "agent_type": "CONSULTING",
  "description": "Analyze new affordable housing policy for Mayor",
  "custom_input": {
    "politician_info": {
      "name": "Mayor Johnson",
      "city": "San Francisco",
      "priorities": ["affordable housing", "sustainability"],
      "constraints": ["budget: $50M", "timeline: 2 years"]
    },
    "initial_request": "Build 500 new affordable housing units in Mission District"
  }
}
```

**Output:**
- Strategic framework
- Goals and objectives
- Analysis requirements
- Simulation requirements (what perspectives to analyze)
- Stakeholder map
- Success criteria
- Next steps

#### Step 2: Simulation Agent (Multiple Perspectives)

**Run Multiple Simulations:**

**A. Traffic Impact:**
```json
{
  "agent_type": "SIMULATION",
  "description": "Analyze traffic impact of 500 new housing units",
  "custom_input": {
    "perspective": "traffic",
    "city": "San Francisco, CA",
    "policy_document": "Add 500 affordable units at Mission & 16th"
  }
}
```

**Mapbox Output:**
- Highlights affected road segments
- Shows congestion changes (red = worse, green = better)
- Hover over streets to see detailed impacts
- Heatmap of traffic density changes

**B. Building/Structure Impact:**
```json
{
  "agent_type": "SIMULATION",
  "description": "Analyze building and structural changes",
  "custom_input": {
    "perspective": "buildings",
    "city": "San Francisco, CA"
  }
}
```

**Mapbox Output:**
- 3D building visualizations
- New construction sites marked
- Demolished buildings shown
- Hover to see before/after metrics
- Building density changes by area

**C. Housing Market Impact:**
```json
{
  "agent_type": "SIMULATION",
  "description": "Analyze housing affordability impact",
  "custom_input": {
    "perspective": "housing"
  }
}
```

**D. Environmental Impact:**
```json
{
  "agent_type": "SIMULATION",
  "description": "Analyze environmental effects",
  "custom_input": {
    "perspective": "environment"
  }
}
```

#### Step 3: Debate Agent

**Input:**
```json
{
  "agent_type": "DEBATE",
  "description": "Analyze pros and cons of housing initiative",
  "custom_input": {
    "rounds": 3,
    "focus_areas": ["affordability", "traffic", "community impact"]
  }
}
```

**Output:**
- Round 1: Opening arguments (FOR and AGAINST)
- Round 2: Rebuttals and deep analysis
- Round 3: Synthesis and recommendations
- Stakeholder impact analysis
- Risk assessment (Political, Implementation, Financial, Social, Environmental)
- Sentiment analysis
- Areas requiring human review
- Final recommendation (Proceed/Modify/Reconsider)

**Human-in-the-Loop Points:**
- Review arguments
- Add additional concerns
- Request clarifications
- Adjust analysis focus
- Re-run with different parameters

#### Step 4: Aggregator Agent

**Input:**
```json
{
  "agent_type": "AGGREGATOR",
  "description": "Compile comprehensive policy analysis report",
  "custom_input": {
    "format": "PDF",
    "sections": [
      "executive_summary",
      "simulations",
      "debate",
      "recommendations"
    ]
  }
}
```

**Output - Complete PDF Report:**

1. **Executive Summary** (2-3 pages)
   - High-level overview for decision-makers
   - Key findings
   - Overall recommendation

2. **Background & Context** (3-5 pages)
   - Problem statement
   - Current situation
   - Policy objectives

3. **Simulation Results** (5-10 pages)
   - Traffic analysis with maps
   - Building/structure changes
   - Housing market impact
   - Environmental effects
   - Comprehensive impact summary

4. **Debate Analysis** (5-7 pages)
   - Arguments FOR
   - Arguments AGAINST
   - Stakeholder perspectives
   - Risk assessment matrix

5. **Pros and Cons Summary** (2-3 pages)
   - Clear list with evidence
   - Net assessment

6. **Recommendations** (3-5 pages)
   - Primary recommendation
   - Implementation timeline
   - Modifications needed
   - Alternative approaches

7. **Next Steps** (2-3 pages)
   - Immediate actions (0-30 days)
   - Short-term actions (30-90 days)
   - Medium-term actions (90-180 days)
   - Decision points

8. **Appendices**
   - Detailed data
   - Methodology
   - Sources

## 🗺️ Mapbox Integration - How It Works

### Flexible Visualization

The Simulation Agent automatically determines which Mapbox APIs to use based on the perspective:

**Traffic Perspective:**
- Uses Mapbox Traffic API
- Highlights road segments
- Shows congestion heatmaps
- Displays before/after comparisons

**Buildings Perspective:**
- Uses 3D Buildings layer
- Shows new constructions
- Marks demolitions
- Displays height/density changes

**Housing Perspective:**
- Highlights residential areas
- Shows new units locations
- Displays affordability zones
- Color-coded impact levels

**Environment Perspective:**
- Shows green space changes
- Air quality zones
- Tree coverage
- Water features

### Hover Explanations

Every area on the map provides detailed information on hover:

```javascript
// Example hover data
{
  "location": "Mission St & 16th St",
  "change_type": "new_building",
  "description": "New 8-story affordable housing building",
  "metrics": {
    "units": 120,
    "affordability_level": "60% AMI",
    "completion_date": "Q4 2025"
  },
  "impact": {
    "traffic": "+15% local traffic",
    "parking": "-20 street parking spots",
    "transit_usage": "+200 daily BART riders"
  },
  "affected_parties": [
    "New residents: 300 people",
    "Local businesses: 15 within 2 blocks",
    "Current residents: 500 within 3 blocks"
  ]
}
```

### Multiple Perspectives Example

**User:** "How would this change traffic?"
→ Shows traffic visualization with congestion, new routes, parking changes

**User:** "Now show me how it affects building structures"
→ Switches to 3D buildings view, highlights new construction, shows density

**User:** "What about the environmental impact?"
→ Shows green spaces, air quality zones, environmental scores

## 🔄 Human-in-the-Loop Features

### During Simulation

1. **Pause and adjust:** Change parameters mid-simulation
2. **Request different perspective:** "Show me housing instead of traffic"
3. **Zoom into areas:** "Focus on 16th Street corridor"
4. **Ask questions:** "Why is this area affected more?"

### During Debate

1. **Add concerns:** "What about parking issues?"
2. **Request deeper analysis:** "Analyze impact on small businesses"
3. **Adjust focus:** "Focus more on environmental concerns"

### Before Aggregation

1. **Select sections:** Choose what goes in final report
2. **Adjust recommendations:** Modify suggested next steps
3. **Add custom content:** Insert additional analysis

## 🎨 Additional Agent Types

Beyond the core workflow, you can use specialized agents:

### Report Agent
Generate specific reports on any topic:
```json
{
  "agent_type": "REPORT",
  "description": "Generate traffic study report",
  "custom_input": {
    "report_type": "traffic analysis",
    "target_audience": "city council"
  }
}
```

### Media Calling Agent
Prepare media outreach:
```json
{
  "agent_type": "MEDIA_CALLING",
  "description": "Prepare media campaign for housing announcement",
  "custom_input": {
    "urgency": "high",
    "media_list": ["SF Chronicle", "Mission Local", "KQED"]
  }
}
```

### Planning Agent
Create implementation plans:
```json
{
  "agent_type": "PLANNING",
  "description": "Create 18-month implementation plan",
  "custom_input": {
    "timeline": "18 months",
    "budget": "$50M"
  }
}
```

### Pitch Deck Agent
Create presentations:
```json
{
  "agent_type": "PITCH_DECK",
  "description": "Create pitch deck for city council",
  "custom_input": {
    "duration": "15 minutes",
    "audience": "city council members"
  }
}
```

### Social Media Agent
Plan social campaigns:
```json
{
  "agent_type": "SOCIAL_MEDIA",
  "description": "2-week social media campaign",
  "custom_input": {
    "platforms": ["Twitter", "Facebook", "Instagram"],
    "schedule": "2 weeks"
  }
}
```

### Data Analyst Agent
Deep data analysis:
```json
{
  "agent_type": "DATA_ANALYST",
  "description": "Analyze demographic trends",
  "custom_input": {
    "analysis_questions": [
      "Who will benefit most?",
      "What are the displacement risks?"
    ]
  }
}
```

### Stakeholder Agent
Simulate perspectives:
```json
{
  "agent_type": "STAKEHOLDER",
  "description": "Simulate local business owner perspective",
  "custom_input": {
    "stakeholder_type": "small business owner"
  }
}
```

### Policy Writer Agent
Draft legislation:
```json
{
  "agent_type": "POLICY_WRITER",
  "description": "Draft zoning ordinance amendment",
  "custom_input": {
    "legal_framework": "SF Municipal Code"
  }
}
```

## 🔗 Agent Chaining

Run multiple agents in sequence:

```json
{
  "agents": [
    {
      "agent_type": "CONSULTING",
      "description": "Define strategy"
    },
    {
      "agent_type": "SIMULATION",
      "description": "Run simulation",
      "custom_input": {"perspective": "traffic"}
    },
    {
      "agent_type": "DATA_ANALYST",
      "description": "Deep dive on simulation data"
    },
    {
      "agent_type": "REPORT",
      "description": "Generate technical report"
    }
  ]
}
```

Each agent automatically receives context from previous agents!

## 📊 Real-World Use Cases

### Use Case 1: Transportation Policy
1. Consulting → Define goals for new bus rapid transit
2. Simulation → Traffic, environmental, economic impacts
3. Debate → Community concerns vs benefits
4. Aggregator → Final BRT proposal report
5. Media Calling → Press outreach
6. Social Media → Public engagement campaign

### Use Case 2: Zoning Change
1. Consulting → Clarify objectives
2. Simulation → Building, housing, community impacts
3. Stakeholder × 3 → Simulate residents, businesses, developers
4. Debate → Pros/cons analysis
5. Policy Writer → Draft ordinance
6. Aggregator → Complete proposal package

### Use Case 3: Environmental Initiative
1. Consulting → Define green space goals
2. Simulation → Environmental, community, economic impacts
3. Data Analyst → Analyze environmental data
4. Debate → Cost-benefit analysis
5. Pitch Deck → Present to council
6. Planning → 5-year implementation plan

## 🛠️ Advanced Features

### Context Aggregation

All agents share context automatically:
- Simulation results feed into debate
- Debate analysis feeds into aggregator
- Custom data flows between agents
- 10 most recent results kept per agent type

### Custom Configurations

Fine-tune each agent:
```json
{
  "config": {
    "temperature": 0.7,        // Creativity (0.0-2.0)
    "max_tokens": 8000,        // Output length
    "use_simulation_data": true,
    "use_aggregated_context": true,
    "output_format": "markdown",
    "target_audience": "city council",
    "tone": "professional"
  }
}
```

### Monitoring

Track progress in real-time:
```bash
GET /api/orchestrator/stats
GET /api/orchestrator/context
GET /api/orchestrator/tasks
```

## 🎓 Best Practices

1. **Start with Consulting Agent** - Always begin with the supervisor to clarify goals

2. **Run Multiple Simulation Perspectives** - Get comprehensive view before debate

3. **Use Human-in-the-Loop** - Review and adjust at each step

4. **Chain Related Agents** - Use agent chains for complex workflows

5. **Save Context** - Keep aggregated context for future reference

6. **Export Early, Export Often** - Generate reports at multiple stages

7. **Leverage Specialized Agents** - Use right agent for each task

## 🐛 Troubleshooting

**Backend won't start:**
- Check Python version (3.11+)
- Verify GEMINI_API_KEY is set
- Install all requirements: `pip install -r requirements.txt`

**No streaming output:**
- Check WebSocket connection
- Verify CORS settings
- Check browser console for errors

**Mapbox not showing:**
- Set VITE_MAPBOX_TOKEN in frontend/.env
- Check map initialization in browser console

**Agent execution fails:**
- Check API key validity
- Verify input format
- Check backend logs for details

## 📞 Support

For issues, check:
- Backend logs: console output when running main.py
- Frontend console: browser developer tools
- API docs: http://localhost:3001/docs

## 🎯 Summary

The URBAN Multi-Agent System provides:

✅ **Flexible Architecture** - Each task is a unique agent  
✅ **Human-in-the-Loop** - Review and adjust at any point  
✅ **Mapbox Integration** - Rich visual simulations  
✅ **Multiple Perspectives** - Analyze from any angle  
✅ **Comprehensive Reports** - PDF outputs with recommendations  
✅ **Real-time Streaming** - Watch agents work live  
✅ **Context Sharing** - Agents build on each other's work  
✅ **13+ Agent Types** - Right tool for every task  

Start with the core workflow (Consulting → Simulation → Debate → Aggregator) and expand from there!


