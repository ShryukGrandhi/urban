# URBAN Multi-Agent Backend

A flexible, scalable multi-agent system for policy analysis, simulations, and content generation.

## 🌟 Overview

This backend provides a comprehensive multi-agent architecture where **each task is a unique agent** working directly with simulated data and aggregated context. The system is extremely flexible and supports 13+ different agent types for various policy analysis and communication needs.

## 🏗️ Architecture

### Core Workflow

```
1. Consulting Agent (Supervisor)
   ↓ Determines politician's goals and creates strategy
   
2. Simulation Agent
   ↓ Runs simulations with Mapbox visualization
   ↓ Supports multiple perspectives (traffic, buildings, environment, etc.)
   ↓ Human-in-the-loop for adjustments
   
3. Debate Agent
   ↓ Analyzes pros/cons using simulation data
   ↓ Generates comprehensive debate reports
   ↓ Human-in-the-loop for review
   
4. Aggregator Agent
   ↓ Compiles final PDF/report
   ↓ Summarizes everything with recommendations
   └─ Ready for decision-making
```

### Agent Types

#### Core Workflow Agents
- **🎯 CONSULTING (Supervisor)**: Determines goals, acts as orchestrator
- **🔬 SIMULATION**: Runs policy impact simulations with Mapbox
- **💬 DEBATE**: Generates pro/con arguments and analysis
- **📄 AGGREGATOR**: Compiles comprehensive reports

#### Specialized Agents
- **📊 REPORT**: Generate detailed analytical reports
- **📞 MEDIA_CALLING**: Contact and coordinate with media
- **📋 PLANNING**: Create strategic action plans
- **🎨 PITCH_DECK**: Create slide decks and presentations
- **📰 NEWS_AGENT**: Generate news articles and press releases
- **📈 DATA_ANALYST**: Deep dive data analysis
- **📱 SOCIAL_MEDIA**: Manage social media campaigns
- **👥 STAKEHOLDER**: Simulate stakeholder perspectives
- **✍️ POLICY_WRITER**: Draft formal policy documents

## 🚀 Quick Start

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file:

```env
GEMINI_API_KEY=your_google_gemini_api_key
BACKEND_PORT=3001
MAPBOX_ACCESS_TOKEN=your_mapbox_token  # Optional, for enhanced features
```

### Run the Server

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

The API will be available at `http://localhost:3001`

### API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3001/docs
- **ReDoc**: http://localhost:3001/redoc

## 📡 API Endpoints

### Agent Execution

```bash
POST /api/agents/execute
```

Execute a single agent task:

```json
{
  "agent_type": "CONSULTING",
  "description": "Determine the goals for the housing policy initiative",
  "simulation_data": {},
  "policy_data": {},
  "custom_input": {
    "politician_info": {
      "name": "Mayor Johnson",
      "priorities": ["affordable housing", "sustainability"]
    },
    "initial_request": "Analyze new zoning ordinance"
  },
  "config": {
    "temperature": 0.7,
    "streaming": true
  },
  "stream": true
}
```

### Agent Chain Execution

```bash
POST /api/agents/chain
```

Execute multiple agents in sequence:

```json
{
  "agents": [
    {
      "agent_type": "CONSULTING",
      "description": "Define strategy and goals"
    },
    {
      "agent_type": "SIMULATION",
      "description": "Run traffic impact simulation",
      "custom_input": {
        "perspective": "traffic",
        "city": "San Francisco, CA"
      }
    },
    {
      "agent_type": "DEBATE",
      "description": "Analyze pros and cons"
    }
  ],
  "simulation_data": {},
  "policy_data": {}
}
```

### WebSocket Streaming

```javascript
const ws = new WebSocket('ws://localhost:3001/ws/client-123');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'execute',
    agent_type: 'SIMULATION',
    description: 'Analyze traffic impact',
    custom_input: { perspective: 'traffic' }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'token') {
    console.log('Token:', data.token);
  } else if (data.type === 'complete') {
    console.log('Done:', data.result);
  }
};
```

### Get Available Agent Types

```bash
GET /api/agent-types
```

Returns all agent types with their capabilities and requirements.

### Orchestrator Status

```bash
GET /api/orchestrator/stats
```

Get statistics about agent execution.

```bash
GET /api/orchestrator/context
```

Get current aggregated context.

```bash
GET /api/orchestrator/tasks
```

Get all completed tasks.

## 🧠 Agent Configuration

Each agent can be configured with:

```python
{
  "temperature": 0.7,        # LLM creativity (0.0-2.0)
  "max_tokens": 4096,        # Maximum output length
  "model": "gemini-1.5-flash-latest",
  "use_simulation_data": true,
  "use_aggregated_context": true,
  "output_format": "markdown",  # markdown, json, html
  "target_audience": "policymakers",
  "tone": "professional",
  "streaming": true
}
```

