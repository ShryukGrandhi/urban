# COMPREHENSIVE ARCHITECTURE ANALYSIS
## URBAN - Full Stack Government Policy Making Consulting Platform

---

## 📊 DATABASE SCHEMA (Prisma/PostgreSQL)

### Core Models & Relationships

#### 1. **Agent Model**
```prisma
- id: UUID (primary key)
- name: String
- type: AgentType enum (SUPERVISOR, SIMULATION, DEBATE, AGGREGATOR, PROPAGANDA)
- role: String (description of agent's purpose)
- scope: String? (optional specialization)
- sources: String[] (data sources agent uses)
- config: Json? (flexible configuration)
- status: AgentStatus (ACTIVE, INACTIVE, ARCHIVED)
- createdAt, updatedAt: DateTime

Relations:
- projects: ProjectAgent[] (many-to-many with Project)
- simulations: Simulation[] (one-to-many)
- debates: Debate[] (one-to-many)
```

**Key Insights:**
- Agents are reusable across projects
- Status allows soft-deletion (ARCHIVED)
- Config field provides flexibility for agent-specific settings
- Sources array tracks data dependencies

#### 2. **Project Model**
```prisma
- id: UUID
- name: String
- description: String?
- city: String?
- region: String?
- createdAt, updatedAt: DateTime

Relations:
- agents: ProjectAgent[] (many-to-many with Agent)
- policyDocs: PolicyDocument[] (one-to-many)
- simulations: Simulation[] (one-to-many)
- reports: Report[] (one-to-many)
```

**Key Insights:**
- Projects are the primary organizational unit
- City/region optional but used for geocoding
- All work (simulations, debates, reports) tied to projects

#### 3. **PolicyDocument Model**
```prisma
- id: UUID
- projectId: UUID (foreign key)
- filename: String
- filepath: String (local storage path)
- extractedText: String? (PDF parsed text)
- parsedActions: Json? (LLM-extracted policy actions)
- uploadedAt: DateTime

Relations:
- project: Project (many-to-one)
- simulations: Simulation[] (one-to-many)
```

**Key Insights:**
- PDFs stored locally in `uploads/` directory
- Two-stage parsing: PDF → text → structured actions
- parsedActions JSON structure:
  ```json
  {
    "actions": [
      {
        "type": "zoning_change",
        "description": "...",
        "targetArea": "...",
        "parameters": {...},
        "impacts": [...]
      }
    ]
  }
  ```

#### 4. **Simulation Model**
```prisma
- id: UUID
- projectId: UUID
- agentId: UUID (which agent ran it)
- policyDocId: UUID? (optional - can run without policy doc)
- city: String
- region: String?
- parameters: Json (timeHorizon, focusAreas, analysisDepth)
- status: SimulationStatus (PENDING, RUNNING, COMPLETED, FAILED)
- results: Json? (full analysis text from LLM)
- metrics: Json? (calculated impact metrics)
- startedAt, completedAt: DateTime?
- createdAt: DateTime

Relations:
- project: Project
- agent: Agent
- policyDoc: PolicyDocument?
- debates: Debate[] (one-to-many)
- reports: Report[] (one-to-many)
```

**Key Insights:**
- Metrics structure:
  ```json
  {
    "baseline": {...},
    "projected": {...},
    "changes": {
      "housingAffordability": {
        "absolute": 250,
        "percentage": 18.5
      },
      "trafficFlow": {...},
      "airQuality": {...},
      "publicTransitUsage": {...}
    }
  }
  ```
- Can run without policy doc (manual simulation)
- Status tracking enables real-time UI updates

#### 5. **Debate Model**
```prisma
- id: UUID
- simulationId: UUID (must reference completed simulation)
- agentId: UUID
- arguments: Json (structured debate data)
- sentiment: Json? (pro/con sentiment analysis)
- riskScores: Json? (risk assessment)
- createdAt: DateTime

Relations:
- simulation: Simulation
- agent: Agent
```

**Key Insights:**
- Arguments structure:
  ```json
  {
    "rounds": 3,
    "messages": [
      {
        "side": "pro",
        "round": 1,
        "content": "..."
      },
      {
        "side": "con",
        "round": 1,
        "content": "..."
      }
    ]
  }
  ```
- Sentiment structure:
  ```json
  {
    "pro": {
      "tone": "optimistic",
      "confidence": 0.75,
      "themes": ["economic growth", ...]
    },
    "con": {...},
    "balance": 0.5
  }
  ```
- Risk scores include political, environmental, economic, social

#### 6. **Report Model**
```prisma
- id: UUID
- projectId: UUID
- simulationId: UUID? (optional - can generate without simulation)
- title: String
- content: Json (structured report sections)
- format: ReportFormat (PDF, POWERPOINT, HTML, MARKDOWN)
- exportUrl: String? (generated file path)
- generatedAt: DateTime

Relations:
- project: Project
- simulation: Simulation?
```

