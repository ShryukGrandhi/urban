/**
 * Enhanced Mapbox Component with Hover Explanations
 * Displays simulation results with detailed hover information
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ImpactZone {
  location: string;
  coordinates?: [number, number];
  type: 'building' | 'road' | 'area' | 'zone';
  change_type: 'new' | 'modified' | 'removed';
  impact_level: 'high' | 'medium' | 'low';
  description: string;
  metrics: Record<string, any>;
  hover_explanation: string;
}

interface MapData {
  perspective: string;
  impact_zones: ImpactZone[];
  heatmap_data?: Array<{ lat: number; lng: number; intensity: number }>;
  summary_metrics?: Record<string, any>;
  visualization_layers?: string[];
  center?: [number, number];
  zoom?: number;
}

interface EnhancedMapWithHoverProps {
  mapData?: MapData;
  city?: string;
  perspective?: string;
  onLocationClick?: (zone: ImpactZone) => void;
}

export function EnhancedMapWithHover({
  mapData,
  city = 'San Francisco, CA',
  perspective = 'comprehensive',
  onLocationClick,
}: EnhancedMapWithHoverProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Default to SF coordinates
    const defaultCenter: [number, number] = [-122.4194, 37.7749];
    const defaultZoom = 12;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: mapData?.center || defaultCenter,
      zoom: mapData?.zoom || defaultZoom,
      pitch: 45,
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add 3D buildings layer
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
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height'],
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height'],
              ],
              'fill-extrusion-opacity': 0.6,
            },
          },
          labelLayerId
        );
      }
    });

    // Create popup
    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '400px',
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map data when simulation results come in
  useEffect(() => {
    if (!map.current || !mapLoaded || !mapData) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add impact zones as markers
    mapData.impact_zones?.forEach((zone) => {
      if (!zone.coordinates) return;

      // Determine marker color based on impact level and change type
      const getMarkerColor = () => {
        if (zone.change_type === 'new') return '#10b981'; // Green
        if (zone.change_type === 'removed') return '#ef4444'; // Red
        if (zone.impact_level === 'high') return '#f59e0b'; // Orange
        if (zone.impact_level === 'medium') return '#3b82f6'; // Blue
        return '#6b7280'; // Gray
      };

      // Determine marker icon
      const getMarkerIcon = () => {
        if (zone.type === 'building') return '🏢';
        if (zone.type === 'road') return '🛣️';
        if (zone.type === 'area') return '📍';
        return '⭐';
      };

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = getMarkerColor();
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '20px';
      el.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
      el.style.transition = 'transform 0.2s';
      el.innerHTML = getMarkerIcon();

      // Hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        if (popup.current && map.current) {
          popup.current
            .setLngLat(zone.coordinates!)
            .setHTML(createPopupHTML(zone))
            .addTo(map.current);
        }
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        if (popup.current) {
          popup.current.remove();
        }
      });

      // Click handler
      el.addEventListener('click', () => {
        if (onLocationClick) {
          onLocationClick(zone);
        }
      });

      // Add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(zone.coordinates)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Add heatmap if data available
    if (mapData.heatmap_data && mapData.heatmap_data.length > 0) {
      // TODO: Implement heatmap layer
      // This would use Mapbox GL JS heatmap layer
    }

    // Fit bounds to show all markers
    if (mapData.impact_zones && mapData.impact_zones.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      mapData.impact_zones.forEach((zone) => {
        if (zone.coordinates) {
          bounds.extend(zone.coordinates);
        }
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [mapData, mapLoaded, onLocationClick]);

  const createPopupHTML = (zone: ImpactZone): string => {
    return `
      <div style="padding: 12px; min-width: 250px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="font-size: 24px;">${getZoneIcon(zone)}</div>
          <div>
            <div style="font-weight: bold; font-size: 16px; color: #1f2937;">${zone.location}</div>
            <div style="font-size: 12px; color: #6b7280; text-transform: capitalize;">${zone.change_type} ${zone.type}</div>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
          <div style="font-size: 13px; color: #374151; line-height: 1.5;">
            ${zone.description}
          </div>
        </div>

        ${zone.hover_explanation ? `
          <div style="border-left: 3px solid #3b82f6; padding-left: 8px; margin-bottom: 8px;">
            <div style="font-size: 12px; color: #4b5563;">
              ${zone.hover_explanation}
            </div>
          </div>
        ` : ''}

        ${Object.keys(zone.metrics || {}).length > 0 ? `
          <div style="font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            ${Object.entries(zone.metrics).slice(0, 3).map(([key, value]) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="text-transform: capitalize;">${key.replace(/_/g, ' ')}:</span>
                <span style="font-weight: 600; color: #1f2937;">${formatMetricValue(value)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <span style="font-size: 10px; color: #9ca3af;">Click marker for details</span>
        </div>
      </div>
    `;
  };

  const getZoneIcon = (zone: ImpactZone): string => {
    if (zone.type === 'building') return zone.change_type === 'new' ? '🏗️' : '🏢';
    if (zone.type === 'road') return '🛣️';
    if (zone.type === 'area') return '📍';
    return '⭐';
  };

  const formatMetricValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value > 1000) return `${(value / 1000).toFixed(1)}K`;
      if (value % 1 !== 0) return value.toFixed(2);
      return value.toString();
    }
    return String(value);
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Legend */}
      {mapData && (
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md rounded-xl p-4 text-white text-sm max-w-xs">
          <div className="font-bold mb-2">
            {perspective.charAt(0).toUpperCase() + perspective.slice(1)} View
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>New Addition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Removed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>High Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Medium Impact</span>
            </div>
          </div>
          {mapData.summary_metrics && (
            <div className="mt-3 pt-3 border-t border-white/20 text-xs">
              <div className="font-semibold mb-1">Summary</div>
              {Object.entries(mapData.summary_metrics).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400">{key}:</span>
                  <span>{formatMetricValue(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Perspective indicator */}
      <div className="absolute bottom-4 left-4 bg-cyan-600 px-4 py-2 rounded-lg text-white font-bold text-sm">
        📍 {city}
      </div>
    </div>
  );
}


