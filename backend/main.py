"""
FastAPI Backend for Multi-Agent System
Provides REST API and WebSocket streaming for all agent types
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import asyncio
import json
import logging
from datetime import datetime
from dotenv import load_dotenv

import sys
import os

# Load environment variables from .env file (but don't fail if it doesn't exist)
try:
    load_dotenv()
except:
    pass

# Verify GEMINI_API_KEY is set
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("\n" + "="*60)
    print("ERROR: GEMINI_API_KEY not found!")
    print("="*60)
    print("\nSet environment variable or create .env file:")
    print("\nGEMINI_API_KEY=your_api_key_here")
    print("\nGet your API key from: https://makersuite.google.com/app/apikey")
    print("="*60 + "\n")
    raise ValueError("GEMINI_API_KEY must be set")

print(f"[OK] GEMINI_API_KEY loaded (length: {len(GEMINI_API_KEY)})")

sys.path.append(os.path.join(os.path.dirname(__file__), 'create_agents'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'simulation_agents'))

# Try to import agent modules, but don't fail if they're not available yet
try:
    from agent_types import AgentType, AgentConfig, AGENT_CAPABILITIES
    from orchestrate import get_orchestrator
    AGENTS_AVAILABLE = True
    print("[OK] Agent modules loaded successfully")
except Exception as e:
    print(f"[WARNING] Could not load agent modules: {e}")
    print("Server will run without agent functionality")
    AGENTS_AVAILABLE = False
    # Create dummy classes
    class AgentType:
        pass
    class AgentConfig:
        pass
    AGENT_CAPABILITIES = {}
    def get_orchestrator():
        return None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="URBAN Multi-Agent API",
    description="Flexible multi-agent system for policy analysis and content generation",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        logger.info(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast(self, message: dict):
        for client_id in list(self.active_connections.keys()):
            await self.send_message(client_id, message)

manager = ConnectionManager()


# Request/Response Models
class AgentExecutionRequest(BaseModel):
    agent_type: str
    description: str
    simulation_data: Optional[Dict[str, Any]] = None
    policy_data: Optional[Dict[str, Any]] = None
    custom_input: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None
    stream: bool = True


class AgentChainRequest(BaseModel):
    agents: List[Dict[str, Any]]
    simulation_data: Optional[Dict[str, Any]] = None
    policy_data: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    success: bool
    agent_id: str
    agent_type: str
    task_id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status: str


# API Endpoints

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "URBAN Multi-Agent API",
        "version": "2.0.0",
        "status": "operational",
        "agents_available": len(AGENT_CAPABILITIES),
        "documentation": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    orchestrator = get_orchestrator()
    stats = orchestrator.get_stats()
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "orchestrator": stats
    }


@app.get("/api/agent-types")
async def get_agent_types():
    """Get all available agent types and their capabilities"""
    if not AGENTS_AVAILABLE:
        return {"agent_types": []}
    
    return {
        "agent_types": [
            {
                "type": capability.type.value,
                "name": capability.name,
                "description": capability.description,
                "icon": capability.icon,
                "color_gradient": capability.color_gradient,
                "capabilities": {
                    "can_analyze_data": capability.can_analyze_data,
                    "can_generate_content": capability.can_generate_content,
                    "can_communicate_externally": capability.can_communicate_externally,
                    "can_create_visualizations": capability.can_create_visualizations,
                    "can_make_recommendations": capability.can_make_recommendations,
                },
                "required_inputs": capability.required_inputs,
                "optional_inputs": capability.optional_inputs,
                "output_types": capability.output_types,
            }
            for capability in AGENT_CAPABILITIES.values()
        ]
    }


# In-memory agent registry
created_agents = {}

@app.post("/api/agents/create")
async def create_agent(agent_data: dict):
    """
    Create a new custom agent that can be executed
    """
    agent_id = f"agent-{datetime.utcnow().timestamp()}"
    agent = {
        "id": agent_id,
        "name": agent_data.get("name"),
        "type": agent_data.get("type"),
        "role": agent_data.get("role"),
        "scope": agent_data.get("scope"),
        "sources": agent_data.get("sources", []),
        "status": "ACTIVE",
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
        "_count": {
            "executions": 0
        }
    }
    created_agents[agent_id] = agent
    return agent


@app.get("/api/agents")
async def list_agents():
    """List all created agents"""
    return list(created_agents.values())


@app.get("/api/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get a specific agent"""
    if agent_id not in created_agents:
        raise HTTPException(status_code=404, detail="Agent not found")
    return created_agents[agent_id]