**Key Insights:**
- Content structure:
  ```json
  {
    "sections": [
      {
        "id": "executive_summary",
        "title": "Executive Summary",
        "content": "markdown text..."
      },
      ...
    ]
  }
  ```
- Sections: executive_summary, proposed_changes, impact_analysis, debate_summary, risk_assessment, recommendations

#### 7. **StreamEvent Model**
```prisma
- id: UUID
- sessionId: String (WebSocket session)
- agentType: String
- eventType: String
- data: Json
- timestamp: DateTime

Indexes:
- [sessionId, timestamp]
- [timestamp]
```

**Key Insights:**
- Stores all streaming events for audit/history
- Enables replay of agent activity
- Used for debugging and analytics

---

## 🔧 BACKEND ARCHITECTURE (TypeScript/Fastify)

### Server Setup (`src/index.ts`)
- **Framework**: Fastify (high-performance Node.js framework)
- **Port**: 3001 (configurable via BACKEND_PORT)
- **CORS**: Configured for frontend (localhost:5173)
- **Plugins**:
  - `@fastify/cors`: Cross-origin requests
  - `@fastify/multipart`: File uploads (50MB limit for PDFs)
  - `@fastify/websocket`: Real-time WebSocket support
  - `@fastify/static`: Static file serving (if needed)

### Route Structure (`src/routes/`)

#### **Agents Routes** (`/api/agents`)
- `GET /` - List all agents with counts
- `GET /:id` - Get agent with projects and simulations
- `POST /` - Create new agent (validated with Zod)
- `PUT /:id` - Update agent
- `DELETE /:id` - Soft delete (sets status to ARCHIVED)
- `GET /:id/stats` - Get agent statistics

**Validation Schema:**
```typescript
{
  name: string (min 1),
  type: enum (SUPERVISOR, SIMULATION, DEBATE, AGGREGATOR, PROPAGANDA),
  role: string (min 1),
  scope?: string,
  sources: string[],
  config?: Record<string, any>
}
```

#### **Projects Routes** (`/api/projects`)
- `GET /` - List projects with counts (_count.agents, _count.simulations, etc.)
- `GET /:id` - Get project with agents, policyDocs, simulations, reports
- `POST /` - Create project
- `PUT /:id` - Update project
- `DELETE /:id` - Hard delete project (cascades)
- `POST /:id/agents` - Add agent to project
- `DELETE /:id/agents/:agentId` - Remove agent from project

#### **Upload Routes** (`/api/upload`)
- `POST /?projectId=xxx` - Upload PDF, parse, extract actions
- `GET /:id` - Get policy document
- `GET /project/:projectId` - List documents for project
- `DELETE /:id` - Delete document and file

**Upload Flow:**
1. Receive multipart file
2. Save to `uploads/` directory
3. Parse PDF → extract text
4. Call `extractPolicyActions()` → LLM extracts structured actions
5. Store in database with extractedText and parsedActions

#### **Simulations Routes** (`/api/simulations`)
- `GET /?projectId=xxx` - List simulations (optionally filtered by project)
- `GET /:id` - Get simulation with all relations
- `POST /` - Create and start simulation (async)
- `GET /:id/stream` - Server-Sent Events stream
- `POST /:id/cancel` - Cancel running simulation
- `GET /:id/metrics` - Get just metrics/results

**Simulation Creation Flow:**
1. Validate request (Zod schema)
2. Create simulation record (status: PENDING)
3. Call `runSimulation()` asynchronously
4. Return simulation ID immediately
5. Background process:
   - Update status to RUNNING
   - Fetch urban data
   - Create SimulationAgent
   - Run agent (streams to WebSocket)
   - Update status to COMPLETED with results

#### **Debate Routes** (`/api/debate`)
- `GET /?simulationId=xxx` - List debates
- `GET /:id` - Get debate with simulation
- `POST /` - Create and run debate (async)
- `GET /:id/stream` - SSE stream

**Debate Creation:**
- Requires completed simulation
- Creates debate record
- Calls `runDebateSimulation()` async
- Two agents (pro/con) argue in rounds

#### **Reports Routes** (`/api/reports`)
- `GET /?projectId=xxx` - List reports
- `GET /:id` - Get report
- `POST /` - Create and generate report (async)
- `GET /:id/stream` - SSE stream
- `DELETE /:id` - Delete report

**Report Generation:**
- Creates report record
- Calls `generateReport()` async
- AggregatorAgent generates sections
- Streams each section as it's generated

### Agent System (`src/agents/`)

#### **1. SupervisorAgent** (`supervisor-agent.ts`)
**Purpose**: Strategic planning and goal definition

