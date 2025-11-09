/**
 * Comprehensive Mapbox Visualization with ALL 30 Parameters
 * Shows icons, overlays, graphs, and detailed analytics
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// AnimatedTrafficLayer disabled for performance
// import './AnimatedTrafficLayer.css';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useDynamicPolicyOverlays } from './DynamicPolicyOverlays';
// import { useAnimatedTrafficLayer } from './AnimatedTrafficLayer';

interface Parameter {
  baseline: number;
  projected: number;
  change: number;
  change_pct: number;
  unit: string;
  explanation: string;
}

interface MapVisualizationProps {
  city: string;
  parameters: Record<string, Parameter>;
  impactZones?: any[];
  mapboxData?: any;
  policyGoal?: string;
  onParameterClick?: (param: string) => void;
}

export function ComprehensiveMapboxVisualization({
  city,
  parameters,
  impactZones = [],
  mapboxData,
  policyGoal = '',
  onParameterClick,
}: MapVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedParam, setSelectedParam] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showCars, setShowCars] = useState(false); // Disabled for performance
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Use dynamic overlays based on actual simulation data
  useDynamicPolicyOverlays({
    map: map.current,
    mapboxData: mapboxData || { impact_zones: impactZones },
    parameters,
    policyType: policyGoal,
  });

  // Animated traffic disabled for performance
  // const { carCount } = useAnimatedTrafficLayer({
  //   map: map.current,
  //   trafficData: mapboxData,
  //   showCars: showCars && mapLoaded,
  //   congestionLevel: parameters?.peak_hour_congestion 
  //     ? (parameters.peak_hour_congestion.projected / 100) 
  //     : 0.5
  // });

  const categories = {
    traffic: { color: '#f97316', icon: '🚗', params: ['peak_hour_congestion', 'average_commute_time', 'vehicle_volume', 'public_transit_usage', 'bike_lane_usage', 'pedestrian_traffic'] },
    environment: { color: '#10b981', icon: '🌱', params: ['air_quality_index', 'co2_emissions', 'noise_pollution', 'green_space_coverage', 'tree_canopy', 'water_quality'] },
    economy: { color: '#3b82f6', icon: '💰', params: ['local_business_revenue', 'property_values', 'employment_rate', 'retail_foot_traffic', 'tax_revenue', 'construction_jobs'] },
    social: { color: '#a855f7', icon: '👥', params: ['housing_affordability', 'displacement_risk', 'community_sentiment', 'school_enrollment', 'crime_rate', 'public_safety_perception'] },
    infrastructure: { color: '#64748b', icon: '🏗️', params: ['parking_availability', 'road_maintenance_needs', 'utility_capacity', 'emergency_response_time', 'waste_management', 'street_lighting'] },
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-122.4194, 37.7749], // Default SF
      zoom: 12,
      pitch: 0, // Start flat for better traffic visibility
      bearing: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setMapLoaded(true);

      // Add 3D buildings
      if (map.current) {
        const layers = map.current.getStyle().layers;
        const labelLayerId = layers?.find(
          (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
        )?.id;

        map.current.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#444',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.7,
            },
          },
          labelLayerId
        );
      }
    });

    return () => {
      markers.current.forEach(m => m.remove());
      map.current?.remove();
    };
  }, []);

  // Add parameter visualizations
  useEffect(() => {
    if (!map.current || !mapLoaded || !parameters) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Create markers for each parameter category around the city
    const baseCoords = [-122.4194, 37.7749];
    const radius = 0.05;
    
    Object.entries(categories).forEach(([category, config], catIndex) => {
      const categoryParams = config.params
        .map(p => ({ key: p, data: parameters[p] }))
        .filter(p => p.data);

      if (categoryParams.length === 0) return;

      // Position markers in a circle around the center
      const angle = (catIndex / Object.keys(categories).length) * 2 * Math.PI;
      const lng = baseCoords[0] + radius * Math.cos(angle);
      const lat = baseCoords[1] + radius * Math.sin(angle);

      // Create marker element
      const el = document.createElement('div');
      el.className = 'parameter-marker';
      el.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${config.color};
        border: 3px solid white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        transition: all 0.3s;
      `;
      el.innerHTML = config.icon;
      el.style.animation = 'pulse 2s infinite';

      // Click handler
      el.onclick = () => {
        setSelectedCategory(category);
        setSelectedParam(config.params[0]);
      };

      // Hover popup
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(createCategoryPopupHTML(category, categoryParams, config));

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        popup.setLngLat([lng, lat]).addTo(map.current!);
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        popup.remove();
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markers.current.push(marker);
    });

  }, [parameters, mapLoaded]);

  const createCategoryPopupHTML = (category: string, params: any[], config: any) => {
    const avgChange = params.reduce((sum, p) => sum + p.data.change_pct, 0) / params.length;
    const isPositive = avgChange > 0;

    return `
      <div style="padding: 16px; min-width: 300px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="font-size: 32px;">${config.icon}</div>
          <div>
            <div style="font-weight: bold; font-size: 18px; color: #1f2937; text-transform: capitalize;">
              ${category} Impact
            </div>
            <div style="font-size: 14px; color: ${isPositive ? '#10b981' : '#ef4444'}; font-weight: 600;">
              ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)}% Average Change
            </div>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; max-height: 200px; overflow-y: auto;">
          ${params.map(p => `
            <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                ${formatParamName(p.key)}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: ${p.data.change > 0 ? '#10b981' : '#ef4444'};">
                  ${p.data.change > 0 ? '+' : ''}${p.data.change_pct.toFixed(1)}%
                </span>
                <span style="font-size: 11px; color: #9ca3af;">
                  ${p.data.baseline} → ${p.data.projected} ${p.data.unit}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <span style="font-size: 11px; color: #9ca3af;">Click marker for detailed view</span>
        </div>
      </div>
    `;
  };

  const formatParamName = (param: string) => {
    return param.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get overall statistics
  const getOverallStats = () => {
    if (!parameters || Object.keys(parameters).length === 0) return null;

    const values = Object.values(parameters);
    const positive = values.filter(p => p.change > 0).length;
    const negative = values.filter(p => p.change < 0).length;
    const avgChange = values.reduce((sum, p) => sum + p.change_pct, 0) / values.length;

    return { positive, negative, avgChange, total: values.length };
  };

  const stats = getOverallStats();

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Category Filter Pills */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-md">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full font-bold text-sm transition shadow-lg ${
            selectedCategory === 'all'
              ? 'bg-white text-black'
              : 'bg-black/80 text-white border border-white/30 hover:bg-white/20'
          }`}
        >
          All Categories
        </button>
        {Object.entries(categories).map(([cat, config]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition shadow-lg ${
              selectedCategory === cat
                ? 'bg-white text-black'
                : 'bg-black/80 text-white border border-white/30 hover:bg-white/20'
            }`}
          >
            {config.icon} {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Overall Stats Dashboard */}
      {stats && (
        <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-md rounded-2xl p-4 text-white border border-white/20 shadow-2xl min-w-[280px]">
          <h4 className="font-bold mb-3 text-lg">📊 Impact Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-green-500/20 rounded-lg border border-green-500/30">
              <span className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Positive Impacts
              </span>
              <span className="font-bold text-green-400">{stats.positive}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <span className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Negative Impacts
              </span>
              <span className="font-bold text-red-400">{stats.negative}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <span className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                Total Parameters
              </span>
              <span className="font-bold text-blue-400">{stats.total}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-white/20">
              <div className="text-xs text-white/60 mb-1">Average Change</div>
              <div className={`text-2xl font-black ${stats.avgChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.avgChange > 0 ? '+' : ''}{stats.avgChange.toFixed(1)}%
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="w-full mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-sm transition"
          >
            {showHeatmap ? 'Hide' : 'Show'} Impact Heatmap
          </button>
          
          <button
            onClick={() => {
              setShowTraffic(!showTraffic);
              if (map.current) {
                map.current.setLayoutProperty('traffic', 'visibility', showTraffic ? 'none' : 'visible');
              }
            }}
            className="w-full mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm transition"
          >
            {showTraffic ? 'Hide' : 'Show'} Real-Time Traffic Layer
          </button>
          
          {/* Animated cars removed for performance */}
          
          <div className="mt-3 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <div className="text-xs text-blue-300 font-semibold mb-2">🚗 Traffic Controls:</div>
            <div className="text-xs text-white/70 space-y-1">
              <div>🔴 Red roads = Heavy traffic</div>
              <div>🟡 Yellow = Moderate traffic</div>
              <div>🟢 Green = Light traffic</div>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Detail Panel */}
      {selectedParam && parameters[selectedParam] && (
        <div className="absolute bottom-4 left-4 bg-black/95 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl max-w-md">
          <button
            onClick={() => setSelectedParam(null)}
            className="absolute top-2 right-2 text-white/60 hover:text-white text-xl"
          >
            ×
          </button>
          
          <h4 className="text-white font-bold text-lg mb-4">
            {formatParamName(selectedParam)}
          </h4>
          
          <div className="space-y-4">
            {/* Change Visualization */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Before</span>
                <span className="text-white font-mono text-lg">
                  {parameters[selectedParam].baseline} {parameters[selectedParam].unit}
                </span>
              </div>
              <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full ${
                    parameters[selectedParam].change > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(Math.abs(parameters[selectedParam].change_pct), 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/60 text-sm">After</span>
                <span className={`font-mono text-lg font-bold ${
                  parameters[selectedParam].change > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parameters[selectedParam].projected} {parameters[selectedParam].unit}
                </span>
              </div>
            </div>

            {/* Change Percentage */}
            <div className={`p-4 rounded-xl border-2 ${
              parameters[selectedParam].change > 0 
                ? 'bg-green-500/20 border-green-500/50' 
                : 'bg-red-500/20 border-red-500/50'
            }`}>
              <div className="flex items-center gap-2 justify-center">
                {parameters[selectedParam].change > 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
                <span className={`text-3xl font-black ${
                  parameters[selectedParam].change > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parameters[selectedParam].change > 0 ? '+' : ''}{parameters[selectedParam].change_pct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-300 text-sm font-semibold mb-2">Why This Changed:</div>
              <div className="text-white/90 text-sm leading-relaxed">
                {parameters[selectedParam].explanation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Charts for Top Impacts */}
      <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl max-w-sm">
        <h4 className="text-white font-bold mb-3 text-sm">🎯 Biggest Changes</h4>
        <div className="space-y-2">
          {Object.entries(parameters || {})
            .sort((a, b) => Math.abs(b[1].change_pct) - Math.abs(a[1].change_pct))
            .slice(0, 5)
            .map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedParam(key)}
                className="w-full text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-xs group-hover:text-white truncate flex-1">
                    {formatParamName(key)}
                  </span>
                  <span className={`text-sm font-bold ml-2 ${
                    data.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.change > 0 ? '+' : ''}{data.change_pct.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full ${
                      data.change > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.abs(data.change_pct), 100)}%` }}
                  ></div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Location Label */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-purple-600 px-6 py-3 rounded-xl text-white font-bold shadow-lg">
        📍 {city}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
        }
      `}</style>
    </div>
  );
}

