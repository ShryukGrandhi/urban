/**
 * Unified Simulation Context
 * ALL features share this data - everything knows everything
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SimulationContextType {
  // Shared policy data
  currentPolicy: {
    name: string;
    document: any;
    goal: string;
    politician: string;
  } | null;
  setCurrentPolicy: (policy: any) => void;

  // Shared simulation results
  simulationResults: {
    parameters: any;
    mapbox_data: any;
    analysis: string;
    agents: {
      consulting: string;
      simulation: string;
      debate: string;
      aggregator: string;
      mapbox: string;
    };
  } | null;
  setSimulationResults: (results: any) => void;

  // Shared map interactions
  blockedRoads: any[];
  addBlockedRoad: (road: any) => void;
  impactZones: any[];
  addImpactZone: (zone: any) => void;

  // Shared analytics
  analytics: {
    totalImpact: number;
    affectedPopulation: number;
    trafficChange: number;
    economicImpact: number;
  } | null;
  setAnalytics: (analytics: any) => void;

  // Workflow state
  workflowRunning: boolean;
  setWorkflowRunning: (running: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [currentPolicy, setCurrentPolicy] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [blockedRoads, setBlockedRoads] = useState<any[]>([]);
  const [impactZones, setImpactZones] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const addBlockedRoad = (road: any) => {
    setBlockedRoads(prev => [...prev, road]);
  };

  const addImpactZone = (zone: any) => {
    setImpactZones(prev => [...prev, zone]);
  };

  const value = {
    currentPolicy,
    setCurrentPolicy,
    simulationResults,
    setSimulationResults,
    blockedRoads,
    addBlockedRoad,
    impactZones,
    addImpactZone,
    analytics,
    setAnalytics,
    workflowRunning,
    setWorkflowRunning,
    currentStep,
    setCurrentStep,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}