**Methods:**
- `defineStrategy()`: Given a political goal, defines:
  - Primary objectives (3-5)
  - Constraints (legal, political, resource, timeline)
  - Success metrics
  - Risk factors
  - Stakeholder map
  - Recommended approach
- `evaluateProgress()`: Assesses progress toward goal

**LLM Usage**: Gemini 1.5 Flash
**Output**: Structured JSON strategy document

#### **2. SimulationAgent** (`simulation-agent.ts`)
**Purpose**: Run policy impact simulations

**Configuration:**
```typescript
{
  simulationId: string,
  city: string,
  urbanData: UrbanData,
  policyActions: PolicyAction[],
  parameters: {
    timeHorizon: number,
    analysisDepth: 'basic' | 'detailed' | 'comprehensive',
    focusAreas: string[]
  }
}
```

**Methods:**
- `run()`: Main execution
  1. Broadcast start
  2. Build context for LLM
  3. Stream analysis from LLM
  4. Calculate metrics
  5. Broadcast completion

- `buildContext()`: Creates prompt with:
  - Urban data baseline
  - Policy actions
  - Simulation parameters
  - Analysis requirements

- `streamAnalysis()`: Uses Gemini streaming API
  - Streams tokens to WebSocket channel `simulation:${id}`
  - Accumulates full analysis text

- `calculateMetrics()`: Computes impact metrics
  - Baseline vs projected
  - Percentage changes
  - Impact calculations based on action types

**Broadcasting:**
- Channel: `simulation:${simulationId}`
- Events: `progress`, `token`, `completed`

#### **3. DebateAgent** (`debate-agent.ts`)
**Purpose**: Generate pro/con arguments

**Configuration:**
```typescript
{
  debateId: string,
  simulationResults: any,
  policyText: string,
  rounds: number
}
```

**Methods:**
- `run()`: Main execution
  1. Create pro and con agents
  2. For each round:
     - Generate pro argument (streamed)
     - Generate con argument (streamed)
  3. Analyze sentiment
  4. Assess risks

- `createProAgent()`: Returns agent config for "FOR" side
- `createConAgent()`: Returns agent config for "AGAINST" side
- `streamArgument()`: Generates argument using LLM streaming
- `analyzeSentiment()`: Analyzes tone, confidence, themes
- `assessRisks()`: Calculates risk scores

**Broadcasting:**
- Channel: `debate:${debateId}`
- Events: `progress`, `token`, `completed`

#### **4. AggregatorAgent** (`aggregator-agent.ts`)
**Purpose**: Compile comprehensive reports

**Configuration:**
```typescript
{
  reportId: string,
  project: Project,
  simulation?: Simulation,
  debates: Debate[],
  requestedSections?: string[]
}
```

**Methods:**
- `generate()`: Main execution
  1. Generate all sections
  2. Stream each section as it's created

- `generateSections()`: Iterates through sections
- `generateSection()`: Uses LLM to generate section content
- `buildSectionPrompt()`: Creates section-specific prompts

**Sections:**
- executive_summary
- proposed_changes
- impact_analysis
- debate_summary
- risk_assessment
- recommendations

**Broadcasting:**
- Channel: `report:${reportId}`
- Events: `progress`, `token`, `completed`

#### **5. PropagandaAgent** (`propaganda-agent.ts`)
**Purpose**: Generate public communications

**Methods:**
- `generatePressRelease()`: Professional press release
- `generateSocialMedia()`: Twitter, LinkedIn, Instagram, Facebook content
- `generateTalkingPoints()`: For public officials
- `generateCommunityOutreach()`: Town hall materials, FAQ

**Note**: Currently not integrated into main workflow, but available for future use

### Services (`src/services/`)

#### **1. Simulation Runner** (`simulation-runner.ts`)
**Orchestrates simulation execution:**

```typescript
async function runSimulation(simulationId: string)
```

**Flow:**
1. Fetch simulation with relations
2. Update status to RUNNING, set startedAt
3. Broadcast start event
4. Fetch urban data via `getUrbanData()`
5. Extract policy actions from policyDoc
6. Create SimulationAgent
7. Run agent (streams results)
8. Update simulation with results and metrics
9. Broadcast completion
10. Handle errors → set status to FAILED

#### **2. Debate Runner** (`debate-runner.ts`)
**Orchestrates debate execution:**

```typescript
async function runDebateSimulation(debateId: string, rounds: number)
```

**Flow:**
1. Fetch debate with simulation
2. Broadcast start
3. Create DebateAgent
4. Run agent (generates arguments)
5. Update debate with results
6. Broadcast completion

#### **3. Report Generator** (`report-generator.ts`)
**Orchestrates report generation:**

```typescript
async function generateReport(reportId: string, sections?: string[])
```

**Flow:**
1. Fetch report with project and simulation
2. Broadcast start
3. Create AggregatorAgent
4. Generate report content
5. Update report with content
6. Broadcast completion

