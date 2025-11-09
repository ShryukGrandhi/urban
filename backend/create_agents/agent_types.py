"""
Enhanced Agent Type Definitions
Each task is a unique agent - extremely flexible and context-aware
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AgentType(str, Enum):
    """Extended agent types for multi-agentic architecture"""
    # Original types
    SUPERVISOR = "SUPERVISOR"
    SIMULATION = "SIMULATION"
    DEBATE = "DEBATE"
    AGGREGATOR = "AGGREGATOR"
    PROPAGANDA = "PROPAGANDA"
    
    # New specialized types
    REPORT = "REPORT"                    # Generate comprehensive reports
    MEDIA_CALLING = "MEDIA_CALLING"      # Contact and coordinate with media
    PLANNING = "PLANNING"                # Create plans for publishing/government
    CONSULTING = "CONSULTING"            # Discuss and advise on potential changes
    PITCH_DECK = "PITCH_DECK"           # Create slide decks and pitch presentations
    NEWS_AGENT = "NEWS_AGENT"            # Generate news content and articles
    DATA_ANALYST = "DATA_ANALYST"        # Analyze simulation data deeply
    SOCIAL_MEDIA = "SOCIAL_MEDIA"        # Manage social media campaigns
    STAKEHOLDER = "STAKEHOLDER"          # Simulate stakeholder perspectives
    POLICY_WRITER = "POLICY_WRITER"      # Draft policy documents
    MAPBOX_AGENT = "MAPBOX_AGENT"        # Intelligent Mapbox visualization
    MAPBOX_VISUALIZATION = "MAPBOX_VISUALIZATION"  # Dedicated map overlay generator


class AgentStatus(str, Enum):
    """Agent operational status"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"


class AgentConfig(BaseModel):
    """Flexible configuration for any agent type"""
    # Core settings
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=100, le=100000)
    model: str = Field(default="gemini-2.5-flash")
    
    # Context settings
    use_simulation_data: bool = True
    use_aggregated_context: bool = True
    context_window: int = Field(default=10000, description="Token context window")
    
    # Task-specific settings
    output_format: Optional[str] = None  # markdown, html, json, pptx, pdf
    target_audience: Optional[str] = None  # policymakers, public, media, stakeholders
    tone: Optional[str] = None  # professional, casual, urgent, persuasive
    
    # Execution settings
    streaming: bool = True
    max_retries: int = 3
    timeout_seconds: int = 300
    
    # Additional flexible config
    extra: Dict[str, Any] = Field(default_factory=dict)


class AgentTask(BaseModel):
    """A task to be executed by an agent"""
    id: str
    agent_id: str
    agent_type: AgentType
    description: str
    
    # Input data
    simulation_data: Optional[Dict[str, Any]] = None
    aggregated_context: Optional[Dict[str, Any]] = None
    policy_data: Optional[Dict[str, Any]] = None
    custom_input: Optional[Dict[str, Any]] = None
    
    # Configuration
    config: AgentConfig = Field(default_factory=AgentConfig)
    
    # Execution tracking
    status: str = "pending"
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class Agent(BaseModel):
    """Enhanced agent definition"""
    id: str
    name: str
    type: AgentType
    role: str = Field(description="Description of agent's purpose")
    scope: Optional[str] = Field(default=None, description="Specialized focus area")
    sources: List[str] = Field(default_factory=list, description="Data sources")
    config: AgentConfig = Field(default_factory=AgentConfig)
    status: AgentStatus = AgentStatus.ACTIVE
    
    # Metadata
    created_at: str
    updated_at: str
    created_by: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    
    # Stats
    execution_count: int = 0
    success_count: int = 0
    failure_count: int = 0


class AgentCapability(BaseModel):
    """Defines what an agent type can do"""
    type: AgentType
    name: str
    description: str
    icon: str
    color_gradient: str
    
    # Capabilities
    can_analyze_data: bool = False
    can_generate_content: bool = False
    can_communicate_externally: bool = False
    can_create_visualizations: bool = False
    can_make_recommendations: bool = False
    
    # Typical inputs
    required_inputs: List[str] = Field(default_factory=list)
    optional_inputs: List[str] = Field(default_factory=list)
    
    # Typical outputs
    output_types: List[str] = Field(default_factory=list)


