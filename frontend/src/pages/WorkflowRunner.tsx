/**
 * Workflow Runner - Execute complete policy analysis workflow
 * 1. Consulting Agent (Supervisor) - defines goals
 * 2. Simulation Agent - runs simulations with Mapbox
 * 3. Debate Agent - analyzes pros/cons
 * 4. Aggregator Agent - compiles final report
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, Loader, AlertCircle, Map, BarChart3, Maximize2 } from 'lucide-react';
import { agentService } from '../services/agents';
import { SimulationMetricsDisplay } from '../components/SimulationMetricsDisplay';
import { DebateChatInterface } from '../components/DebateChatInterface';
import { ReportDownloadButton } from '../components/ReportDownloadButton';
import { ComprehensiveMapboxVisualization } from '../components/ComprehensiveMapboxVisualization';

type WorkflowStep = 'consulting' | 'simulation' | 'debate' | 'aggregator';
type StepStatus = 'pending' | 'running' | 'completed' | 'error';

interface StepState {
  status: StepStatus;
  output: string;
  result?: any;
  error?: string;
}

export function WorkflowRunner() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);
  const [steps, setSteps] = useState<Record<WorkflowStep, StepState>>({
    consulting: { status: 'pending', output: '' },
    simulation: { status: 'pending', output: '' },
    debate: { status: 'pending', output: '' },
    aggregator: { status: 'pending', output: '' },
  });

  // Input state
  const [politicianName, setPoliticianName] = useState('');
  const [policyGoal, setPolicyGoal] = useState('');
  const [city, setCity] = useState('');
  const [policyDocument, setPolicyDocument] = useState('');
  const [simulationPerspective, setSimulationPerspective] = useState<string[]>(['comprehensive']);
  const [simulationMetrics, setSimulationMetrics] = useState<any>(null);
  const [debateMessages, setDebateMessages] = useState<any[]>([]);
  const [finalReport, setFinalReport] = useState<string>('');
  const [simulationViewMode, setSimulationViewMode] = useState<'map' | 'metrics' | 'split'>('map');

  const [isRunning, setIsRunning] = useState(false);
  const [clientId] = useState(`client-${Date.now()}`);

  const stepConfig = {
    consulting: {
      title: 'Consulting Agent (Supervisor)',
      icon: '💡',
      description: 'Determines goals and creates strategic framework',
      color: 'from-cyan-600 to-blue-600',
    },
    simulation: {
      title: 'Simulation Agent',
      icon: '🔬',
      description: 'Runs policy simulations with Mapbox visualization',
      color: 'from-green-600 to-emerald-600',
    },
    debate: {
      title: 'Debate Agent',
      icon: '💬',
      description: 'Analyzes pros and cons with evidence',
      color: 'from-orange-600 to-red-600',
    },
    aggregator: {
      title: 'Aggregator Agent',
      icon: '📄',
      description: 'Compiles final PDF report with recommendations',
      color: 'from-purple-600 to-pink-600',
    },
  };

  const updateStepOutput = (step: WorkflowStep, token: string) => {
    setSteps((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        output: prev[step].output + token,
      },
    }));
  };

  const updateStepStatus = (step: WorkflowStep, status: StepStatus, result?: any, error?: string) => {
    setSteps((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        status,
        result,
        error,
      },
    }));
  };

  const executeStep = async (step: WorkflowStep, request: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      setCurrentStep(step);
      updateStepStatus(step, 'running');
      let fullOutput = '';

      const ws = agentService.streamAgentExecution(
        `${clientId}-${step}`,
        request,
        (token) => {
          fullOutput += token;
          updateStepOutput(step, token);

          // Parse simulation metrics in real-time - look for BOTH JSON blocks
          if (step === 'simulation') {
            try {
              // Extract ALL JSON blocks
              const jsonBlocks = fullOutput.match(/```json\s*(\{[\s\S]*?\})\s*```/g);
              
              if (jsonBlocks && jsonBlocks.length >= 1) {
                // First JSON block: Parameters
                const parametersJson = jsonBlocks[0].replace(/```json\s*/, '').replace(/\s*```$/, '');
                const parametersData = JSON.parse(parametersJson);
                
                // Second JSON block: Mapbox data (if exists)
                let mapboxData = null;
                if (jsonBlocks.length >= 2) {
                  const mapboxJson = jsonBlocks[1].replace(/```json\s*/, '').replace(/\s*```$/, '');
                  mapboxData = JSON.parse(mapboxJson);
                }
                
                if (parametersData.parameters || parametersData.peak_hour_congestion) {
                  setSimulationMetrics({
                    parameters: parametersData.parameters || parametersData,
                    overall_impact_score: parametersData.overall_impact_score,
                    recommendation: parametersData.recommendation,
                    mapbox_data: mapboxData
                  });
                  
                  // Auto-switch to map view when metrics are ready
                  setSimulationViewMode('map');
                  console.log('📊 Simulation complete! Interactive map ready with', Object.keys(parametersData.parameters || parametersData).length, 'parameters');
                }
              }
            } catch (e) {
              // Still parsing, continue
              console.log('Parsing simulation data...', e);
            }
          }

          // Parse debate messages
          if (step === 'debate') {
            try {
              const messageMatches = fullOutput.matchAll(/---\s*\*\*SIDE\*\*:\s*(FOR|AGAINST)\s*\*\*ROUND\*\*:\s*(\d+)\s*\*\*MESSAGE\*\*:\s*([\s\S]*?)---/g);
              const parsed = Array.from(messageMatches).map((match, idx) => ({
                id: `msg-${idx}`,
                side: match[1].toLowerCase() === 'for' ? 'pro' : 'con',
                round: parseInt(match[2]),
                content: match[3].trim(),
                timestamp: new Date().toISOString(),
              }));
              if (parsed.length > 0) {
                setDebateMessages(parsed);
              }
            } catch (e) {
              // Still parsing
            }
          }

          // Store final report
          if (step === 'aggregator') {
            setFinalReport(fullOutput);
          }
        },
        (result) => {
          updateStepStatus(step, 'completed', result);
          resolve(result);
        },
        (error) => {
          updateStepStatus(step, 'error', undefined, error);
          reject(error);
        }
      );
    });
  };

  const runWorkflow = async () => {
    if (!politicianName || !policyGoal || !city) {
      alert('Please fill in all required fields');
      return;
    }

    setIsRunning(true);

    try {
      // Step 1: Consulting Agent (Supervisor)
      console.log('Step 1: Running Consulting Agent...');
      const consultingResult = await executeStep('consulting', {
        agent_type: 'CONSULTING',
        description: `Determine goals and create strategic framework for ${politicianName}'s ${policyGoal} initiative in ${city}`,
        custom_input: {
          politician_info: {
            name: politicianName,
            city: city,
          },
          initial_request: policyGoal,
        },
        config: {
          temperature: 0.7,
          streaming: true,
        },
        stream: true,
      });

      // Step 2: Simulation Agent (with multiple perspectives if needed)
      console.log('Step 2: Running Simulation Agent...');
      
      // Run simulations for each selected perspective
      for (const perspective of simulationPerspective) {
        const simulationResult = await executeStep('simulation', {
          agent_type: 'SIMULATION',
          description: `Simulate ${perspective} impact for ${policyGoal} in ${city}`,
          custom_input: {
            perspective: perspective,
            city: city,
            policy_document: policyDocument,
          },
          config: {
            temperature: 0.7,
            streaming: true,
          },
          stream: true,
        });
      }

      // Step 3: Debate Agent
      console.log('Step 3: Running Debate Agent...');
      const debateResult = await executeStep('debate', {
        agent_type: 'DEBATE',
        description: `Analyze pros and cons of ${policyGoal} initiative`,
        custom_input: {
          rounds: 3,
          focus_areas: simulationPerspective,
        },
        config: {
          temperature: 0.7,
          streaming: true,
        },
        stream: true,
      });

      // Step 4: Aggregator Agent
      console.log('Step 4: Running Aggregator Agent...');
      const aggregatorResult = await executeStep('aggregator', {
        agent_type: 'AGGREGATOR',
        description: `Compile comprehensive report for ${policyGoal} initiative`,
        custom_input: {
          format: 'PDF',
          sections: [
            'executive_summary',
            'simulations',
            'debate',
            'recommendations',
          ],
        },
        config: {
          temperature: 0.7,
          streaming: true,
        },
        stream: true,
      });

      console.log('Workflow completed successfully!');
      setCurrentStep(null);
    } catch (error) {
      console.error('Workflow error:', error);
      alert(`Workflow failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'running':
        return <Loader className="w-5 h-5 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="relative z-10 px-8 py-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 text-white/80 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Policy Analysis Workflow</h1>
        </div>
      </div>

      <div className="relative z-10 px-8 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Workflow Configuration</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Politician/Official Name *
                  </label>
                  <input
                    type="text"
                    value={politicianName}
                    onChange={(e) => setPoliticianName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="e.g., Mayor Smith"
                    disabled={isRunning}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Policy Goal/Initiative *
                  </label>
                  <textarea
                    value={policyGoal}
                    onChange={(e) => setPolicyGoal(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                    rows={3}
                    placeholder="e.g., Build 500 new affordable housing units"
                    disabled={isRunning}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    City/Location *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="e.g., San Francisco, CA"
                    disabled={isRunning}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Policy Document (Optional)
                  </label>
                  <textarea
                    value={policyDocument}
                    onChange={(e) => setPolicyDocument(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                    rows={4}
                    placeholder="Paste policy text or key details..."
                    disabled={isRunning}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Simulation Perspectives
                  </label>
                  <div className="space-y-2">
                    {['comprehensive', 'traffic', 'buildings', 'housing', 'environment'].map((perspective) => (
                      <label key={perspective} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={simulationPerspective.includes(perspective)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSimulationPerspective([...simulationPerspective, perspective]);
                            } else {
                              setSimulationPerspective(simulationPerspective.filter(p => p !== perspective));
                            }
                          }}
                          className="w-4 h-4 text-cyan-600 bg-white/5 border-white/20 rounded focus:ring-cyan-500"
                          disabled={isRunning}
                        />
                        <span className="text-sm text-white capitalize">{perspective}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={runWorkflow}
                  disabled={isRunning || !politicianName || !policyGoal || !city}
                  className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-3"
                >
                  {isRunning ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Running Workflow...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Workflow
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Workflow Progress */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Workflow Progress</h2>
              <div className="space-y-3">
                {(Object.keys(stepConfig) as WorkflowStep[]).map((step, index) => {
                  const config = stepConfig[step];
                  const state = steps[step];

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 p-3 rounded-xl transition ${
                        currentStep === step
                          ? 'bg-cyan-500/10 border border-cyan-500/50'
                          : state.status === 'completed'
                          ? 'bg-green-500/10 border border-green-500/30'
                          : state.status === 'error'
                          ? 'bg-red-500/10 border border-red-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div>{getStepIcon(state.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white">{config.title}</div>
                        <div className="text-xs text-gray-400">{config.description}</div>
                      </div>
                      <div className="text-2xl">{config.icon}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Output Display */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full">
              <h2 className="text-xl font-bold text-white mb-4">
                {currentStep ? stepConfig[currentStep].title : 'Ready to Start'}
              </h2>

              <div className="h-[calc(100%-4rem)] overflow-y-auto">
                {currentStep === 'simulation' && simulationMetrics ? (
                  <div className="h-full flex flex-col">
                    {/* View Mode Toggle for Simulation */}
                    <div className="flex justify-center gap-2 mb-4 bg-white/5 p-2 rounded-xl border border-white/10">
                      <button
                        onClick={() => setSimulationViewMode('map')}
                        className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-semibold ${
                          simulationViewMode === 'map' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Map className="w-4 h-4" />
                        Interactive Map
                      </button>
                      <button
                        onClick={() => setSimulationViewMode('split')}
                        className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-semibold ${
                          simulationViewMode === 'split' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Maximize2 className="w-4 h-4" />
                        Split View
                      </button>
                      <button
                        onClick={() => setSimulationViewMode('metrics')}
                        className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-semibold ${
                          simulationViewMode === 'metrics' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        All Metrics
                      </button>
                    </div>

                    {/* Content based on view mode */}
                    {simulationViewMode === 'map' ? (
                      <div className="flex-1 rounded-xl overflow-hidden border border-white/20">
                        <ComprehensiveMapboxVisualization
                          city={city || "San Francisco, CA"}
                          parameters={simulationMetrics.parameters || {}}
                          impactZones={simulationMetrics.impact_zones || []}
                          mapboxData={simulationMetrics.mapbox_data}
                          policyGoal={policyGoal}
                          onParameterClick={(param) => console.log('Clicked param:', param)}
                        />
                      </div>
                    ) : simulationViewMode === 'metrics' ? (
                      <div className="flex-1 overflow-y-auto">
                        <SimulationMetricsDisplay
                          parameters={simulationMetrics.parameters || {}}
                          overallScore={simulationMetrics.overall_impact_score}
                          recommendation={simulationMetrics.recommendation}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="rounded-xl overflow-hidden border border-white/20">
                          <ComprehensiveMapboxVisualization
                            city={city || "San Francisco, CA"}
                            parameters={simulationMetrics.parameters || {}}
                            impactZones={simulationMetrics.impact_zones || []}
                            mapboxData={simulationMetrics.mapbox_data}
                            policyGoal={policyGoal}
                            onParameterClick={(param) => console.log('Clicked param:', param)}
                          />
                        </div>
                        <div className="overflow-y-auto">
                          <SimulationMetricsDisplay
                            parameters={simulationMetrics.parameters || {}}
                            overallScore={simulationMetrics.overall_impact_score}
                            recommendation={simulationMetrics.recommendation}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : currentStep === 'debate' && debateMessages.length > 0 ? (
                  <DebateChatInterface
                    messages={debateMessages}
                    isStreaming={steps.debate.status === 'running'}
                    onSendMessage={(msg) => console.log('Human question:', msg)}
                    onRequestClarification={(topic) => console.log('Clarification:', topic)}
                  />
                ) : currentStep === 'aggregator' && finalReport ? (
                  <div className="p-6 space-y-6">
                    <div className="prose prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-white/90 leading-relaxed">
                        {finalReport}
                      </div>
                    </div>
                    <div className="flex justify-center pt-6">
                      <ReportDownloadButton
                        content={finalReport}
                        filename={`policy_report_${Date.now()}`}
                        availableFormats={['markdown', 'html', 'txt']}
                      />
                    </div>
                  </div>
                ) : currentStep ? (
                  <div className="bg-black/40 rounded-xl p-6 font-mono text-sm text-gray-300">
                    <div className="whitespace-pre-wrap">{steps[currentStep].output || 'Starting...'}</div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <p>Configure the workflow and click "Start Workflow" to begin.</p>
                    <p className="mt-4 text-xs">
                      The system will run through all four agents in sequence,
                      streaming results in real-time with 30+ impact parameters.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