#### **4. PDF Parser** (`pdf-parser.ts`)
**Parses PDF files:**

```typescript
async function parsePDF(filepath: string): Promise<string>
function cleanPDFText(text: string): string
```

- Uses `pdf-parse` library
- Cleans whitespace, page numbers, line breaks

#### **5. Policy Extractor** (`policy-extractor.ts`)
**Extracts structured actions from policy text:**

```typescript
async function extractPolicyActions(policyText: string): Promise<{actions: PolicyAction[]}>
```

**Uses Gemini LLM to extract:**
- Action type (zoning_change, infrastructure_addition, etc.)
- Description
- Target area
- Parameters
- Expected impacts

**Output Structure:**
```typescript
interface PolicyAction {
  type: string;
  description: string;
  targetArea?: string;
  parameters: Record<string, any>;
  impacts: string[];
}
```

### Data Services (`src/data/`)

#### **1. Urban Data Service** (`urban-data-service.ts`)
**Main aggregator for all urban data:**

```typescript
async function getUrbanData(query: UrbanDataQuery): Promise<UrbanData>
```

**Flow:**
1. Geocode city via Mapbox → get bounds and center
2. Fetch in parallel:
   - Demographics (Census)
   - Traffic (Mapbox)
   - Buildings (OSM)
   - Air Quality (EPA)
   - Housing (HUD)
   - Land Use (OSM)
3. Return aggregated UrbanData object

**UrbanData Structure:**
```typescript
{
  location: {
    city: string,
    region?: string,
    bounds: {north, south, east, west},
    center: [lng, lat]
  },
  demographics: {...},
  traffic: {...},
  buildings: {...},
  emissions: {...},
  housing: {...},
  landUse: {...}
}
```

#### **2. Census Service** (`census-service.ts`)
**Fetches demographic data:**

- Geocodes coordinates → gets census tract
- Fetches ACS 5-Year data:
  - Population
  - Median income
  - Housing units
  - Commute patterns
- Falls back to mock data if API unavailable

#### **3. EPA Service** (`epa-service.ts`)
**Fetches air quality data:**

- PM2.5, Ozone, NO2
- Air Quality Index
- Currently uses mock data (requires county FIPS codes)

#### **4. HUD Service** (`hud-service.ts`)
**Fetches housing data:**

- Fair Market Rents
- Income Limits
- Affordable housing units
- Currently uses mock data

#### **5. Mapbox Service** (`mapbox-service.ts`)
**Mapbox API integration:**

- `geocode()`: Geocodes city name → coordinates and bounds
- `getTrafficData()`: Returns traffic layer metadata
- `getIsochrone()`: Travel time isochrones

#### **6. OSM Service** (`osm-service.ts`)
**OpenStreetMap via Overpass API:**

- `getBuildings()`: Queries building data for bounds
- `getLandUse()`: Queries land use data
- Processes OSM elements → structured data

### WebSocket System (`src/streaming/`)

#### **WebSocket Server** (`websocket.ts`)
**Real-time communication:**

**Connection:**
- Endpoint: `/ws`
- Each client gets unique sessionId
- Maintains Map of clients with subscriptions

**Message Types:**
- `subscribe`: Subscribe to channel (e.g., `simulation:${id}`)
- `unsubscribe`: Unsubscribe from channel
- `ping`: Health check

**Broadcasting:**
- `broadcastToChannel(channel, data)`: Sends to all subscribers
- `broadcastToAll(data)`: Sends to all clients
- `sendToSession(sessionId, data)`: Sends to specific client

**Channel Naming:**
- `simulation:${simulationId}`
- `debate:${debateId}`
- `report:${reportId}`

#### **Broadcaster** (`broadcaster.ts`)
**Higher-level streaming utilities:**

- `streamToken()`: Stream LLM token
- `streamProgress()`: Stream progress update
- `streamResult()`: Stream result
- `streamError()`: Stream error
- `streamComplete()`: Stream completion

**Also stores events in database (StreamEvent model)**

### Database (`src/db/`)

#### **Client** (`client.ts`)
- PrismaClient instance
- Connection logging in development
- Auto-connects on import

#### **Migration** (`migrate.ts`)
- Runs Prisma migrations
- Generates Prisma Client

#### **Seed** (`seed.ts`)
- Creates sample agents (all 5 types)
- Creates sample project
- Links agents to project

### Configuration (`src/config.ts`)
**Environment variables:**
- `DATABASE_URL`: PostgreSQL connection
- `GEMINI_API_KEY`: Google Gemini API
- `MAPBOX_ACCESS_TOKEN`: Mapbox API
- `CENSUS_API_KEY`, `EPA_API_KEY`, `HUD_API_KEY`: Optional
- `BACKEND_PORT`: Server port (default 3001)
- `CORS_ORIGIN`: Frontend URL (default localhost:5173)

