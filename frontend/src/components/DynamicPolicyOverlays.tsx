/**
 * Dynamic Policy Overlays for Mapbox
 * Creates custom overlays, heatmaps, and visual effects based on simulation analysis
 * Changes dynamically based on what the policy actually does
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface DynamicOverlaysProps {
  map: mapboxgl.Map | null;
  mapboxData: any;
  parameters: Record<string, any>;
  policyType: string;
}

export function useDynamicPolicyOverlays({
  map,
  mapboxData,
  parameters,
  policyType,
}: DynamicOverlaysProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const layersRef = useRef<string[]>([]);

  useEffect(() => {
    if (!map || !mapboxData) return;

    // Clear existing overlays
    cleanup();

    // Determine what type of visualization to create based on the policy and data
    const overlayType = determineOverlayType(policyType, parameters);

    // Create appropriate overlays
    switch (overlayType) {
      case 'traffic_reduction':
        createTrafficReductionOverlay();
        break;
      case 'environmental_improvement':
        createEnvironmentalOverlay();
        break;
      case 'housing_development':
        createHousingOverlay();
        break;
      case 'economic_impact':
        createEconomicOverlay();
        break;
      default:
        createComprehensiveOverlay();
    }

    return () => cleanup();
  }, [map, mapboxData, parameters]);

  const cleanup = () => {
    // Remove markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Remove layers
    if (map) {
      layersRef.current.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(layerId)) {
          map.removeSource(layerId);
        }
      });
    }
    layersRef.current = [];
  };

  const determineOverlayType = (policy: string, params: Record<string, any>) => {
    const policyLower = policy?.toLowerCase() || '';
    
    // Analyze which parameters changed most
    const changes = Object.entries(params).map(([key, val]: [string, any]) => ({
      key,
      changePct: Math.abs(val?.change_pct || 0),
      category: key.split('_')[0]
    })).sort((a, b) => b.changePct - a.changePct);

    const topCategory = changes[0]?.key || '';

    if (policyLower.includes('traffic') || policyLower.includes('car') || policyLower.includes('curfew') || topCategory.includes('traffic')) {
      return 'traffic_reduction';
    } else if (policyLower.includes('emission') || policyLower.includes('green') || policyLower.includes('environment') || topCategory.includes('air')) {
      return 'environmental_improvement';
    } else if (policyLower.includes('housing') || policyLower.includes('affordable') || topCategory.includes('housing')) {
      return 'housing_development';
    } else if (policyLower.includes('business') || policyLower.includes('economic') || topCategory.includes('revenue')) {
      return 'economic_impact';
    }
    
    return 'comprehensive';
  };

  const createTrafficReductionOverlay = () => {
    if (!map || !mapboxData) return;

    // Create animated traffic flow lines
    const trafficReduction = parameters?.peak_hour_congestion?.change_pct || 0;
    
    // Add pulsing markers on major intersections
    mapboxData.impact_zones?.forEach((zone: any, index: number) => {
      if (zone.type === 'road' || zone.coordinates) {
        const color = trafficReduction < 0 ? '#10b981' : '#ef4444'; // Green if reduced, red if increased
        
        // Create animated marker
        const el = document.createElement('div');
        el.className = 'traffic-marker';
        el.innerHTML = '🚗';
        el.style.cssText = `
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-center;
          font-size: 24px;
          box-shadow: 0 0 20px ${color};
          animation: traffic-pulse 2s infinite;
          cursor: pointer;
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat(zone.coordinates)
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 12px;">
              <h4 style="font-weight: bold; margin-bottom: 8px;">${zone.location}</h4>
              <div style="color: ${color}; font-size: 18px; font-weight: bold; margin: 8px 0;">
                ${trafficReduction > 0 ? '+' : ''}${trafficReduction.toFixed(1)}% Traffic Change
              </div>
              <p style="font-size: 12px; color: #666;">${zone.hover_explanation || zone.description}</p>
            </div>
          `))
          .addTo(map);

        markersRef.current.push(marker);
      }
    });

    // Add traffic heatmap layer if data exists
    if (mapboxData.heatmap_data && mapboxData.heatmap_data.length > 0) {
      const heatmapId = 'traffic-heatmap';
      map.addSource(heatmapId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: mapboxData.heatmap_data.map((point: any) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [point.lng, point.lat]
            },
            properties: {
              intensity: point.intensity
            }
          }))
        }
      });

      map.addLayer({
        id: heatmapId,
        type: 'heatmap',
        source: heatmapId,
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgb(16, 185, 129)',
            0.4, 'rgb(251, 191, 36)',
            0.6, 'rgb(251, 146, 60)',
            0.8, 'rgb(239, 68, 68)',
            1, 'rgb(127, 29, 29)'
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.7
        }
      });

      layersRef.current.push(heatmapId);
    }

    // Add CSS animation
    if (!document.getElementById('traffic-animations')) {
      const style = document.createElement('style');
      style.id = 'traffic-animations';
      style.textContent = `
        @keyframes traffic-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px currentColor; }
          50% { transform: scale(1.2); box-shadow: 0 0 40px currentColor; }
        }
      `;
      document.head.appendChild(style);
    }
  };

  const createEnvironmentalOverlay = () => {
    if (!map || !mapboxData) return;

    const airQualityChange = parameters?.air_quality_index?.change_pct || 0;
    const isImprovement = airQualityChange < 0; // Lower AQI is better

    // Create color-coded zones based on air quality improvement
    mapboxData.impact_zones?.forEach((zone: any) => {
      if (zone.coordinates) {
        const el = document.createElement('div');
        el.innerHTML = isImprovement ? '🌱' : '⚠️';
        el.style.cssText = `
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${isImprovement ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)'};
          border: 4px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          animation: env-glow 3s ease-in-out infinite;
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 16px; min-width: 250px;">
            <h4 style="font-weight: bold; font-size: 16px; margin-bottom: 12px; color: ${isImprovement ? '#10b981' : '#f59e0b'};">
              ${zone.location}
            </h4>
            <div style="background: #f3f4f6; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Air Quality Change</div>
              <div style="font-size: 24px; font-weight: bold; color: ${isImprovement ? '#10b981' : '#ef4444'};">
                ${airQualityChange > 0 ? '+' : ''}${airQualityChange.toFixed(1)}%
              </div>
            </div>
            <div style="font-size: 13px; color: #374151; line-height: 1.5;">
              ${zone.hover_explanation || zone.description}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(zone.coordinates)
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      }
    });

    // Add animated glow
    if (!document.getElementById('env-animations')) {
      const style = document.createElement('style');
      style.id = 'env-animations';
      style.textContent = `
        @keyframes env-glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.6)); }
          50% { filter: drop-shadow(0 0 25px rgba(16, 185, 129, 0.9)); }
        }
      `;
      document.head.appendChild(style);
    }
  };

  const createHousingOverlay = () => {
    if (!map || !mapboxData) return;

    const affordabilityChange = parameters?.housing_affordability?.change_pct || 0;

    mapboxData.impact_zones?.forEach((zone: any) => {
      if (zone.type === 'building' || zone.coordinates) {
        const el = document.createElement('div');
        el.innerHTML = zone.change_type === 'new' ? '🏗️' : '🏢';
        el.style.cssText = `
          width: 55px;
          height: 55px;
          border-radius: 12px;
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
          animation: building-bounce 2s ease-in-out infinite;
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat(zone.coordinates)
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 14px;">
              <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">${zone.location}</div>
              <div style="display: flex; gap: 12px; margin-bottom: 10px;">
                <div style="flex: 1; background: #f3f4f6; padding: 8px; border-radius: 6px;">
                  <div style="font-size: 10px; color: #6b7280;">Before</div>
                  <div style="font-size: 16px; font-weight: bold;">${zone.before_metrics?.units || 'N/A'}</div>
                </div>
                <div style="flex: 1; background: #f3f4f6; padding: 8px; border-radius: 6px;">
                  <div style="font-size: 10px; color: #6b7280;">After</div>
                  <div style="font-size: 16px; font-weight: bold; color: #8b5cf6;">${zone.after_metrics?.units || 'N/A'}</div>
                </div>
              </div>
              <p style="font-size: 12px; color: #4b5563;">${zone.hover_explanation}</p>
            </div>
          `))
          .addTo(map);

        markersRef.current.push(marker);
      }
    });

    if (!document.getElementById('building-animations')) {
      const style = document.createElement('style');
      style.id = 'building-animations';
      style.textContent = `
        @keyframes building-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `;
      document.head.appendChild(style);
    }
  };

  const createEconomicOverlay = () => {
    if (!map || !mapboxData) return;

    const revenueChange = parameters?.local_business_revenue?.change_pct || 0;

    mapboxData.impact_zones?.forEach((zone: any) => {
      if (zone.coordinates) {
        const isPositive = revenueChange > 0;
        const el = document.createElement('div');
        el.innerHTML = isPositive ? '💰' : '📉';
        el.style.cssText = `
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: ${isPositive ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'linear-gradient(135deg, #ef4444, #f87171)'};
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
          animation: economic-pulse 2.5s ease-in-out infinite;
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat(zone.coordinates)
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 14px; min-width: 260px;">
              <h4 style="font-weight: bold; margin-bottom: 10px;">${zone.location}</h4>
              <div style="background: ${isPositive ? '#dbeafe' : '#fee2e2'}; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Economic Impact</div>
                <div style="font-size: 22px; font-weight: bold; color: ${isPositive ? '#3b82f6' : '#ef4444'};">
                  ${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%
                </div>
              </div>
              <p style="font-size: 13px; color: #4b5563; line-height: 1.4;">${zone.hover_explanation}</p>
            </div>
          `))
          .addTo(map);

        markersRef.current.push(marker);
      }
    });

    if (!document.getElementById('economic-animations')) {
      const style = document.createElement('style');
      style.id = 'economic-animations';
      style.textContent = `
        @keyframes economic-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }
  };

  const createComprehensiveOverlay = () => {
    if (!map || !mapboxData) return;

    // Create different marker types for different impact levels
    mapboxData.impact_zones?.forEach((zone: any, index: number) => {
      if (!zone.coordinates) return;

      const getMarkerStyle = (zone: any) => {
        // Use custom icon and color if provided
        const customIcon = zone.icon || getIconForType(zone.change_type || zone.type);
        const customColor = zone.color || getColorForImpact(zone.impact_level);
        
        return { 
          bg: customColor, 
          icon: customIcon 
        };
      };

      const getIconForType = (type: string) => {
        const icons: Record<string, string> = {
          'traffic_reduced': '🚗↓',
          'traffic_increased': '🚗↑',
          'transit_improved': '🚌',
          'air_quality_improved': '🌱',
          'building_new': '🏗️',
          'building_removed': '🏚️',
          'economic_growth': '💰',
          'economic_decline': '📉',
          'safety_improved': '🛡️',
          'park_added': '🌳',
          'road': '🚦',
          'intersection': '⚡',
          'neighborhood': '🏘️',
          'new': '✨',
          'removed': '❌',
          'modified': '📍',
        };
        return icons[type] || '📍';
      };

      const getColorForImpact = (level: string) => {
        const colors: Record<string, string> = {
          'high': '#ef4444',
          'medium': '#f59e0b',
          'low': '#3b82f6',
          'positive': '#10b981',
          'negative': '#ef4444',
          'neutral': '#64748b',
        };
        return colors[level] || '#f59e0b';
      };

      const style = getMarkerStyle(zone);

      const el = document.createElement('div');
      el.innerHTML = style.icon;
      el.style.cssText = `
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: ${style.bg};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat(zone.coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 12px; max-width: 300px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${zone.location}</div>
            <div style="display: inline-block; padding: 4px 8px; background: ${style.bg}20; border: 1px solid ${style.bg}; border-radius: 6px; font-size: 11px; margin-bottom: 8px; text-transform: uppercase;">
              ${zone.impact_level} Impact - ${zone.change_type}
            </div>
            <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">${zone.description}</p>
            ${zone.hover_explanation ? `
              <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; font-size: 11px; color: #374151;">
                ${zone.hover_explanation}
              </div>
            ` : ''}
          </div>
        `))
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  return { cleanup };
}