@app.post("/api/agents/{agent_id}/execute")
async def execute_custom_agent(agent_id: str, execution_request: dict):
    """
    Execute a custom created agent
    """
    # If agent doesn't exist in backend, try to get type from execution request
    if agent_id not in created_agents:
        logger.warning(f"Agent {agent_id} not found in backend, attempting to infer from request")
        
        # Try to extract agent type from execution request or agent_id
        agent_type_str = execution_request.get("agent_type")
        if not agent_type_str:
            # Try to extract from agent_id (format: agent-timestamp)
            # Create a temporary agent entry
            agent = {
                "id": agent_id,
                "type": "MEDIA_CALLING",  # Default to media calling
                "name": "Temporary Agent",
                "role": execution_request.get("description", "Execute task")
            }
            logger.info(f"Created temporary agent entry for {agent_id}")
        else:
            agent = {
                "id": agent_id,
                "type": agent_type_str,
                "name": "Temporary Agent",
                "role": execution_request.get("description", "Execute task")
            }
    else:
        agent = created_agents[agent_id]
    
    try:
        agent_type = AgentType(agent["type"])
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid agent type: {agent['type']}")
    
    # Create execution request
    description = execution_request.get("description", agent["role"])
    custom_input = execution_request.get("custom_input", {})
    stream = execution_request.get("stream", True)
    
    # Execute the agent
    config = AgentConfig(**(execution_request.get("config", {})))
    config.streaming = stream
    
    agent_exec_id = f"{agent['type']}-{agent_id}-{datetime.utcnow().timestamp()}"
    
    orchestrator = get_orchestrator()
    
    if stream:
        # Return task ID, client connects to WebSocket
        task_id = f"task-{agent_exec_id}"
        
        asyncio.create_task(
            execute_and_broadcast(
                orchestrator=orchestrator,
                agent_id=agent_exec_id,
                agent_type=agent_type,
                description=description,
                simulation_data=execution_request.get("simulation_data"),
                policy_data=execution_request.get("policy_data"),
                custom_input=custom_input,
                config=config
            )
        )
        
        # Increment execution count
        created_agents[agent_id]["_count"]["executions"] += 1
        
        return {
            "success": True,
            "agent_id": agent_exec_id,
            "task_id": task_id,
            "status": "started",
            "message": f"Executing {agent['name']} agent. Connect to WebSocket for streaming."
        }
    else:
        result = await orchestrator.execute_agent(
            agent_id=agent_exec_id,
            agent_type=agent_type,
            task_description=description,
            simulation_data=execution_request.get("simulation_data"),
            policy_data=execution_request.get("policy_data"),
            custom_input=custom_input,
            config=config
        )
        
        created_agents[agent_id]["_count"]["executions"] += 1
        
        return result


@app.post("/api/agents/execute")
async def execute_agent(request: AgentExecutionRequest):
    """
    Execute a single agent task
    Returns immediately with task ID if streaming, or full result if not streaming
    """
    try:
        agent_type = AgentType(request.agent_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid agent type: {request.agent_type}")
    
    # Create agent configuration
    config = AgentConfig(**(request.config or {}))
    config.streaming = request.stream
    
    # Generate agent ID
    agent_id = f"{agent_type.value}-{datetime.utcnow().timestamp()}"
    
    orchestrator = get_orchestrator()
    
    if request.stream:
        # Return task ID immediately, client should connect to WebSocket
        task_id = f"task-{agent_id}"
        
        # Execute in background
        asyncio.create_task(
            execute_and_broadcast(
                orchestrator=orchestrator,
                agent_id=agent_id,
                agent_type=agent_type,
                description=request.description,
                simulation_data=request.simulation_data,
                policy_data=request.policy_data,
                custom_input=request.custom_input,
                config=config
            )
        )
        
        return {
            "success": True,
            "agent_id": agent_id,
            "task_id": task_id,
            "status": "started",
            "message": "Agent execution started. Connect to WebSocket for streaming updates."
        }
    else:
        # Execute synchronously
        result = await orchestrator.execute_agent(
            agent_id=agent_id,
            agent_type=agent_type,
            task_description=request.description,
            simulation_data=request.simulation_data,
            policy_data=request.policy_data,
            custom_input=request.custom_input,
            config=config
        )
        return result


@app.get("/api/agents/execute/{agent_id}/stream")
async def stream_agent_execution(agent_id: str):
    """
    Stream agent execution results via Server-Sent Events
    Alternative to WebSocket for clients that prefer SSE
    """
    async def event_generator():
        orchestrator = get_orchestrator()
        # Note: This is a simplified implementation
        # In production, you'd want to store pending tasks and stream them here
        yield f"data: {json.dumps({'type': 'start', 'agent_id': agent_id})}\n\n"
        await asyncio.sleep(1)
        yield f"data: {json.dumps({'type': 'complete', 'agent_id': agent_id})}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/agents/chain")