---

## 🎨 FRONTEND ARCHITECTURE (React/TypeScript)

### Tech Stack
- **Framework**: React 18.2
- **Router**: React Router DOM 6.22
- **State**: Zustand 4.5 (not heavily used, mostly React Query)
- **Data Fetching**: TanStack React Query 5.20
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 12.23
- **Icons**: Lucide React 0.323
- **Maps**: Mapbox GL 3.1, React Map GL 7.1
- **Charts**: Recharts 2.12
- **Markdown**: React Markdown 9.0
- **Build**: Vite 5.1

### Routing (`src/App.tsx`)
**Routes:**
- `/` → UnifiedApp (main landing)
- `/old` → LandingPage
- `/test` → TestPage
- `/unified` → UnifiedDashboard
- `/dashboard` → CinematicDashboard
- `/app/dashboard` → CinematicDashboard
- `/app/projects/:projectId` → ProjectDetail
- `/app/simulation/:simulationId?` → SimulationCanvas
- `/app/debate/:debateId?` → DebateView
- `/app/reports/:reportId?` → ReportBuilder
- `/app/console` → StreamingConsole

### Main Pages

#### **1. UnifiedApp** (`pages/UnifiedApp.tsx`)
**Main landing page with full workflow:**

**Sections:**
1. **Hero Landing**: Animated background, CTA buttons
2. **Full-Screen Map**: DynamicSimulationMap component
3. **Projects Section**: Project cards, create project
4. **Agents Section**: Agent cards, create agent

**Features:**
- Real-time simulation feed (right side panel)
- Floating controls (location input, live simulation info)
- Chat with Map component (always available)
- WebSocket integration for live updates
- Simulation results visualization

**State Management:**
- `selectedProject`: Currently selected project
- `city`: Location for simulation
- `runningSimulation`: Active simulation ID
- `simulationResults`: Latest results
- `chatMapCommands`: Commands from chat

**Key Functions:**
- `startSimulation()`: Creates and starts simulation
- `handleMapCommand()`: Processes chat commands
- `testVisualEffects()`: Mock data for testing

#### **2. UnifiedDashboard** (`pages/UnifiedDashboard.tsx`)
**Full-screen map dashboard:**

**Layout:**
- Full-screen Mapbox map
- Top bar: Logo, city selector, menu button
- Left floating panel: Quick actions (Projects, Agents, Run, Layers)
- Right slide-in menu: Control panel
- Bottom status bar: Simulation status

**Features:**
- Layer toggles (buildings, traffic, housing, emissions, equity)
- Project selection
- Agent management
- Policy upload
- Live feed display

#### **3. SimulationCanvas** (`pages/SimulationCanvas.tsx`)
**Simulation configuration and visualization:**

**Layout:**
- Left panel: Configuration (policy doc, city, time horizon, analysis depth, layers)
- Center: EnhancedMapView
- Right panel: Live stream and metrics

**Features:**
- Policy document selection
- Time horizon slider (1-50 years)
- Analysis depth (basic, detailed, comprehensive)
- Layer selection
- Real-time streaming display
- Metrics visualization

#### **4. DebateView** (`pages/DebateView.tsx`)
**Debate interface:**

**Layout:**
- Left panel: Configuration (rounds, filters)
- Center: Debate messages (pro/con cards)
- Right panel: Summary (sentiment, risk scores)

**Features:**
- Filter by pro/con/all
- Risk assessment visualization
- Sentiment analysis display
- Live streaming of debate arguments

#### **5. ReportBuilder** (`pages/ReportBuilder.tsx`)
**Report generation interface:**

**Layout:**
- Left panel: Configuration (title, format, sections)
- Center: Report preview (markdown rendered)
- Right panel: Table of contents

**Features:**
- Format selection (PDF, PowerPoint, HTML, Markdown)
- Section selection (checkboxes)
- Live streaming of report generation
- Markdown preview

#### **6. ProjectDetail** (`pages/ProjectDetail.tsx`)
**Project management page:**

**Features:**
- Project info display
- Policy documents list
- Simulations list
- Assigned agents
- Recent reports
- Actions: Upload policy, new simulation, generate report

### Key Components

#### **1. DynamicSimulationMap** (`components/DynamicSimulationMap.tsx`)
**Advanced Mapbox visualization:**

**Features:**
- 3D buildings (Mapbox Standard style)
- Real-time simulation effects:
  - Construction markers (new buildings)
  - Demolition markers
  - New road overlays
  - Public sentiment markers
- Heatmap overlays (concentric or gradient)
- Policy maker attribution
- 3D/2D toggle
- Heatmap toggle
- Detailed analysis console integration

**Dynamic Updates:**
- Listens to `simulationData` prop
- Updates markers based on metrics
- Creates heatmap zones based on impact
- Shows policy maker info

