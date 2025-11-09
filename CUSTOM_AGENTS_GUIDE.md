# Custom Agents Usage Guide

## 🚀 Quick Start

### 1. Create a Custom Agent

1. Go to http://localhost:3000/agents
2. Click **"Create New Agent"** button
3. Choose your agent type from 13 specialized options
4. Fill in the details:
   - **Name**: Give your agent a unique name
   - **Role**: Describe what the agent should do
   - **Description**: Optional details about scope
   - **Sources**: Optional data sources

### 2. Execute Your Agent

1. Find your created agent in the dashboard
2. Click the **"Execute Agent"** button
3. Fill in execution parameters (explained below)
4. Click **"Execute"** to start
5. Watch the streaming output in real-time!

---

## 📋 Agent Types & Examples

### 🎯 Media Calling Agent
**What it does**: Creates media outreach materials including call scripts, email templates, media kits, and follow-up schedules.

**Example Custom Input**:
```json
{
  "target": "journalist@nytimes.com",
  "urgency": "high",
  "tone": "professional",
  "media_list": ["NY Times", "Washington Post", "CNN"],
  "key_message": "New urban development policy reduces traffic by 30%"
}
```

**Example Output**:
- Professional call scripts for journalists
- Email templates with compelling subject lines
- One-page media kit with key facts
- Follow-up schedule and contact log template

---

### 📰 News Agent (Propaganda)
**What it does**: Generates news articles, press releases, and public-facing content about policies.

**Example Custom Input**:
```json
{
  "audience": "general public",
  "tone": "optimistic and informative",
  "headline_focus": "environmental benefits",
  "word_count": 800
}
```

**Example Output**:
- Full press release
- Social media posts
- FAQ sheet
- Sound bites for interviews

---

### 📊 Report Agent
**What it does**: Creates comprehensive analytical reports with executive summaries, findings, and recommendations.

**Example Custom Input**:
```json
{
  "report_type": "impact analysis",
  "audience": "city council",
  "include_charts": true,
  "focus_areas": ["economic", "environmental", "social"]
}
```

**Example Output**:
- Executive summary
- Data-driven findings
- Visual chart descriptions
- Actionable recommendations

---

### 📅 Planning Agent
**What it does**: Develops strategic plans for government initiatives with timelines, budgets, and risk management.

**Example Custom Input**:
```json
{
  "timeline": "12 months",
  "budget": "$5M",
  "objectives": ["reduce traffic", "improve air quality"],
  "stakeholders": ["city council", "residents", "businesses"]
}
```

**Example Output**:
- Phased action plan
- Resource allocation
- Risk mitigation strategies
- Communication plan

---

### 💼 Consulting Agent
**What it does**: Provides expert strategic advice on policy decisions with multiple perspectives.

**Example Custom Input**:
```json
{
  "decision": "implement congestion pricing",
  "concerns": ["public backlash", "economic impact"],
  "priority": "balanced approach"
}
```

**Example Output**:
- Situation assessment
- Options analysis with pros/cons
- Implementation recommendations
- Risk management strategies

---

### 🎨 Pitch Deck Agent
**What it does**: Creates compelling presentation decks for policy proposals.

**Example Custom Input**:
```json
{
  "presentation_type": "city council pitch",
  "duration": "15 minutes",
  "focus": "environmental benefits",
  "style": "professional with visuals"
}
```

**Example Output**:
- Slide-by-slide content
- Speaker notes
- Visual suggestions
- Data visualizations

---

### 📱 Social Media Agent
**What it does**: Generates social media content and engagement strategies.

**Example Custom Input**:
```json
{
  "platforms": ["Twitter", "LinkedIn", "Facebook"],
  "campaign_duration": "2 weeks",
  "tone": "friendly and informative",
  "hashtags": ["UrbanDevelopment", "SmartCity"]
}
```

**Example Output**:
- Platform-specific posts
- Content calendar
- Engagement strategies
- Response templates

---

### 📈 Data Analyst Agent
**What it does**: Analyzes complex datasets and generates insights.

**Example Custom Input**:
```json
{
  "data_source": "traffic simulation results",
  "analysis_type": "trend analysis",
  "visualizations": ["time series", "heatmap", "comparison charts"]
}
```

**Example Output**:
- Statistical analysis
- Key insights and patterns
- Visualization descriptions
- Predictive trends

---

### 🤝 Stakeholder Agent
**What it does**: Identifies stakeholders and creates engagement strategies.

**Example Custom Input**:
```json
{
  "policy_area": "urban development",
  "stakeholder_types": ["residents", "businesses", "environmental groups"],
  "engagement_level": "high"
}
```

**Example Output**:
- Stakeholder mapping
- Engagement strategies per group
- Communication plans
- Feedback collection methods

---

### 📝 Policy Writer Agent
**What it does**: Drafts formal policy documents with legal precision.

**Example Custom Input**:
```json
{
  "policy_type": "city ordinance",
  "legal_framework": "municipal code",
  "enforcement": "traffic department"
}
```

**Example Output**:
- Draft policy text
- Legal language
- Implementation clauses
- Enforcement mechanisms

---

## 🎯 Advanced Usage Tips

### Providing Context

You can provide additional context to agents through three optional fields:

#### 1. **Simulation Data**
```json
{
  "parameters": {
    "traffic_reduction": -28.5,
    "air_quality_improvement": 15.2,
    "economic_impact": 2.3
  },
  "results": {
    "affected_areas": ["downtown", "midtown"],
    "timeline": "6-12 months"
  }
}
```

#### 2. **Policy Data**
```json
{
  "policy_name": "11PM Traffic Curfew",
  "changes": [
    "Restrict commercial vehicles after 11PM",
    "Increase public transit frequency",
    "Create bike lane network"
  ],
  "expected_impact": "30% traffic reduction"
}
```

#### 3. **Custom Input**
Agent-specific parameters that control behavior and output.

---

## 🔄 Workflow Integration

### Using Custom Agents with Simulations

1. Run a simulation on the `/simulations` page
2. Copy the simulation results
3. Create a **Report Agent** or **Data Analyst Agent**
4. Paste simulation data into the execution modal
5. Agent will analyze and report on the simulation

### Media Campaign Example

**Step 1**: Create **Data Analyst Agent** → Analyze simulation
**Step 2**: Create **Report Agent** → Generate report from analysis
**Step 3**: Create **News Agent** → Write press release
**Step 4**: Create **Media Calling Agent** → Create outreach materials
**Step 5**: Create **Social Media Agent** → Plan social campaign

---

## 📊 Viewing Results

After executing an agent:
- Results stream in real-time to the **Streaming Console**
- Watch the agent's thought process as it works
- Results are displayed with syntax highlighting
- You can download reports as PDF/Markdown/HTML

---

## 💡 Pro Tips

1. **Be Specific**: The more detailed your task description, the better the output
2. **Use JSON**: Custom input accepts valid JSON - use proper formatting
3. **Chain Agents**: Use output from one agent as input to another
4. **Save Templates**: Reuse successful input configurations
5. **Iterate**: Execute the same agent multiple times with different parameters

---

## 🐛 Troubleshooting

**Agent fails to start**: Check that backend is running on port 8000
**JSON Parse Error**: Validate your JSON format (use jsonlint.com)
**No streaming output**: Check WebSocket connection in browser console
**Generic output**: Provide more specific task descriptions and context

---

## 📚 Next Steps

- Explore all 13 agent types
- Combine agents into workflows
- Integrate with simulation results
- Create custom agent templates
- Share agent configurations with your team

---

**Happy Agent Building! 🚀**



