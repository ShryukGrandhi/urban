/**
 * Storage Abstraction Layer
 * 
 * This service provides a clean abstraction for data storage.
 * Currently uses in-memory storage, but can easily be swapped to API calls.
 * 
 * TO MIGRATE TO BACKEND:
 * 1. Import the API functions from './api'
 * 2. Replace each function's implementation with the corresponding API call
 * 3. Keep the same function signatures - no component changes needed!
 * 
 * Example:
 *   // Before (in-memory):
 *   list: async () => Promise.resolve(agentsStorage)
 * 
 *   // After (API):
 *   list: async () => agentsApi.list().then(res => res.data)
 */

// In-memory storage (temporary until backend is ready)
let agentsStorage: any[] = [];
let simulationsStorage: any[] = [];

// Agents Service
export const agentsService = {
  // Get all agents
  list: async (): Promise<any[]> => {
    // TODO: When backend is ready, replace with: return agentsApi.list().then(res => res.data);
    return Promise.resolve(agentsStorage);
  },

  // Get single agent
  get: async (id: string): Promise<any> => {
    // TODO: When backend is ready, replace with: return agentsApi.get(id).then(res => res.data);
    return Promise.resolve(agentsStorage.find(a => a.id === id));
  },

  // Create agent
  create: async (data: any): Promise<any> => {
    // Save to backend for execution
    try {
      const response = await fetch('http://localhost:8000/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const agentData = await response.json();
        agentsStorage.push(agentData);
        return agentData;
      }
    } catch (e) {
      console.warn('Backend not available, using local storage');
    }
    
    // Fallback to local storage
    const newAgent = {
      id: 'agent-' + Date.now(),
      ...data,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        simulations: 0,
        debates: 0
      }
    };
    agentsStorage.push(newAgent);
    return Promise.resolve(newAgent);
  },

  // Update agent
  update: async (id: string, data: any): Promise<any> => {
    // TODO: When backend is ready, replace with: return agentsApi.update(id, data).then(res => res.data);
    const index = agentsStorage.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Agent not found');
    agentsStorage[index] = { ...agentsStorage[index], ...data, updatedAt: new Date().toISOString() };
    return Promise.resolve(agentsStorage[index]);
  },

  // Delete agent
  delete: async (id: string): Promise<void> => {
    // TODO: When backend is ready, replace with: return agentsApi.delete(id);
    const index = agentsStorage.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Agent not found');
    agentsStorage[index].status = 'ARCHIVED';
    return Promise.resolve();
  }
};

// Simulations Service
export const simulationsService = {
  // Get all simulations
  list: async (): Promise<any[]> => {
    // TODO: When backend is ready, replace with: return simulationsApi.list().then(res => res.data);
    return Promise.resolve(simulationsStorage);
  },

  // Get single simulation
  get: async (id: string): Promise<any> => {
    // TODO: When backend is ready, replace with: return simulationsApi.get(id).then(res => res.data);
    return Promise.resolve(simulationsStorage.find(s => s.id === id));
  },

  // Create simulation
  create: async (data: any): Promise<any> => {
    // TODO: When backend is ready, replace with: return simulationsApi.create(data).then(res => res.data);
    const newSimulation = {
      id: 'sim-' + Date.now(),
      ...data,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      results: null,
      metrics: null
    };
    simulationsStorage.push(newSimulation);
    return Promise.resolve(newSimulation);
  },

  // Update simulation
  update: async (id: string, data: any): Promise<any> => {
    // TODO: When backend is ready, replace with: return simulationsApi.update(id, data).then(res => res.data);
    const index = simulationsStorage.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Simulation not found');
    simulationsStorage[index] = { ...simulationsStorage[index], ...data };
    return Promise.resolve(simulationsStorage[index]);
  }
};

// Policy Documents Service
export const policyDocsService = {
  // Upload policy document
  upload: async (file: File): Promise<any> => {
    // TODO: When backend is ready, replace with: return uploadApi.uploadPolicyDoc(projectId, file).then(res => res.data);
    return Promise.resolve({
      id: 'doc-' + Date.now(),
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      hasText: true,
      hasActions: true,
      actionCount: 0
    });
  },

  // Get policy document
  get: async (id: string): Promise<any> => {
    // TODO: When backend is ready, replace with: return uploadApi.get(id).then(res => res.data);
    return Promise.resolve(null);
  }
};