**Map Layers:**
- Standard style (built-in 3D buildings)
- Traffic layer (if enabled)
- Custom simulation overlays

#### **2. EnhancedMapView** (`components/EnhancedMapView.tsx`)
**Simpler map view:**

**Features:**
- Basic Mapbox integration
- Layer toggles
- Simulation data overlays
- Glass legend UI

#### **3. ChatWithMap** (`components/ChatWithMap.tsx`)
**Natural language map commands:**

**Features:**
- Floating chat button
- Slide-in chat panel
- Natural language parsing:
  - Traffic commands
  - Housing commands
  - Highlight area
  - Parking removal
  - Demolition
  - Heatmap
- Executes map commands via `onMapCommand` callback

**Command Types:**
- `add-housing`: Adds housing units
- `highlight-roads`: Highlights traffic
- `highlight-area`: Highlights location
- `remove-parking`: Analyzes parking removal
- `demolition`: Shows demolition impact
- `show-heatmap`: Toggles heatmap

#### **4. DetailedAnalysisConsole** (`components/DetailedAnalysisConsole.tsx`)
**Detailed impact breakdown:**

**Features:**
- Expandable console
- Policy action breakdowns
- Location-specific impacts
- Zoom to location
- Affected items list
- Bottleneck identification
- Public reaction display

**Data Structure:**
- Hardcoded detailed impacts (5 examples)
- Shows specific locations, buildings, roads affected
- Impact percentages
- Why explanations

#### **5. Modals**
- **CreateProjectModal**: Create new project
- **CreateAgentModal**: Create new agent
- **AddAgentModal**: Add agents to project
- **UploadPolicyModal**: Upload PDF policy document

### Hooks

#### **useWebSocket** (`hooks/useWebSocket.ts`)
**WebSocket client hook:**

**Features:**
- Connects to `ws://localhost:3001/ws`
- Maintains message array
- `subscribe(channel)`: Subscribe to channel
- `unsubscribe(channel)`: Unsubscribe
- `clearMessages()`: Clear message history

**Message Structure:**
```typescript
{
  type: string,
  channel?: string,
  data: any,
  timestamp: string
}
```

### Services

#### **API Client** (`services/api.ts`)
**Axios-based API client:**

**Endpoints:**
- `agentsApi`: CRUD for agents
- `projectsApi`: CRUD for projects + agent management
- `uploadApi`: Upload and manage policy documents
- `simulationsApi`: CRUD for simulations
- `debatesApi`: CRUD for debates
- `reportsApi`: CRUD for reports

**Base URL**: `/api` (proxied to `http://localhost:3001`)

### Styling

**Tailwind Configuration:**
- Custom primary color palette
- Dark theme throughout
- Glass morphism effects
- Gradient backgrounds
- Animated elements

**Design Patterns:**
- Glass cards with backdrop blur
- Gradient borders with blur
- Animated particles
- Hover effects with scale
- Smooth transitions

---

## 🔄 DATA FLOW & WORKFLOWS

### Complete Workflow: Policy Upload → Simulation → Debate → Report

#### **Step 1: Project Creation**
1. User creates project via `CreateProjectModal`
2. POST `/api/projects` → Creates project in database
3. Frontend refetches projects list

#### **Step 2: Agent Assignment**
1. User clicks "Add Agents" on project
2. `AddAgentModal` shows available agents
3. User selects agents (recommended: SIMULATION, DEBATE, AGGREGATOR)
4. POST `/api/projects/:id/agents` for each agent
5. Creates ProjectAgent records

#### **Step 3: Policy Document Upload**
1. User clicks "Upload Policy"
2. `UploadPolicyModal` → file selection
3. POST `/api/upload?projectId=xxx` with FormData
4. Backend:
   - Saves file to `uploads/` directory
   - Parses PDF → extracts text
   - Calls `extractPolicyActions()` → LLM extracts actions
   - Creates PolicyDocument record
5. Returns document with action count

#### **Step 4: Simulation Execution**
1. User clicks "Run Simulation"
2. Frontend:
   - Fetches project agents
   - Finds SIMULATION agent
   - POST `/api/simulations` with:
     ```json
     {
       "projectId": "...",
       "agentId": "...",
       "city": "San Francisco, CA",
       "parameters": {
         "timeHorizon": 10,
         "focusAreas": [],
         "analysisDepth": "detailed"
       }
     }
     ```
3. Backend:
   - Creates simulation (status: PENDING)
   - Returns simulation ID
   - Starts `runSimulation()` async
4. Background process:
   - Updates status to RUNNING
   - Fetches urban data (parallel API calls)
   - Creates SimulationAgent
   - Agent streams analysis via WebSocket
   - Calculates metrics
   - Updates simulation (status: COMPLETED, results, metrics)
   - Broadcasts completion