async def execute_agent_chain(request: AgentChainRequest):
    """
    Execute multiple agents in sequence
    Each agent receives context from previous agents
    """
    orchestrator = get_orchestrator()
    
    try:
        results = await orchestrator.execute_agent_chain(
            agents=request.agents,
            simulation_data=request.simulation_data,
            policy_data=request.policy_data
        )
        
        return {
            "success": True,
            "chain_results": results,
            "total_agents": len(request.agents),
            "completed": len(results)
        }
    except Exception as e:
        logger.error(f"Error executing agent chain: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/orchestrator/stats")
async def get_orchestrator_stats():
    """Get orchestrator statistics"""
    orchestrator = get_orchestrator()
    return orchestrator.get_stats()


@app.get("/api/orchestrator/context")
async def get_aggregated_context():
    """Get current aggregated context"""
    orchestrator = get_orchestrator()
    return orchestrator.get_context()


@app.post("/api/orchestrator/context/clear")
async def clear_context():
    """Clear aggregated context"""
    orchestrator = get_orchestrator()
    orchestrator.clear_context()
    return {"success": True, "message": "Context cleared"}


@app.get("/api/orchestrator/tasks")
async def get_completed_tasks():
    """Get all completed tasks"""
    orchestrator = get_orchestrator()
    return orchestrator.get_completed_tasks()


