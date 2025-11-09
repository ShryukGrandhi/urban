/**
 * Analytics Panel - Shows real-time simulation analytics
 * Connected to unified context
 */

import { TrendingUp, TrendingDown, Users, DollarSign, Activity } from 'lucide-react';

interface AnalyticsPanelProps {
  simulationResults: any;
  visible: boolean;
}

export function AnalyticsPanel({ simulationResults, visible }: AnalyticsPanelProps) {
  if (!visible || !simulationResults?.parameters) return null;

  const params = simulationResults.parameters;

  // Extract key metrics
  const metrics = [
    {
      label: 'Traffic Congestion',
      param: params.peak_hour_congestion,
      icon: Activity,
      color: params.peak_hour_congestion?.change < 0 ? 'green' : 'red',
    },
    {
      label: 'Air Quality',
      param: params.air_quality_index,
      icon: TrendingUp,
      color: params.air_quality_index?.change < 0 ? 'green' : 'red',
    },
    {
      label: 'Local Business Revenue',
      param: params.local_business_revenue,
      icon: DollarSign,
      color: params.local_business_revenue?.change > 0 ? 'green' : 'red',
    },
    {
      label: 'Affected Population',
      param: params.displacement_risk,
      icon: Users,
      color: params.displacement_risk?.change > 0 ? 'red' : 'green',
    },
  ];

  return (
    <div className="fixed top-24 right-6 z-40 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 w-80 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        📊 Live Analytics
      </h3>

      <div className="space-y-3">
        {metrics.map((metric, i) => {
          if (!metric.param) return null;
          const Icon = metric.icon;
          const isPositive = metric.param.change < 0 ? metric.color === 'green' : metric.param.change > 0 && metric.color === 'green';
          
          return (
            <div key={i} className={`p-3 rounded-lg border ${
              isPositive ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-sm font-semibold text-white">{metric.label}</span>
                </div>
                <div className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.param.change > 0 ? '+' : ''}{metric.param.change_pct?.toFixed(1)}%
                </div>
              </div>
              <div className="text-xs text-gray-400">
                <div>Before: {metric.param.baseline} {metric.param.unit}</div>
                <div>After: {metric.param.projected} {metric.param.unit}</div>
              </div>
              {metric.param.explanation && (
                <div className="mt-2 text-xs text-gray-300 italic">
                  {metric.param.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {simulationResults.mapbox_data && (
        <div className="mt-4 pt-4 border-t border-cyan-500/30">
          <h4 className="text-sm font-semibold text-cyan-400 mb-2">Map Overlays</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <div>🚫 {simulationResults.mapbox_data.blocked_roads?.length || 0} Blocked Roads</div>
            <div>⚠️ {simulationResults.mapbox_data.impact_zones?.length || 0} Impact Zones</div>
            <div>🔥 {simulationResults.mapbox_data.traffic_heatmap?.length || 0} Heatmap Points</div>
            <div>🛣️ {simulationResults.mapbox_data.alternate_routes?.length || 0} Alternate Routes</div>
          </div>
        </div>
      )}
    </div>
  );
}