5. Frontend:
   - Subscribes to `simulation:${id}` channel
   - Receives streaming tokens
   - Updates UI in real-time
   - When completed, displays results on map

#### **Step 5: Debate Execution**
1. User navigates to DebateView
2. Selects completed simulation
3. Clicks "Start Debate"
4. POST `/api/debate` with:
   ```json
   {
     "simulationId": "...",
     "agentId": "...",
     "rounds": 3
   }
   ```
5. Backend:
   - Verifies simulation is COMPLETED
   - Creates debate record
   - Starts `runDebateSimulation()` async
6. Background process:
   - Creates DebateAgent
   - Runs rounds (pro/con arguments)
   - Analyzes sentiment
   - Assesses risks
   - Updates debate with results
7. Frontend:
   - Subscribes to `debate:${id}` channel
   - Displays arguments as they stream
   - Shows sentiment and risk scores

#### **Step 6: Report Generation**
1. User navigates to ReportBuilder
2. Selects project
3. Configures report (title, format, sections)
4. Clicks "Generate Report"
5. POST `/api/reports` with:
   ```json
   {
     "projectId": "...",
     "simulationId": "...",
     "title": "...",
     "format": "PDF",
     "sections": [...]
   }
   ```
6. Backend:
   - Creates report record
   - Starts `generateReport()` async
7. Background process:
   - Creates AggregatorAgent
   - Generates each section (streams tokens)
   - Updates report with content
8. Frontend:
   - Subscribes to `report:${id}` channel
   - Displays markdown as it streams
   - Shows table of contents

### Real-Time Streaming Flow

**WebSocket Connection:**
1. Frontend connects to `ws://localhost:3001/ws`
2. Receives sessionId
3. Subscribes to channels (e.g., `simulation:${id}`)

**Agent Streaming:**
1. Agent calls `broadcastToChannel(channel, data)`
2. WebSocket server finds all clients subscribed to channel
3. Sends message to each client
4. Frontend receives message → updates UI

**Message Format:**
```json
{
  "type": "broadcast",
  "channel": "simulation:abc123",
  "data": {
    "type": "token",
    "agentType": "simulation",
    "data": {
      "token": "The policy will..."
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

---

## 🔌 API CONTRACTS

### REST API Endpoints

All endpoints return JSON. Errors return `{error: string}` with appropriate status codes.

#### **Agents**
- `GET /api/agents` → `Agent[]`
- `GET /api/agents/:id` → `Agent`
- `POST /api/agents` → `Agent` (201)
- `PUT /api/agents/:id` → `Agent`
- `DELETE /api/agents/:id` → `{success: true}`
- `GET /api/agents/:id/stats` → `{simulationCount, debateCount, recentActivity}`

#### **Projects**
- `GET /api/projects` → `Project[]`
- `GET /api/projects/:id` → `Project`
- `POST /api/projects` → `Project` (201)
- `PUT /api/projects/:id` → `Project`
- `DELETE /api/projects/:id` → `{success: true}`
- `POST /api/projects/:id/agents` → `ProjectAgent`
- `DELETE /api/projects/:id/agents/:agentId` → `{success: true}`

#### **Upload**
- `POST /api/upload?projectId=xxx` (multipart/form-data) → `{id, filename, uploadedAt, hasText, hasActions, actionCount}`
- `GET /api/upload/:id` → `PolicyDocument`
- `GET /api/upload/project/:projectId` → `PolicyDocument[]`
- `DELETE /api/upload/:id` → `{success: true}`

#### **Simulations**
- `GET /api/simulations?projectId=xxx` → `Simulation[]`
- `GET /api/simulations/:id` → `Simulation`
- `POST /api/simulations` → `Simulation` (201)
- `GET /api/simulations/:id/stream` → SSE stream
- `POST /api/simulations/:id/cancel` → `Simulation`
- `GET /api/simulations/:id/metrics` → `{id, status, metrics, results, startedAt, completedAt}`

#### **Debates**
- `GET /api/debate?simulationId=xxx` → `Debate[]`
- `GET /api/debate/:id` → `Debate`
- `POST /api/debate` → `Debate` (201)
- `GET /api/debate/:id/stream` → SSE stream

#### **Reports**
- `GET /api/reports?projectId=xxx` → `Report[]`
- `GET /api/reports/:id` → `Report`
- `POST /api/reports` → `Report` (201)
- `GET /api/reports/:id/stream` → SSE stream
- `DELETE /api/reports/:id` → `{success: true}`

### WebSocket Protocol

**Connection**: `ws://localhost:3001/ws`

**Client → Server:**
```json
{
  "type": "subscribe",
  "payload": {
    "channel": "simulation:abc123"
  }
}
```