@app.post("/api/reports/download")
async def download_report(request: dict):
    """
    Generate downloadable report file (PDF, DOCX, MD)
    """
    from fastapi.responses import Response
    
    content = request.get("content", "")
    format_type = request.get("format", "markdown")
    filename = request.get("filename", "policy_report")
    
    if format_type == "markdown" or format_type == "md":
        return Response(
            content=content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.md"
            }
        )
    elif format_type == "pdf":
        # For now, return as text - in production would use reportlab or weasyprint
        return Response(
            content=content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.pdf"
            }
        )
    elif format_type == "html":
        # Convert markdown to basic HTML
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{filename}</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }}
        h1, h2, h3 {{ color: #333; }}
        pre {{ background: #f4f4f4; padding: 10px; border-radius: 5px; }}
    </style>
</head>
<body>
    <pre>{content}</pre>
</body>
</html>
"""
        return Response(
            content=html_content,
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.html"
            }
        )
    else:
        return Response(
            content=content,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.txt"
            }
        )


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for real-time agent streaming
    Clients receive token-by-token updates as agents execute
    """
    await manager.connect(client_id, websocket)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "ping":
                await manager.send_message(client_id, {"type": "pong"})
            
            elif message_type == "subscribe":
                # Client wants to subscribe to specific agent
                agent_id = data.get("agent_id")
                await manager.send_message(client_id, {
                    "type": "subscribed",
                    "agent_id": agent_id
                })
            
            elif message_type == "execute":
                # Client wants to execute an agent
                try:
                    agent_type = AgentType(data["agent_type"])
                    agent_id = f"{agent_type.value}-{client_id}-{datetime.utcnow().timestamp()}"
                    
                    config = AgentConfig(**(data.get("config", {})))
                    
                    orchestrator = get_orchestrator()
                    
                    # Stream execution
                    async for event in orchestrator.execute_agent_stream(
                        agent_id=agent_id,
                        agent_type=agent_type,
                        task_description=data["description"],
                        simulation_data=data.get("simulation_data"),
                        policy_data=data.get("policy_data"),
                        custom_input=data.get("custom_input"),
                        config=config
                    ):
                        await manager.send_message(client_id, event)
                
                except Exception as e:
                    await manager.send_message(client_id, {
                        "type": "error",
                        "error": str(e)
                    })
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        manager.disconnect(client_id)


async def execute_and_broadcast(
    orchestrator,
    agent_id: str,
    agent_type: AgentType,
    description: str,
    simulation_data: Optional[Dict[str, Any]],
    policy_data: Optional[Dict[str, Any]],
    custom_input: Optional[Dict[str, Any]],
    config: AgentConfig
):
    """
    Execute agent and broadcast results to all connected clients
    """
    try:
        # Send start message
        await manager.broadcast({
            "type": "progress",
            "agent_id": agent_id,
            "data": f"Starting {agent_type.value} agent execution...",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        async for event in orchestrator.execute_agent_stream(
            agent_id=agent_id,
            agent_type=agent_type,
            task_description=description,
            simulation_data=simulation_data,
            policy_data=policy_data,
            custom_input=custom_input,
            config=config
        ):
            # Ensure timestamp is added to event
            if "timestamp" not in event:
                event["timestamp"] = datetime.utcnow().isoformat()
            await manager.broadcast(event)
        
        # Send completion message
        await manager.broadcast({
            "type": "complete",
            "agent_id": agent_id,
            "data": f"{agent_type.value} agent execution completed successfully!",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in execute_and_broadcast: {e}")
        logger.exception(e)
        await manager.broadcast({
            "type": "error",
            "agent_id": agent_id,
            "data": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })


# VAPI Phone Call Endpoints
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), 'tools'))
    from vapi_service import vapi_service
    VAPI_AVAILABLE = vapi_service is not None
except Exception as e:
    logger.warning(f"VAPI service not available: {e}")
    VAPI_AVAILABLE = False


@app.post("/api/calls/make")
async def make_phone_call(request: dict):
    """
    Make an actual phone call using VAPI
    """
    if not VAPI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="VAPI service not configured. Add VAPI_PRIVATE_KEY to .env file"
        )
    
    phone_number = request.get("phone_number")
    message = request.get("message")
    agent_name = request.get("agent_name", "Policy Agent")
    call_type = request.get("call_type", "general")
    
    if not phone_number or not message:
        raise HTTPException(
            status_code=400,
            detail="phone_number and message are required"
        )
    
    try:
        if call_type == "media_outreach":
            result = vapi_service.make_media_outreach_call(
                phone_number=phone_number,
                policy_name=request.get("policy_name", "New Policy Initiative"),
                key_message=message,
                target_outlet=request.get("target_outlet", "your media outlet")
            )
        else:
            result = vapi_service.create_phone_call(
                phone_number=phone_number,
                message=message,
                agent_name=agent_name,
                first_message=request.get("first_message")
            )
        
        return result
    except Exception as e:
        logger.error(f"Error making phone call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/calls/{call_id}/status")
async def get_call_status(call_id: str):
    """
    Get the status of a phone call
    """
    if not VAPI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="VAPI service not configured"
        )
    
    try:
        result = vapi_service.get_call_status(call_id)
        return result
    except Exception as e:
        logger.error(f"Error getting call status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/vapi/phone-numbers")
async def get_vapi_phone_numbers():
    """
    Get available VAPI phone numbers for outbound calling
    """
    if not VAPI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="VAPI service not configured"
        )
    
    try:
        result = vapi_service.get_phone_numbers()
        return result
    except Exception as e:
        logger.error(f"Error getting VAPI phone numbers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calls/web-config")
async def get_web_call_config(request: dict):
    """
    Generate configuration for VAPI web call (browser-based, no phone number needed)
    Returns config that frontend can use with VAPI Web SDK
    """
    try:
        from vapi_web_call import generate_web_call_config
        
        message = request.get("message", "This is a test call")
        agent_name = request.get("agent_name", "Policy Agent")
        
        config = generate_web_call_config(message, agent_name)
        
        return {
            "success": True,
            "config": config,
            "instructions": "Use this config with VAPI Web SDK in your browser"
        }
    except Exception as e:
        logger.error(f"Error generating web call config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/documents/parse")
async def parse_document(file: UploadFile = File(...)):
    """
    Parse uploaded policy document (PDF) and extract all data
    """
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'tools'))
        from pdf_parser import parse_pdf
        
        # Read file bytes
        file_bytes = await file.read()
        
        logger.info(f"Parsing uploaded file: {file.filename} ({len(file_bytes)} bytes)")
        
        # Parse the PDF
        result = parse_pdf(file_bytes)
        
        if result.get("success"):
            logger.info(f"Successfully parsed PDF: {result['data']['page_count']} pages")
        
        return result
    except Exception as e:
        logger.error(f"Error parsing document: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8000))
    print(f"")
    print(f"[OK] Starting URBAN Backend on port {port}")
    print(f"[OK] WebSocket endpoint: ws://localhost:{port}/ws/{{client_id}}")
    print(f"[OK] API docs: http://localhost:{port}/docs")
    if VAPI_AVAILABLE:
        print(f"[OK] VAPI Voice AI: ENABLED (Real calls available)")
    else:
        print(f"[WARN] VAPI Voice AI: DISABLED (Add VAPI keys to enable)")
    print(f"")
    uvicorn.run(app, host="0.0.0.0", port=port)