# Define capabilities for each agent type
AGENT_CAPABILITIES = {
    AgentType.SUPERVISOR: AgentCapability(
        type=AgentType.SUPERVISOR,
        name="Supervisor Agent",
        description="Strategic planning and goal definition for policy initiatives",
        icon="🎯",
        color_gradient="from-blue-600 to-cyan-600",
        can_analyze_data=True,
        can_make_recommendations=True,
        required_inputs=["goal", "constraints"],
        optional_inputs=["simulation_data", "stakeholder_input"],
        output_types=["strategy", "objectives", "success_metrics"]
    ),
    
    AgentType.SIMULATION: AgentCapability(
        type=AgentType.SIMULATION,
        name="Simulation Agent",
        description="Run policy impact simulations with urban data",
        icon="🔬",
        color_gradient="from-green-600 to-emerald-600",
        can_analyze_data=True,
        can_generate_content=True,
        required_inputs=["city", "policy_actions"],
        optional_inputs=["time_horizon", "focus_areas"],
        output_types=["analysis", "metrics", "projections"]
    ),
    
    AgentType.DEBATE: AgentCapability(
        type=AgentType.DEBATE,
        name="Debate Agent",
        description="Generate pro/con arguments for policy decisions",
        icon="💬",
        color_gradient="from-orange-600 to-red-600",
        can_analyze_data=True,
        can_generate_content=True,
        required_inputs=["simulation_results", "policy_text"],
        optional_inputs=["rounds", "stakeholder_views"],
        output_types=["arguments", "sentiment_analysis", "risk_scores"]
    ),
    
    AgentType.AGGREGATOR: AgentCapability(
        type=AgentType.AGGREGATOR,
        name="Aggregator Agent",
        description="Compile comprehensive reports from all agent outputs",
        icon="📄",
        color_gradient="from-purple-600 to-pink-600",
        can_analyze_data=True,
        can_generate_content=True,
        can_create_visualizations=True,
        required_inputs=["simulation_data", "debate_data"],
        optional_inputs=["report_sections", "format"],
        output_types=["report", "executive_summary", "recommendations"]
    ),
    
    AgentType.REPORT: AgentCapability(
        type=AgentType.REPORT,
        name="Report Agent",
        description="Generate detailed analytical reports on any aspect",
        icon="📊",
        color_gradient="from-indigo-600 to-purple-600",
        can_analyze_data=True,
        can_generate_content=True,
        can_create_visualizations=True,
        required_inputs=["topic", "data_sources"],
        optional_inputs=["report_type", "target_audience"],
        output_types=["markdown", "pdf", "html", "data_tables"]
    ),
    
    AgentType.MEDIA_CALLING: AgentCapability(
        type=AgentType.MEDIA_CALLING,
        name="Media Calling Agent",
        description="Contact and coordinate with media outlets and journalists",
        icon="📞",
        color_gradient="from-yellow-600 to-orange-600",
        can_generate_content=True,
        can_communicate_externally=True,
        can_make_recommendations=True,
        required_inputs=["message", "media_list"],
        optional_inputs=["urgency", "follow_up_schedule"],
        output_types=["call_scripts", "email_templates", "media_kit", "contact_log"]
    ),
    
    AgentType.PLANNING: AgentCapability(
        type=AgentType.PLANNING,
        name="Planning Agent",
        description="Create strategic plans for publishing and government initiatives",
        icon="📋",
        color_gradient="from-teal-600 to-green-600",
        can_analyze_data=True,
        can_generate_content=True,
        can_make_recommendations=True,
        required_inputs=["objective", "timeline"],
        optional_inputs=["budget", "resources", "constraints"],
        output_types=["action_plan", "timeline", "milestones", "resources"]
    ),
    
    AgentType.CONSULTING: AgentCapability(
        type=AgentType.CONSULTING,
        name="Consulting Agent",
        description="Provide expert advice and discuss potential changes",
        icon="💡",
        color_gradient="from-cyan-600 to-blue-600",
        can_analyze_data=True,
        can_generate_content=True,
        can_make_recommendations=True,
        required_inputs=["issue", "context"],
        optional_inputs=["constraints", "preferences"],
        output_types=["recommendations", "trade_offs", "risk_analysis", "alternatives"]
    ),
    
    AgentType.PITCH_DECK: AgentCapability(
        type=AgentType.PITCH_DECK,
        name="Pitch Deck Creator",
        description="Create compelling slide decks and pitch presentations",
        icon="🎨",
        color_gradient="from-pink-600 to-rose-600",
        can_analyze_data=True,
        can_generate_content=True,
        can_create_visualizations=True,
        required_inputs=["topic", "key_points"],
        optional_inputs=["audience", "duration", "style"],
        output_types=["pptx", "pdf", "slide_content", "speaker_notes"]
    ),
    
    AgentType.NEWS_AGENT: AgentCapability(
        type=AgentType.NEWS_AGENT,
        name="News Agent",
        description="Generate news articles and press releases",
        icon="📰",
        color_gradient="from-red-600 to-pink-600",
        can_analyze_data=True,
        can_generate_content=True,
        required_inputs=["event", "facts"],
        optional_inputs=["angle", "target_publication"],
        output_types=["news_article", "press_release", "social_snippets"]
    ),
    
    AgentType.PROPAGANDA: AgentCapability(
        type=AgentType.PROPAGANDA,
        name="Public Communications Agent",
        description="Generate public communications and messaging campaigns",
        icon="📢",
        color_gradient="from-purple-600 to-pink-600",
        can_generate_content=True,
        can_communicate_externally=True,
        required_inputs=["message", "target_audience"],
        optional_inputs=["channels", "tone"],
        output_types=["talking_points", "social_media", "press_release"]
    ),
    
    AgentType.DATA_ANALYST: AgentCapability(
        type=AgentType.DATA_ANALYST,
        name="Data Analyst Agent",
        description="Deep dive analysis of simulation and urban data",
        icon="📈",
        color_gradient="from-blue-600 to-indigo-600",
        can_analyze_data=True,
        can_generate_content=True,
        can_create_visualizations=True,
        required_inputs=["dataset", "analysis_questions"],
        optional_inputs=["visualization_type", "comparison_baseline"],
        output_types=["analysis_report", "charts", "statistics", "insights"]
    ),
    
    AgentType.SOCIAL_MEDIA: AgentCapability(
        type=AgentType.SOCIAL_MEDIA,
        name="Social Media Agent",
        description="Manage social media campaigns and content",
        icon="📱",
        color_gradient="from-fuchsia-600 to-purple-600",
        can_generate_content=True,
        can_communicate_externally=True,
        required_inputs=["campaign_goal", "message"],
        optional_inputs=["platforms", "schedule", "hashtags"],
        output_types=["posts", "campaign_plan", "content_calendar"]
    ),
    
    AgentType.STAKEHOLDER: AgentCapability(
        type=AgentType.STAKEHOLDER,
        name="Stakeholder Agent",
        description="Simulate perspectives from different stakeholder groups",
        icon="👥",
        color_gradient="from-amber-600 to-yellow-600",
        can_analyze_data=True,
        can_generate_content=True,
        required_inputs=["stakeholder_type", "policy_proposal"],
        optional_inputs=["concerns", "interests"],
        output_types=["feedback", "concerns", "suggestions", "support_level"]
    ),
    
    AgentType.POLICY_WRITER: AgentCapability(
        type=AgentType.POLICY_WRITER,
        name="Policy Writer Agent",
        description="Draft formal policy documents and legislation",
        icon="✍️",
        color_gradient="from-slate-600 to-gray-600",
        can_analyze_data=True,
        can_generate_content=True,
        required_inputs=["policy_intent", "legal_framework"],
        optional_inputs=["precedents", "constraints"],
        output_types=["policy_draft", "legal_text", "implementation_guide"]
    ),
}

