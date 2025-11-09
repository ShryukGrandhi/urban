/**
 * Agent Service - API interactions for multi-agent system
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AgentType {
  type: string;
  name: string;
  description: string;
  icon: string;
  color_gradient: string;
  capabilities: {
    can_analyze_data: boolean;
    can_generate_content: boolean;
    can_communicate_externally: boolean;
    can_create_visualizations: boolean;
    can_make_recommendations: boolean;
  };
  required_inputs: string[];
  optional_inputs: string[];
  output_types: string[];
}

export interface AgentExecutionRequest {
  agent_type: string;
  description: string;
  simulation_data?: any;
  policy_data?: any;
  custom_input?: Record<string, any>;
  config?: Record<string, any>;
  stream?: boolean;
}

export interface AgentExecutionResponse {
  success: boolean;
  agent_id: string;
  agent_type: string;
  task_id?: string;
  result?: any;
  error?: string;
  status: string;
  message?: string;
}

export interface AgentChainRequest {
  agents: Array<{
    agent_type: string;
    description: string;
    custom_input?: Record<string, any>;
    config?: Record<string, any>;
  }>;
  simulation_data?: any;
  policy_data?: any;
}

class AgentService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.wsUrl = API_BASE_URL.replace('http', 'ws');
  }

  /**
   * Get all available agent types
   */
  async getAgentTypes(): Promise<{ agent_types: AgentType[] }> {
    const response = await axios.get(`${this.baseUrl}/api/agent-types`);
    return response.data;
  }

  /**
   * Execute a single agent
   */
  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResponse> {
    const response = await axios.post(`${this.baseUrl}/api/agents/execute`, request);
    return response.data;
  }

  /**
   * Execute a chain of agents
   */
  async executeAgentChain(request: AgentChainRequest): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/api/agents/chain`, request);
    return response.data;
  }

  /**
   * Get orchestrator statistics
   */
  async getOrchestratorStats(): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/api/orchestrator/stats`);
    return response.data;
  }

  /**
   * Get aggregated context
   */
  async getContext(): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/api/orchestrator/context`);
    return response.data;
  }

  /**
   * Clear context
   */
  async clearContext(): Promise<void> {
    await axios.post(`${this.baseUrl}/api/orchestrator/context/clear`);
  }

  /**
   * Get completed tasks
   */
  async getCompletedTasks(): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/api/orchestrator/tasks`);
    return response.data;
  }

  /**
   * Create a WebSocket connection for streaming
   */
  createWebSocket(clientId: string): WebSocket {
    return new WebSocket(`${this.wsUrl}/ws/${clientId}`);
  }

  /**
   * Helper to stream agent execution via WebSocket
   */
  streamAgentExecution(
    clientId: string,
    request: AgentExecutionRequest,
    onToken: (token: string) => void,
    onComplete: (result: any) => void,
    onError: (error: string) => void
  ): WebSocket {
    const ws = this.createWebSocket(clientId);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'execute',
        ...request
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'start':
          console.log('Agent started:', data.agent_id);
          break;
        case 'token':
          onToken(data.token);
          break;
        case 'complete':
          onComplete(data.result);
          ws.close();
          break;
        case 'error':
          onError(data.error);
          ws.close();
          break;
      }
    };

    ws.onerror = (error) => {
      onError('WebSocket error');
      console.error('WebSocket error:', error);
    };

    return ws;
  }
}

export const agentService = new AgentService();
export default agentService;

