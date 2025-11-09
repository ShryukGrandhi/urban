"""
Specialized Agent Implementations
Each agent type has its own execution logic and prompt building
"""

from typing import Dict, Any
from base_agent import BaseAgent
from agent_types import AgentType, AgentTask, AgentConfig
import logging

logger = logging.getLogger(__name__)


class ReportAgent(BaseAgent):
    """Generate detailed analytical reports on any aspect"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.REPORT, task, config)
    
    def build_prompt(self) -> str:
        target_audience = self.config.target_audience or "policymakers and stakeholders"
        report_type = self.custom_input.get("report_type", "comprehensive analysis")
        
        return f"""You are a professional Report Agent specializing in {report_type}.

{self.get_capability_description()}

# YOUR TASK
{self.task.description}

# TARGET AUDIENCE
{target_audience}

# CONTEXT AND DATA
{self.build_context_section()}

# REPORT REQUIREMENTS
- Create a comprehensive, well-structured report
- Use clear section headings (##)
- Include data-driven insights and evidence
- Provide actionable recommendations
- Use professional tone appropriate for {target_audience}
- Include executive summary at the beginning
- Add visual data representations where appropriate (describe charts/graphs)

# OUTPUT FORMAT
Generate the report in markdown format with the following structure:
1. Executive Summary
2. Introduction and Context
3. Key Findings (with data support)
4. Detailed Analysis
5. Implications and Impact
6. Recommendations
7. Conclusion

Begin your report:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_report = ""
        async for token in self.stream_execute():
            full_report += token
        return {"report": full_report}


class MediaCallingAgent(BaseAgent):
    """Contact and coordinate with media outlets and journalists - NOW WITH AUTO-CALLING!"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.MEDIA_CALLING, task, config)
    
    def build_prompt(self) -> str:
        urgency = self.custom_input.get("urgency", "normal")
        media_list = self.custom_input.get("media_list", [])
        phone_number = self.custom_input.get("phone_number", "+18582108648")
        
        return f"""You are a Media Calling Agent responsible for coordinating with media outlets.

{self.get_capability_description()}

# YOUR TASK
{self.task.description}

# TARGET PHONE NUMBER FOR CALL
{phone_number}

# URGENCY LEVEL
{urgency}

# TARGET MEDIA OUTLETS
{', '.join(media_list) if media_list else "Major news outlets and relevant journalists"}

# CONTEXT
{self.build_context_section()}

# DELIVERABLES REQUIRED
Create the following materials for media outreach:

1. **Call Script**: A conversational script for phone calls to journalists
   - Opening hook (15 seconds)
   - Key message (30 seconds)
   - Supporting facts (1 minute)
   - Call to action
   - Handling objections

2. **Email Template**: Professional email for initial outreach
   - Compelling subject line
   - Brief introduction
   - Key story angle
   - Why it matters now
   - Supporting data/context
   - Contact information

3. **Media Kit**: One-pager with essential information
   - Headline
   - Key facts and figures
   - Quotes from officials/experts
   - Background information
   - Visual assets description

4. **Follow-up Schedule**: Recommended timing for follow-ups

5. **Contact Log Template**: Format for tracking outreach

6. **PHONE CALL SUMMARY**: A concise 2-3 sentence message to deliver via phone call

Generate all materials in a clear, organized format:
"""
    
    async def post_process(self, raw_output: str) -> Dict[str, Any]:
        """
        Process the agent output AND make the phone call automatically
        """
        # AUTO-CALL: Extract key message and make the call
        phone_number = self.custom_input.get("phone_number", "+18582108648")
        auto_call = self.custom_input.get("auto_call", True)
        
        call_result = None
        if auto_call:
            try:
                # Import VAPI service
                import sys
                import os
                sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'tools'))
                from vapi_service import vapi_service
                
                if vapi_service:
                    # Extract key message (try to find "PHONE CALL SUMMARY" section)
                    key_message = raw_output
                    if "PHONE CALL SUMMARY" in raw_output:
                        parts = raw_output.split("PHONE CALL SUMMARY")
                        if len(parts) > 1:
                            # Get the summary section
                            summary_section = parts[1].split("\n\n")[0]
                            key_message = summary_section.strip()
                    
                    # Limit message length for phone call
                    if len(key_message) > 500:
                        key_message = key_message[:500] + "..."
                    
                    logger.info(f"🔥 AUTO-CALLING {phone_number} with media message")
                    
                    call_result = vapi_service.make_media_outreach_call(
                        phone_number=phone_number,
                        policy_name=self.custom_input.get("policy_name", "Urban Development Initiative"),
                        key_message=key_message,
                        target_outlet=self.custom_input.get("target_outlet", "media outlet")
                    )
                    
                    if call_result and call_result.get("success"):
                        logger.info(f"📞 CALL INITIATED! Call ID: {call_result.get('call_id')}")
                    else:
                        logger.error(f"Call failed: {call_result}")
            except Exception as e:
                logger.error(f"Auto-call failed: {e}")
                import traceback
                logger.error(traceback.format_exc())
                call_result = {"success": False, "error": str(e)}
        
        return {
            "media_materials": raw_output,
            "call_result": call_result,
            "phone_number": phone_number if auto_call else None,
            "auto_call_enabled": auto_call
        }
    
    async def execute(self) -> Dict[str, Any]:
        full_output = ""
        async for token in self.stream_execute():
            full_output += token
        return self.result  # Result is already set by stream_execute with post_process


class PlanningAgent(BaseAgent):
    """Create strategic plans for publishing and government initiatives"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.PLANNING, task, config)
    
    def build_prompt(self) -> str:
        timeline = self.custom_input.get("timeline", "6 months")
        budget = self.custom_input.get("budget", "not specified")
        
        return f"""You are a Strategic Planning Agent specializing in government and publishing initiatives.

{self.get_capability_description()}

# PLANNING OBJECTIVE
{self.task.description}

# TIMELINE
{timeline}

# BUDGET CONSTRAINTS
{budget}

# AVAILABLE CONTEXT
{self.build_context_section()}

# PLAN REQUIREMENTS
Create a comprehensive strategic plan including:

1. **Executive Summary**
   - Plan overview
   - Key objectives
   - Expected outcomes

2. **Situation Analysis**
   - Current state assessment
   - Challenges and opportunities
   - Stakeholder landscape

3. **Strategic Objectives**
   - Clear, measurable goals
   - Success criteria
   - Key performance indicators

4. **Action Plan**
   - Phased approach (break down by timeline)
   - Specific actions and tactics
   - Responsible parties
   - Dependencies and prerequisites

5. **Resource Allocation**
   - Budget breakdown
   - Personnel requirements
   - Technology/tools needed
   - External resources/partnerships

6. **Timeline and Milestones**
   - Gantt chart description
   - Key milestones with dates
   - Critical path items

7. **Risk Management**
   - Potential risks and mitigation strategies
   - Contingency plans
   - Decision points

8. **Communication Plan**
   - Internal communication
   - External messaging
   - Stakeholder engagement

9. **Evaluation Framework**
   - Progress tracking methods
   - Review schedule
   - Adjustment triggers

Generate the complete strategic plan:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_plan = ""
        async for token in self.stream_execute():
            full_plan += token
        return {"strategic_plan": full_plan}


class ConsultingAgent(BaseAgent):
    """Provide expert advice and discuss potential changes"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.CONSULTING, task, config)
    
    def build_prompt(self) -> str:
        tone = self.config.tone or "professional and balanced"
        
        return f"""You are an Expert Consulting Agent providing high-level strategic advice.

{self.get_capability_description()}

# CONSULTATION REQUEST
{self.task.description}

# COMMUNICATION STYLE
{tone}

# RELEVANT CONTEXT
{self.build_context_section()}

# CONSULTING APPROACH
Provide comprehensive consulting advice with:

1. **Situation Assessment**
   - What we know
   - What's at stake
   - Key considerations

2. **Analysis Framework**
   - Multiple perspectives on the issue
   - Trade-offs involved
   - Short-term vs long-term implications

3. **Options Analysis**
   For each viable option:
   - Description
   - Pros and cons
   - Resource requirements
   - Risk level
   - Expected outcomes
   - Implementation complexity

4. **Recommendation**
   - Preferred approach and why
   - Rationale based on data and context
   - Expected timeline
   - Success indicators

5. **Risk Analysis**
   - Key risks for recommended approach
   - Mitigation strategies
   - Warning signs to watch for

6. **Implementation Roadmap**
   - Immediate next steps (first 30 days)
   - Medium-term actions (30-90 days)
   - Long-term considerations (90+ days)

7. **Discussion Points**
   - Questions to consider
   - Areas needing more information
   - Stakeholders to consult

Provide your expert consulting advice:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_advice = ""
        async for token in self.stream_execute():
            full_advice += token
        return {"consulting_advice": full_advice}


class PitchDeckAgent(BaseAgent):
    """Create compelling slide decks and pitch presentations"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.PITCH_DECK, task, config)
    
    def build_prompt(self) -> str:
        audience = self.config.target_audience or "decision makers and stakeholders"
        duration = self.custom_input.get("duration", "10-15 minutes")
        style = self.custom_input.get("style", "professional and data-driven")
        
        return f"""You are a Pitch Deck Creator specializing in compelling presentations.

{self.get_capability_description()}

# PRESENTATION OBJECTIVE
{self.task.description}

# TARGET AUDIENCE
{audience}

# PRESENTATION DURATION
{duration}

# STYLE
{style}

# AVAILABLE CONTENT
{self.build_context_section()}

# PITCH DECK REQUIREMENTS
Create a complete slide deck outline with detailed content for each slide.

For each slide, provide:
- Slide number and title
- Key message (one sentence)
- Detailed content/talking points
- Visual suggestions (charts, images, diagrams)
- Speaker notes

# RECOMMENDED STRUCTURE (adapt as needed):

**Slide 1: Title Slide**
- Project/initiative name
- Tagline
- Presenter info
- Date

**Slide 2: The Hook**
- Compelling opening statistic or problem statement
- Why this matters NOW

**Slide 3: Current Situation**
- Context and background
- Key challenges
- Stakes involved

**Slide 4-5: The Solution**
- Your proposal/initiative
- How it addresses the problem
- Unique value proposition

**Slide 6-7: Evidence & Data**
- Simulation results
- Supporting statistics
- Case studies or precedents

**Slide 8-9: Impact & Benefits**
- Projected outcomes
- Who benefits and how
- Metrics and KPIs

**Slide 10: Implementation**
- Timeline
- Key milestones
- Resource requirements

**Slide 11: Risk & Mitigation**
- Potential challenges
- How you'll address them
- Contingency plans

**Slide 12: Investment/Resources Needed**
- Budget overview
- ROI or cost-benefit

**Slide 13: Call to Action**
- What you're asking for
- Next steps
- Decision timeline

**Slide 14: Closing**
- Memorable summary
- Contact information

Create the complete pitch deck content:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_deck = ""
        async for token in self.stream_execute():
            full_deck += token
        return {"pitch_deck": full_deck}


class NewsAgent(BaseAgent):
    """Generate news articles and press releases"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.NEWS_AGENT, task, config)
    
    def build_prompt(self) -> str:
        angle = self.custom_input.get("angle", "balanced and informative")
        target_publication = self.custom_input.get("target_publication", "general news outlet")
        
        return f"""You are a News Agent specializing in policy and government reporting.

{self.get_capability_description()}

# ASSIGNMENT
{self.task.description}

# STORY ANGLE
{angle}

# TARGET PUBLICATION
{target_publication}

# AVAILABLE INFORMATION
{self.build_context_section()}

# DELIVERABLES

Generate the following news content:

1. **News Article** (500-800 words)
   - Compelling headline
   - Strong lede (who, what, when, where, why)
   - Inverted pyramid structure
   - Quotes from relevant parties
   - Data and evidence
   - Context and background
   - Impact on community/stakeholders
   - What happens next

2. **Press Release** (400-600 words)
   - FOR IMMEDIATE RELEASE header
   - Strong headline
   - Dateline and city
   - Opening paragraph with key announcement
   - Supporting details and quotes
   - Boilerplate about organization
   - Media contact information

3. **Social Media Snippets**
   - Twitter/X post (280 characters)
   - LinkedIn post (300 words)
   - Facebook post (200 words)
   - Instagram caption (150 words)
   - Key hashtags

4. **Key Facts Box**
   - 5-7 bullet points with critical information
   - Statistics and data points
   - Important dates

Generate all news content:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_content = ""
        async for token in self.stream_execute():
            full_content += token
        return {"news_content": full_content}


class DataAnalystAgent(BaseAgent):
    """Deep dive analysis of simulation and urban data"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.DATA_ANALYST, task, config)
    
    def build_prompt(self) -> str:
        analysis_questions = self.custom_input.get("analysis_questions", [])
        
        return f"""You are a Data Analyst Agent specializing in urban policy and simulation data.

{self.get_capability_description()}

# ANALYSIS OBJECTIVE
{self.task.description}

# KEY QUESTIONS TO ANSWER
{chr(10).join(f"- {q}" for q in analysis_questions) if analysis_questions else "Comprehensive data analysis"}

# AVAILABLE DATA
{self.build_context_section()}

# ANALYSIS REQUIREMENTS

Provide a thorough data analysis including:

1. **Data Overview**
   - Summary of available data
   - Data quality assessment
   - Key variables and metrics

2. **Descriptive Statistics**
   - Central tendencies (mean, median, mode)
   - Distributions and ranges
   - Notable patterns or outliers

3. **Trend Analysis**
   - Temporal trends
   - Comparative analysis (before/after, baseline/projected)
   - Growth rates and trajectories

4. **Correlation and Relationships**
   - Key correlations between variables
   - Causal relationships (where supported)
   - Interactive effects

5. **Segmentation Analysis**
   - Breakdown by geography, demographics, or other relevant factors
   - Disparate impacts on different groups
   - Hotspots and cold spots

6. **Visualization Descriptions**
   - Describe recommended charts and graphs
   - Key visualizations needed to tell the story
   - Dashboard layout suggestions

7. **Statistical Insights**
   - Significant findings (what the data shows)
   - Confidence levels and uncertainty
   - Limitations of the analysis

8. **Actionable Insights**
   - What the data means for decision-makers
   - Data-driven recommendations
   - Areas needing further investigation

9. **Data Tables**
   - Present key data in structured tables
   - Summary statistics
   - Comparison tables

Provide your complete data analysis:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_analysis = ""
        async for token in self.stream_execute():
            full_analysis += token
        return {"data_analysis": full_analysis}


class SocialMediaAgent(BaseAgent):
    """Manage social media campaigns and content"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.SOCIAL_MEDIA, task, config)
    
    def build_prompt(self) -> str:
        platforms = self.custom_input.get("platforms", ["Twitter", "LinkedIn", "Facebook", "Instagram"])
        schedule = self.custom_input.get("schedule", "2 weeks")
        
        return f"""You are a Social Media Agent specializing in government and policy communications.

{self.get_capability_description()}

# CAMPAIGN GOAL
{self.task.description}

# TARGET PLATFORMS
{', '.join(platforms)}

# CAMPAIGN DURATION
{schedule}

# BACKGROUND INFORMATION
{self.build_context_section()}

# DELIVERABLES

Create a comprehensive social media campaign:

1. **Campaign Strategy**
   - Overall narrative and themes
   - Key messages for each platform
   - Target audience per platform
   - Success metrics

2. **Content Calendar** ({schedule})
   - Daily posting schedule
   - Platform-specific content
   - Optimal posting times
   - Content mix (educational, promotional, engaging)

3. **Platform-Specific Content**

   **Twitter/X** (10-15 posts)
   - Thread starters
   - Standalone tweets
   - Visual tweet ideas
   - Hashtag strategy

   **LinkedIn** (5-7 posts)
   - Professional thought leadership
   - Data-driven insights
   - Article shares with commentary
   - Poll ideas

   **Facebook** (5-7 posts)
   - Community-focused content
   - Longer-form updates
   - Event promotions
   - Discussion starters

   **Instagram** (5-7 posts)
   - Visual content descriptions
   - Carousel post concepts
   - Story ideas
   - Reel concepts
   - Caption writing

4. **Visual Content Requirements**
   - Graphics needed
   - Photo suggestions
   - Video concepts
   - Infographic ideas

5. **Engagement Strategy**
   - How to respond to comments
   - Community management guidelines
   - Hashtag monitoring
   - Influencer engagement

6. **Campaign Assets**
   - Bio updates for each platform
   - Pinned post content
   - Story highlights
   - Link in bio strategy

Generate the complete social media campaign:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_campaign = ""
        async for token in self.stream_execute():
            full_campaign += token
        return {"social_media_campaign": full_campaign}


class StakeholderAgent(BaseAgent):
    """Simulate perspectives from different stakeholder groups"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.STAKEHOLDER, task, config)
    
    def build_prompt(self) -> str:
        stakeholder_type = self.custom_input.get("stakeholder_type", "community member")
        
        return f"""You are a Stakeholder Agent simulating the perspective of: {stakeholder_type}

{self.get_capability_description()}

# YOUR ROLE
Authentically represent the views, concerns, and interests of {stakeholder_type} regarding:
{self.task.description}

# RELEVANT INFORMATION
{self.build_context_section()}

# STAKEHOLDER PERSPECTIVE REQUIREMENTS

Provide a comprehensive stakeholder perspective including:

1. **Stakeholder Profile**
   - Who you represent
   - Your interests and priorities
   - Your constraints and limitations

2. **Initial Reaction**
   - First impressions of the proposal
   - Emotional response
   - Immediate concerns or excitement

3. **Detailed Concerns**
   - Specific worries and risks you see
   - Potential negative impacts on your group
   - Questions that need answering

4. **Potential Benefits**
   - How this could help your stakeholder group
   - Opportunities you see
   - Positive outcomes

5. **Conditions for Support**
   - What would need to change for you to support this
   - Safeguards or guarantees needed
   - Alternative approaches to consider

6. **Key Questions**
   - What you need to know before deciding
   - Information gaps
   - Clarifications needed

7. **Suggested Modifications**
   - Changes that would make this more acceptable
   - Compromises you'd consider
   - Deal-breakers

8. **Support Level**
   - Current stance (strongly oppose, oppose, neutral, support, strongly support)
   - What could change your position
   - Conditions for engagement

Provide your stakeholder perspective:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_perspective = ""
        async for token in self.stream_execute():
            full_perspective += token
        return {"stakeholder_perspective": full_perspective}


class PolicyWriterAgent(BaseAgent):
    """Draft formal policy documents and legislation"""
    
    def __init__(self, agent_id: str, task: AgentTask, config: AgentConfig = None):
        super().__init__(agent_id, AgentType.POLICY_WRITER, task, config)
    
    def build_prompt(self) -> str:
        legal_framework = self.custom_input.get("legal_framework", "standard municipal code")
        
        return f"""You are a Policy Writer Agent specializing in formal policy and legislative drafting.

{self.get_capability_description()}

# DRAFTING ASSIGNMENT
{self.task.description}

# LEGAL FRAMEWORK
{legal_framework}

# BACKGROUND AND CONTEXT
{self.build_context_section()}

# POLICY DOCUMENT REQUIREMENTS

Create a comprehensive policy document including:

1. **Title and Preamble**
   - Official title
   - Document number (placeholder)
   - Effective date (placeholder)
   - Whereas clauses (policy justification)

2. **Purpose and Intent**
   - Legislative intent
   - Policy objectives
   - Problem being addressed

3. **Definitions**
   - Key terms defined
   - Legal language clarifications

4. **Substantive Provisions**
   - Main policy articles/sections
   - Rights and responsibilities
   - Procedures and processes
   - Standards and requirements

5. **Implementation Requirements**
   - Responsible agencies/departments
   - Implementation timeline
   - Required resources
   - Reporting requirements

6. **Enforcement and Compliance**
   - Compliance mechanisms
   - Enforcement procedures
   - Penalties for violation
   - Appeals process

7. **Amendments and Revisions**
   - Process for future amendments
   - Review schedule
   - Sunset provisions (if applicable)

8. **Severability and Savings Clause**
   - Standard legal clauses

9. **Implementation Guide** (separate section)
   - Step-by-step implementation
   - Stakeholder roles
   - Timeline and milestones
   - Training requirements
   - Communication plan

10. **Fiscal Note**
   - Estimated costs
   - Funding sources
   - Budget impact analysis

Draft the complete policy document in formal legislative language:
"""
    
    async def execute(self) -> Dict[str, Any]:
        full_policy = ""
        async for token in self.stream_execute():
            full_policy += token
        return {"policy_document": full_policy}


# Agent factory function
def create_agent(agent_type: AgentType, agent_id: str, task: AgentTask, config: AgentConfig = None) -> BaseAgent:
    """
    Factory function to create agents
    Now imports MapboxAgent for intelligent visualization
    """
    """Factory function to create the appropriate agent type"""
    
    # Try to import MapboxAgent
    try:
        from mapbox_agent import MapboxAgent
        mapbox_available = True
    except ImportError:
        MapboxAgent = None
        mapbox_available = False
        # MapboxAgent not available (optional)
    
    # Import core workflow agents
    try:
        from core_workflow_agents import (
            ConsultingSupervisorAgent,
            EnhancedSimulationAgent,
            EnhancedDebateAgent,
            EnhancedAggregatorAgent
        )
        core_agents_available = True
    except ImportError:
        core_agents_available = False
    
    agent_map = {
        AgentType.REPORT: ReportAgent,
        AgentType.MEDIA_CALLING: MediaCallingAgent,
        AgentType.PLANNING: PlanningAgent,
        AgentType.CONSULTING: ConsultingAgent,
        AgentType.PITCH_DECK: PitchDeckAgent,
        AgentType.NEWS_AGENT: NewsAgent,
        AgentType.DATA_ANALYST: DataAnalystAgent,
        AgentType.SOCIAL_MEDIA: SocialMediaAgent,
        AgentType.STAKEHOLDER: StakeholderAgent,
        AgentType.POLICY_WRITER: PolicyWriterAgent,
    }
    
    # Override with core workflow agents if available
    if core_agents_available:
        agent_map[AgentType.CONSULTING] = ConsultingSupervisorAgent
        agent_map[AgentType.SIMULATION] = EnhancedSimulationAgent
        agent_map[AgentType.DEBATE] = EnhancedDebateAgent
        agent_map[AgentType.AGGREGATOR] = EnhancedAggregatorAgent
    
    # Add MapboxAgent if available
    if mapbox_available:
        agent_map[AgentType.MAPBOX_AGENT] = MapboxAgent
    
    # Try to import MapboxVisualizationAgent
    try:
        from visualization_agent import MapboxVisualizationAgent
        agent_map[AgentType.MAPBOX_VISUALIZATION] = MapboxVisualizationAgent
    except ImportError:
        pass
    
    agent_class = agent_map.get(agent_type)
    if not agent_class:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    return agent_class(agent_id, task, config)

