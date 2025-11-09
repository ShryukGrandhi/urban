import React, { useState } from 'react';
import { InteractiveMapboxSimulator } from '../components/InteractiveMapboxSimulator';
import { Play, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function InteractiveMapDemo() {
  const navigate = useNavigate();
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [blockedRoadsCount, setBlockedRoadsCount] = useState(0);

  const handleRoadBlocked = (road: any) => {
    setBlockedRoadsCount(prev => prev + 1);
    console.log('Road blocked:', road);
  };

  const handleSimulationUpdate = (data: any) => {
    setSimulationResults(data);
    console.log('Simulation updated:', data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="relative z-10 bg-black/50 backdrop-blur-xl border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-cyan-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Play className="w-6 h-6 text-cyan-400" />
                  Interactive Map Simulator
                </h1>
                <p className="text-gray-400 text-sm">Click roads to block them and see real-time impacts</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-cyan-900/30 border border-cyan-500/30 rounded-lg">
                <div className="text-cyan-400 text-sm font-semibold">
                  Roads Blocked: {blockedRoadsCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        <InteractiveMapboxSimulator
          city="San Francisco, CA"
          onRoadBlocked={handleRoadBlocked}
          onSimulationUpdate={handleSimulationUpdate}
        />

        {/* Simulation Results Panel (bottom right) */}
        {simulationResults && (
          <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 w-96">
            <h3 className="text-lg font-bold text-white mb-3">📊 Simulation Results</h3>
            
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="font-semibold text-red-400 mb-1">Blocked Road</div>
                <div className="text-gray-300">{simulationResults.blockedRoad.name}</div>
              </div>

              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="font-semibold text-purple-400 mb-2">Impact Analysis</div>
                <div className="text-gray-300 space-y-1 text-xs">
                  <div>⏱️ Delay: {simulationResults.summary.totalDelay}</div>
                  <div>📍 Affected Area: {simulationResults.summary.affectedArea}</div>
                  <div>🛣️ Alternate Routes: {simulationResults.summary.alternativeRoutesAvailable}</div>
                  <div>📈 Traffic Increase: +{simulationResults.summary.trafficIncreasePercentage}%</div>
                </div>
              </div>

              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="font-semibold text-green-400 mb-2">Recommendations</div>
                <div className="text-gray-300 text-xs space-y-1">
                  <div>✓ Use Valencia St as primary alternate</div>
                  <div>✓ Expect 15-20 min delays during peak hours</div>
                  <div>✓ Consider rerouting public transit</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


