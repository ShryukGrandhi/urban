/**
 * Enhanced Simulation View - Shows ALL 30 parameters with Mapbox visualization
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Map, Download, Maximize2 } from 'lucide-react';
import { ComprehensiveMapboxVisualization } from '../components/ComprehensiveMapboxVisualization';
import { SimulationMetricsDisplay } from '../components/SimulationMetricsDisplay';

export function EnhancedSimulationView() {
  const [viewMode, setViewMode] = useState<'map' | 'metrics' | 'split'>('split');
  const [simulationData, setSimulationData] = useState<any>(null);

  // Mock simulation data for demo (will be replaced with real data)
  const mockParameters = {
    peak_hour_congestion: { baseline: 78, projected: 62, change: -16, change_pct: -20.5, unit: '%', explanation: 'Car curfew after 11pm reduces overall daily traffic volume' },
    average_commute_time: { baseline: 42, projected: 38, change: -4, change_pct: -9.5, unit: 'min', explanation: 'Less congestion means faster commutes during peak hours' },
    vehicle_volume: { baseline: 85000, projected: 68000, change: -17000, change_pct: -20, unit: 'vehicles/day', explanation: 'Direct reduction from nighttime driving restrictions' },
    public_transit_usage: { baseline: 45000, projected: 52000, change: 7000, change_pct: 15.6, unit: 'riders/day', explanation: 'People shift to transit when driving is restricted' },
    bike_lane_usage: { baseline: 12, projected: 18, change: 6, change_pct: 50, unit: '%', explanation: 'Safer streets encourage more cycling' },
    pedestrian_traffic: { baseline: 25000, projected: 30000, change: 5000, change_pct: 20, unit: 'people/day', explanation: 'Quieter streets attract more pedestrians' },
    
    air_quality_index: { baseline: 95, projected: 78, change: -17, change_pct: -17.9, unit: 'AQI', explanation: 'Significant reduction in vehicle emissions at night' },
    co2_emissions: { baseline: 12500, projected: 10000, change: -2500, change_pct: -20, unit: 'tons/year', explanation: 'Fewer cars = less emissions' },
    noise_pollution: { baseline: 75, projected: 58, change: -17, change_pct: -22.7, unit: 'dB', explanation: 'Traffic noise dramatically reduced during nighttime hours' },
    green_space_coverage: { baseline: 18, projected: 18.5, change: 0.5, change_pct: 2.8, unit: '%', explanation: 'Slight increase from street-to-park conversions' },
    tree_canopy: { baseline: 22, projected: 23, change: 1, change_pct: 4.5, unit: '%', explanation: 'New trees planted in reclaimed parking areas' },
    water_quality: { baseline: 72, projected: 76, change: 4, change_pct: 5.6, unit: 'score', explanation: 'Less runoff from reduced road use' },
    
    local_business_revenue: { baseline: 850, projected: 795, change: -55, change_pct: -6.5, unit: '$M/year', explanation: 'Nighttime businesses see reduced customer traffic' },
    property_values: { baseline: 1250000, projected: 1287500, change: 37500, change_pct: 3, unit: '$', explanation: 'Quieter neighborhoods increase residential appeal' },
    employment_rate: { baseline: 94.5, projected: 94.8, change: 0.3, change_pct: 0.3, unit: '%', explanation: 'Minimal impact, some jobs shift to daytime' },
    retail_foot_traffic: { baseline: 100, projected: 95, change: -5, change_pct: -5, unit: '% baseline', explanation: 'Evening retail slightly impacted' },
    tax_revenue: { baseline: 125, projected: 122, change: -3, change_pct: -2.4, unit: '$M/year', explanation: 'Small decrease from business revenue impact' },
    construction_jobs: { baseline: 5200, projected: 5350, change: 150, change_pct: 2.9, unit: 'jobs', explanation: 'New transit infrastructure creates jobs' },
    
    housing_affordability: { baseline: 35, projected: 37, change: 2, change_pct: 5.7, unit: '% affordable', explanation: 'Reduced car dependency lowers living costs' },
    displacement_risk: { baseline: 8500, projected: 7800, change: -700, change_pct: -8.2, unit: 'people', explanation: 'Better quality of life reduces pressure to leave' },
    community_sentiment: { baseline: 45, projected: 62, change: 17, change_pct: 37.8, unit: 'score', explanation: 'Residents appreciate quieter, cleaner neighborhoods' },
    school_enrollment: { baseline: 52000, projected: 53500, change: 1500, change_pct: 2.9, unit: 'students', explanation: 'Families attracted to safer streets' },
    crime_rate: { baseline: 4.8, projected: 5.2, change: 0.4, change_pct: 8.3, unit: 'per 1000', explanation: 'Slight increase during enforcement adjustment period' },
    public_safety_perception: { baseline: 68, projected: 71, change: 3, change_pct: 4.4, unit: 'score', explanation: 'Less traffic = safer feeling streets' },
    
    parking_availability: { baseline: 15000, projected: 16500, change: 1500, change_pct: 10, unit: 'spaces', explanation: 'Less demand frees up parking' },
    road_maintenance_needs: { baseline: 45, projected: 38, change: -7, change_pct: -15.6, unit: '$M/year', explanation: 'Less wear and tear from reduced traffic' },
    utility_capacity: { baseline: 78, projected: 82, change: 4, change_pct: 5.1, unit: '% available', explanation: 'Reduced demand during night hours' },
    emergency_response_time: { baseline: 6.2, projected: 7.8, change: 1.6, change_pct: 25.8, unit: 'minutes', explanation: 'Ambulances may face delays navigating empty streets without traffic flow' },
    waste_management: { baseline: 2400, projected: 2300, change: -100, change_pct: -4.2, unit: 'tons/day', explanation: 'Less nighttime activity = less waste' },
    street_lighting: { baseline: 92, projected: 95, change: 3, change_pct: 3.3, unit: '% coverage', explanation: 'Upgrades needed for pedestrian safety' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-white/10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/workflow" className="flex items-center gap-3 text-white/80 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Workflow</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  viewMode === 'map' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Map className="w-4 h-4" />
                Map Only
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  viewMode === 'split' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
                Split View
              </button>
              <button
                onClick={() => setViewMode('metrics')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  viewMode === 'metrics' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Metrics Only
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-4xl font-black text-white mb-2">Policy Impact Simulation</h1>
            <p className="text-white/60 text-lg">Comprehensive analysis across 30+ parameters</p>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'map' ? (
            <div className="h-[calc(100vh-250px)] rounded-2xl overflow-hidden border border-white/20">
              <ComprehensiveMapboxVisualization
                city="San Francisco, CA"
                parameters={mockParameters}
                onParameterClick={(param) => console.log('Clicked:', param)}
              />
            </div>
          ) : viewMode === 'metrics' ? (
            <div className="h-[calc(100vh-250px)] overflow-y-auto">
              <SimulationMetricsDisplay
                parameters={mockParameters}
                overallScore={72}
                recommendation="modify"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 h-[calc(100vh-250px)]">
              <div className="rounded-2xl overflow-hidden border border-white/20">
                <ComprehensiveMapboxVisualization
                  city="San Francisco, CA"
                  parameters={mockParameters}
                  onParameterClick={(param) => console.log('Clicked:', param)}
                />
              </div>
              <div className="overflow-y-auto">
                <SimulationMetricsDisplay
                  parameters={mockParameters}
                  overallScore={72}
                  recommendation="modify"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



