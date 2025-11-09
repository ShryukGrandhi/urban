/**
 * Simulation Metrics Display - Shows all 30+ parameters with visual indicators
 */

import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface Parameter {
  baseline: number;
  projected: number;
  change: number;
  change_pct: number;
  unit: string;
  explanation: string;
}

interface SimulationMetricsDisplayProps {
  parameters: Record<string, Parameter>;
  overallScore?: number;
  recommendation?: 'proceed' | 'modify' | 'reconsider';
}

export function SimulationMetricsDisplay({
  parameters,
  overallScore,
  recommendation,
}: SimulationMetricsDisplayProps) {
  const categories = {
    Traffic: ['peak_hour_congestion', 'average_commute_time', 'vehicle_volume', 'public_transit_usage', 'bike_lane_usage', 'pedestrian_traffic'],
    Environment: ['air_quality_index', 'co2_emissions', 'noise_pollution', 'green_space_coverage', 'tree_canopy', 'water_quality'],
    Economy: ['local_business_revenue', 'property_values', 'employment_rate', 'retail_foot_traffic', 'tax_revenue', 'construction_jobs'],
    Social: ['housing_affordability', 'displacement_risk', 'community_sentiment', 'school_enrollment', 'crime_rate', 'public_safety_perception'],
    Infrastructure: ['parking_availability', 'road_maintenance_needs', 'utility_capacity', 'emergency_response_time', 'waste_management', 'street_lighting'],
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatParamName = (param: string) => {
    return param.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      {overallScore !== undefined && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-2xl">Overall Impact Score</h3>
              <p className="text-white/60 text-sm">Comprehensive policy effectiveness rating</p>
            </div>
            <div className="text-6xl font-black text-white">
              {overallScore}
              <span className="text-2xl text-white/40">/100</span>
            </div>
          </div>
          {recommendation && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              recommendation === 'proceed'
                ? 'bg-green-500/20 border border-green-500/30'
                : recommendation === 'modify'
                ? 'bg-yellow-500/20 border border-yellow-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              {recommendation === 'proceed' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              )}
              <span className={`font-bold ${
                recommendation === 'proceed'
                  ? 'text-green-300'
                  : recommendation === 'modify'
                  ? 'text-yellow-300'
                  : 'text-red-300'
              }`}>
                Recommendation: {recommendation.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Parameters by Category */}
      {Object.entries(categories).map(([category, paramKeys]) => {
        const categoryParams = paramKeys
          .map(key => ({ key, data: parameters[key] }))
          .filter(p => p.data);

        if (categoryParams.length === 0) return null;

        return (
          <div key={category} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                category === 'Traffic' ? 'bg-orange-500' :
                category === 'Environment' ? 'bg-green-500' :
                category === 'Economy' ? 'bg-blue-500' :
                category === 'Social' ? 'bg-purple-500' :
                'bg-gray-500'
              }`}></div>
              {category} Impacts ({categoryParams.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryParams.map(({ key, data }) => (
                <div
                  key={key}
                  className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-white/20 transition group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-white/80 font-semibold text-sm mb-1">
                        {formatParamName(key)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(data.change)}
                        <span className={`text-2xl font-bold ${getChangeColor(data.change)}`}>
                          {data.change > 0 ? '+' : ''}{data.change_pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/40 text-xs">Before</div>
                      <div className="text-white text-sm font-mono">{data.baseline} {data.unit}</div>
                      <div className="text-white/40 text-xs mt-1">After</div>
                      <div className={`text-sm font-mono font-bold ${getChangeColor(data.change)}`}>
                        {data.projected} {data.unit}
                      </div>
                    </div>
                  </div>
                  <div className="text-white/60 text-xs leading-relaxed mt-2 pt-2 border-t border-white/10">
                    {data.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}



