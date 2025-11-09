import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Upload, MapPin } from 'lucide-react';
import { DynamicSimulationMap } from '../components/DynamicSimulationMap';
import { ChatWithMap } from '../components/ChatWithMap';
import { useWebSocket } from '../hooks/useWebSocket';
import { simulationsService, policyDocsService } from '../services/storage';

export function SimulationsPage() {
  const [city, setCity] = useState('San Francisco, CA');
  const [runningSimulation, setRunningSimulation] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [chatMapCommands, setChatMapCommands] = useState<any[]>([]);
  const [uploadedPolicyDoc, setUploadedPolicyDoc] = useState<File | null>(null);

  const { messages } = useWebSocket();

  // Listen to WebSocket messages and update simulation results
  useEffect(() => {
    if (!runningSimulation) return;

    const simMessages = messages.filter(
      (m) => m.channel === `simulation:${runningSimulation}`
    );

    if (simMessages.length > 0) {
      const latestMessage = simMessages[simMessages.length - 1];
      
      if (latestMessage.data.results) {
        setSimulationResults(latestMessage.data.results);
      }
      
      if (latestMessage.data.type === 'completed' || latestMessage.data.status === 'completed') {
        if (latestMessage.data.results) {
          setSimulationResults({
            ...latestMessage.data.results,
            metrics: latestMessage.data.metrics || latestMessage.data.results.metrics
          });
        }
        
        setTimeout(() => {
          setRunningSimulation(null);
          alert('✅ Simulation completed! Check the map for visual changes!');
        }, 2000);
      }
    }
  }, [messages, runningSimulation]);

  const handleMapCommand = (command: any) => {
    console.log('🗺️ Map command received:', command);
    
    const instantUpdate: any = {
      metrics: {
        changes: {}
      }
    };

    switch (command.type) {
      case 'add-housing':
        instantUpdate.metrics.changes.housingAffordability = {
          percentage: command.impact || 15,
          description: `Adding ${command.units} units in ${command.location}`
        };
        instantUpdate.chatCommand = command;
        break;
      
      case 'highlight-roads':
        instantUpdate.metrics.changes.trafficFlow = {
          percentage: 10,
          description: `Analyzing ${command.target}`
        };
        instantUpdate.chatCommand = command;
        break;
      
      case 'highlight-area':
        instantUpdate.metrics.changes.focus = {
          percentage: 100,
          description: `Highlighting ${command.location}`
        };
        instantUpdate.chatCommand = command;
        break;
      
      case 'show-heatmap':
        if (simulationResults) {
          setSimulationResults({...simulationResults});
        }
        return;
      
      default:
        instantUpdate.chatCommand = command;
    }

    setSimulationResults(instantUpdate);
    setChatMapCommands(prev => [...prev, command]);
  };

  const startSimulation = async () => {
    if (!uploadedPolicyDoc) {
      alert('⚠️ Please upload a policy document first!');
      return;
    }
    
    try {
      // Create simulation record
      const simulation = await simulationsService.create({
        city,
        policyDoc: {
          filename: uploadedPolicyDoc.name,
          uploadedAt: new Date().toISOString()
        },
        parameters: {
          timeHorizon: 10,
          analysisDepth: 'detailed',
          focusAreas: []
        }
      });
      
      setRunningSimulation(simulation.id);
      setSimulationResults(null);
      
      // TODO: When backend is ready, this will trigger actual simulation
      // For now, we'll simulate it with WebSocket messages
      alert('✅ Simulation started! Watch the map for live updates!');
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Failed to start simulation');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        // Upload policy document
        await policyDocsService.upload(file);
        setUploadedPolicyDoc(file);
        alert(`✅ Policy document uploaded: ${file.name}`);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file');
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-2xl"></div>
          <div className="relative px-8 py-6 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 text-white/80 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Enter city..."
                />
              </div>

              <label className="group relative cursor-pointer">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-xl opacity-40 group-hover:opacity-70 blur transition"></div>
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-6 py-3 hover:bg-white/20 transition flex items-center gap-3">
                  <Upload className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold">
                    {uploadedPolicyDoc ? uploadedPolicyDoc.name : 'Upload Policy'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </label>

              <button
                onClick={startSimulation}
                disabled={!uploadedPolicyDoc || !!runningSimulation}
                className="group relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl opacity-75 group-hover:opacity-100 blur transition"></div>
                <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 rounded-xl font-bold text-lg text-white flex items-center gap-3">
                  <Play className="w-5 h-5" />
                  {runningSimulation ? 'Running...' : 'Run Simulation'}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Map */}
      <div className="absolute inset-0">
        <DynamicSimulationMap
          city={city}
          simulationData={simulationResults}
          messages={messages}
          simulationId={runningSimulation}
        />
      </div>

      {/* Live Simulation Feed - RIGHT SIDE */}
      {runningSimulation && (
        <div className="absolute top-24 right-8 z-20 w-96">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-cyan-600 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
            <div className="relative bg-black/90 backdrop-blur-3xl border border-white/30 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-500"></div>
                <h3 className="text-white font-bold text-xl">🔬 SIMULATION RUNNING</h3>
              </div>
              
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-200 text-sm font-semibold">
                  💡 Watch the map change in real-time as impacts are calculated!
                </p>
              </div>
              
              {/* Live Messages */}
              <div className="space-y-2 max-h-64 overflow-auto font-mono text-sm">
                {messages
                  .filter((m) => m.channel === `simulation:${runningSimulation}`)
                  .slice(-15)
                  .map((msg, i) => (
                    <div key={i} className="text-green-300 flex items-start gap-2 animate-in fade-in slide-in-from-right duration-300">
                      <span className="text-green-400 mt-1">▶</span>
                      <span>{msg.data.message || msg.data.token || 'Processing...'}</span>
                    </div>
                  ))}
              </div>

              {/* Results Preview */}
              {simulationResults && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    📊 Live Impact on Map
                  </h4>
                  <div className="space-y-3">
                    {simulationResults.metrics && Object.entries(simulationResults.metrics.changes || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-sm capitalize flex items-center gap-2">
                            {key === 'housingAffordability' && '🏠'}
                            {key === 'trafficFlow' && '🚗'}
                            {key === 'airQuality' && '🌱'}
                            {key === 'publicTransitUsage' && '🚇'}
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className={`font-bold text-lg ${value.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {value.percentage > 0 ? '+' : ''}{value.percentage?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative h-2 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              value.percentage > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
                            }`}
                            style={{ 
                              width: `${Math.min(Math.abs(value.percentage), 100)}%`,
                              boxShadow: value.percentage > 0 ? '0 0 10px rgba(34, 197, 94, 0.5)' : '0 0 10px rgba(239, 68, 68, 0.5)'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat with Map - Always Available */}
      <ChatWithMap
        onMapCommand={handleMapCommand}
        simulationRunning={!!runningSimulation}
      />
    </div>
  );
}