## 🔄 Workflow Examples

### Example 1: Complete Policy Analysis

```python
# 1. Start with Consulting Agent (Supervisor)
consulting_response = await execute_agent({
    "agent_type": "CONSULTING",
    "description": "Analyze new affordable housing policy for Mayor",
    "custom_input": {
        "politician_info": {...},
        "initial_request": "500 new affordable units"
    }
})

# 2. Run Simulations (multiple perspectives)
traffic_sim = await execute_agent({
    "agent_type": "SIMULATION",
    "description": "Traffic impact analysis",
    "custom_input": {"perspective": "traffic"}
})

housing_sim = await execute_agent({
    "agent_type": "SIMULATION",
    "description": "Housing impact analysis",
    "custom_input": {"perspective": "housing"}
})

# 3. Generate Debate
debate = await execute_agent({
    "agent_type": "DEBATE",
    "description": "Analyze pros and cons"
})

# 4. Compile Final Report
report = await execute_agent({
    "agent_type": "AGGREGATOR",
    "description": "Compile final PDF report",
    "custom_input": {"format": "PDF"}
})
```

### Example 2: Media Campaign

```python
# Generate news content
news = await execute_agent({
    "agent_type": "NEWS_AGENT",
    "description": "Press release for policy announcement"
})

# Create social media campaign
social = await execute_agent({
    "agent_type": "SOCIAL_MEDIA",
    "description": "2-week social media campaign",
    "custom_input": {
        "platforms": ["Twitter", "LinkedIn", "Facebook"]
    }
})

# Prepare media outreach
media = await execute_agent({
    "agent_type": "MEDIA_CALLING",
    "description": "Media outreach materials",
    "custom_input": {
        "urgency": "high",
        "media_list": ["NY Times", "Washington Post"]
    }
})
```

## 🗺️ Mapbox Integration

The Enhanced Simulation Agent provides structured data for Mapbox visualization:

```json
{
  "perspective": "traffic",
  "impact_zones": [
    {
      "location": "Market Street, SF",
      "type": "road",
      "change_type": "modified",
      "impact_level": "high",
      "description": "New bus lane reduces car traffic by 30%",
      "metrics": {
        "before_congestion": 0.8,
        "after_congestion": 0.5
      },
      "hover_explanation": "This area will see..."
    }
  ],
  "heatmap_data": [...],
  "visualization_layers": ["roads", "transit"]
}
```

## 🔍 Context Aggregation

Agents automatically accumulate context:

- Simulation results feed into debate agents
- Debate analysis feeds into aggregator
- All agent outputs are available to subsequent agents
- Context is automatically managed by the orchestrator

## 🎯 Human-in-the-Loop

The system supports human intervention at any point:

1. **Review agent output** before proceeding
2. **Modify inputs** and re-run agents
3. **Request different perspectives** 
4. **Adjust simulations** based on feedback
5. **Guide the workflow** as needed

## 📊 Monitoring & Debugging

Check orchestrator stats:

```bash
curl http://localhost:3001/api/orchestrator/stats
```

View completed tasks:

```bash
curl http://localhost:3001/api/orchestrator/tasks
```

Clear context (start fresh):

```bash
curl -X POST http://localhost:3001/api/orchestrator/context/clear
```

## 🔐 Security Notes

- Set strong `GEMINI_API_KEY`
- Use CORS properly in production
- Consider rate limiting for production
- Validate all inputs
- Use HTTPS in production

## 📝 Development

### Project Structure

```
backend/
├── create_agents/
│   ├── agent_types.py           # Agent type definitions
│   ├── base_agent.py            # Base agent class
│   ├── specialized_agents.py    # All specialized agents
│   └── core_workflow_agents.py  # Core workflow agents
├── simulation_agents/
│   └── orchestrate.py           # Agent orchestration
├── tools/
│   ├── mapbox_mcp.py           # Mapbox integration (placeholder)
│   ├── tavily_mcp.py           # Web search (placeholder)
│   └── brightdata_mcp.py       # Data scraping (placeholder)
├── main.py                      # FastAPI app
├── requirements.txt             # Dependencies
└── README.md                    # This file
```

### Adding New Agent Types

1. Define agent type in `agent_types.py`
2. Add capability definition
3. Create agent class in `specialized_agents.py`
4. Add to factory function
5. Update frontend agent list

## 🚢 Deployment

### Docker (Recommended)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

ENV BACKEND_PORT=3001
EXPOSE 3001

CMD ["python", "main.py"]
```

### Environment Variables for Production

```env
GEMINI_API_KEY=xxx
BACKEND_PORT=3001
CORS_ORIGIN=https://your-frontend.com
LOG_LEVEL=INFO
```

## 📄 License

[Your License Here]

## 🤝 Contributing

[Contributing Guidelines]

## 📞 Support

For issues or questions, please [file an issue](your-repo-url/issues).