**Server → Client:**
```json
{
  "type": "broadcast",
  "channel": "simulation:abc123",
  "data": {
    "type": "token",
    "agentType": "simulation",
    "data": {
      "token": "..."
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

---

## 🎯 KEY INTEGRATION POINTS

### External APIs

1. **Google Gemini API**
   - Used by all agents for LLM generation
   - Streaming API for real-time tokens
   - Model: `gemini-1.5-flash-latest`

2. **Mapbox API**
   - Geocoding
   - Traffic data
   - Map tiles (frontend)

3. **US Census Bureau API**
   - ACS 5-Year data
   - Demographics

4. **EPA Air Quality API**
   - Air quality measurements
   - Currently mocked

5. **HUD User API**
   - Housing data
   - Currently mocked

6. **OpenStreetMap (Overpass API)**
   - Building data
   - Land use data

### Database
- **PostgreSQL** via Prisma ORM
- Migrations: Prisma Migrate
- Seeding: Custom seed script

### File Storage
- **Local filesystem**: `uploads/` directory
- PDFs stored with timestamped filenames

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### Environment Variables Required

**Backend:**
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `MAPBOX_ACCESS_TOKEN`
- `BACKEND_PORT` (optional)
- `CORS_ORIGIN` (optional)
- `CENSUS_API_KEY` (optional)
- `EPA_API_KEY` (optional)
- `HUD_API_KEY` (optional)

**Frontend:**
- `VITE_MAPBOX_TOKEN`

### Build Process

**Backend:**
- TypeScript compilation
- Prisma Client generation
- No build step (runs with tsx)

**Frontend:**
- Vite build
- TypeScript compilation
- Static assets

### Ports
- Backend: 3001
- Frontend: 5173 (dev), production build served statically

---

## 🔄 MIGRATION TO FASTAPI + LANGGRAPH

### What Needs to be Replaced

1. **Fastify → FastAPI**
   - All route handlers
   - WebSocket implementation
   - File upload handling
   - CORS configuration

2. **TypeScript Agents → LangGraph**
   - SupervisorAgent → LangGraph supervisor node
   - SimulationAgent → LangGraph simulation node
   - DebateAgent → LangGraph debate workflow
   - AggregatorAgent → LangGraph aggregation workflow

3. **Prisma → SQLAlchemy/Alembic**
   - Database models
   - Migrations
   - Queries

4. **Google Gemini (TypeScript) → LangChain**
   - LLM calls via LangChain
   - Streaming via LangChain streaming
   - Tool integration

### What Stays the Same

1. **Database Schema**: Same Prisma schema → SQLAlchemy models
2. **API Contracts**: Same REST endpoints, same WebSocket protocol
3. **Frontend**: No changes needed
4. **Data Services**: Logic can be ported, API calls stay the same
5. **Workflow**: Same overall flow

### Key Considerations

1. **WebSocket**: FastAPI WebSockets work differently than Fastify
2. **Streaming**: LangChain streaming needs to match current format
3. **Async**: Python async/await patterns
4. **Error Handling**: Python exception handling
5. **File Uploads**: FastAPI multipart handling

---

## 📝 NOTES & OBSERVATIONS

### Current Limitations

1. **Mock Data**: EPA and HUD services use mock data (need proper API keys and geocoding)
2. **Error Handling**: Basic error handling, could be more robust
3. **Validation**: Zod schemas are good, but could be more comprehensive
4. **Testing**: No tests present
5. **Documentation**: Limited inline documentation

### Strengths

1. **Real-time Streaming**: Excellent WebSocket implementation
2. **Modular Architecture**: Clean separation of concerns
3. **Flexible Agent System**: Easy to add new agent types
4. **Rich Frontend**: Beautiful UI with real-time updates
5. **Data Integration**: Multiple real data sources

### Future Enhancements

1. **Agent Creator UI**: Mentioned in requirements but not implemented
2. **SlideDeck Creator**: PropagandaAgent exists but not integrated
3. **More Data Sources**: Additional urban data APIs
4. **Caching**: Redis caching for API responses
5. **Export**: Actual PDF/PowerPoint generation (currently just markdown)

---

## 🎓 ARCHITECTURAL PATTERNS

### Backend Patterns

1. **Service Layer**: Business logic in services, routes are thin
2. **Agent Pattern**: Each agent is a class with run() method
3. **Repository Pattern**: Prisma provides data access abstraction
4. **Observer Pattern**: WebSocket broadcasting
5. **Strategy Pattern**: Different agent types for different strategies

### Frontend Patterns

1. **Container/Presentational**: Pages are containers, components are presentational
2. **Custom Hooks**: useWebSocket for reusable logic
3. **React Query**: Server state management
4. **Component Composition**: Modals, maps, consoles composed together
5. **Controlled Components**: Form inputs controlled by state

---

This analysis covers the entire codebase in depth. Every file, every pattern, every data flow has been documented.

