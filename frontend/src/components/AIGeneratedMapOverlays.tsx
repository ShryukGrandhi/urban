/**
 * AI-Generated Map Overlays Component
 * Renders dynamic overlays based on AI simulation agent output
 * Shows blocked roads, impact zones, heatmaps, alternate routes
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface AIGeneratedMapOverlaysProps {
  map: mapboxgl.Map | null;
  mapboxData: any;
  simulationData: any;
  onLayersReady?: (layers: string[]) => void;
}

export function useAIGeneratedMapOverlays({
  map,
  mapboxData,
  simulationData,
  onLayersReady,
}: AIGeneratedMapOverlaysProps) {
  const [overlayLayers, setOverlayLayers] = useState<string[]>([]);
  const [enabledLayers, setEnabledLayers] = useState<Record<string, boolean>>({
    'traffic-impact': true,
    'blocked-roads': true,  // ON by default
    'impact-zones': true,   // ON by default
    'heatmap': true,        // ON by default
    'alternate-routes': true,  // ON by default
  });
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !mapboxData) return;

    console.log('🗺️ AI Map Overlays: Processing data...', mapboxData);
    
    // Initialize all overlay layers
    initializeOverlayLayers();

    return () => {
      cleanup();
    };
  }, [map, mapboxData]);

  const initializeOverlayLayers = () => {
    if (!map) return;

    const layers: string[] = [];

    // 1. Add blocked roads layer
    if (mapboxData.blocked_roads || mapboxData.affected_roads) {
      const blockedRoads = mapboxData.blocked_roads || mapboxData.affected_roads || [];
      addBlockedRoadsLayer(blockedRoads);
      layers.push('blocked-roads');
    }

    // 2. Add impact zones
    if (mapboxData.impact_zones) {
      addImpactZonesLayer(mapboxData.impact_zones);
      layers.push('impact-zones');
    }

    // 3. Add traffic heatmap
    if (mapboxData.traffic_heatmap || mapboxData.congestion_points) {
      addTrafficHeatmap(mapboxData.traffic_heatmap || mapboxData.congestion_points);
      layers.push('heatmap');
    }

    // 4. Add alternate routes
    if (mapboxData.alternate_routes) {
      addAlternateRoutesLayer(mapboxData.alternate_routes);
      layers.push('alternate-routes');
    }

    // 5. Add highlight areas
    if (mapboxData.highlight_areas) {
      addHighlightAreas(mapboxData.highlight_areas);
      layers.push('highlight-areas');
    }

    // 6. Add markers for key locations
    if (mapboxData.impact_locations || mapboxData.markers) {
      addImpactMarkers(mapboxData.impact_locations || mapboxData.markers);
    }

    setOverlayLayers(layers);
    if (onLayersReady) {
      onLayersReady(layers);
    }

    console.log('✅ AI Map Overlays: Initialized', layers);
  };

  const addBlockedRoadsLayer = (blockedRoads: any[]) => {
    if (!map || !blockedRoads || blockedRoads.length === 0) return;

    console.log('Adding blocked roads layer:', blockedRoads);

    // Convert AI data to GeoJSON
    const features = blockedRoads.map((road: any) => {
      // Handle different data formats from AI
      const coords = road.coordinates || road.path || road.route || [];
      
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: Array.isArray(coords[0]) ? coords : [[coords.lng || -122.4194, coords.lat || 37.7749]],
        },
        properties: {
          name: road.name || road.street || 'Unknown Road',
          impact: road.impact || road.severity || 'high',
          reason: road.reason || road.description || 'Blocked by policy',
        },
      };
    });

    // Add source
    if (!map.getSource('ai-blocked-roads')) {
      map.addSource('ai-blocked-roads', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });
    }

    // Add layer
    if (!map.getLayer('ai-blocked-roads-layer')) {
      map.addLayer({
        id: 'ai-blocked-roads-layer',
        type: 'line',
        source: 'ai-blocked-roads',
        paint: {
          'line-width': 8,
          'line-color': '#dc2626',
          'line-opacity': 0.9,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });

      // Add glow effect
      map.addLayer({
        id: 'ai-blocked-roads-glow',
        type: 'line',
        source: 'ai-blocked-roads',
        paint: {
          'line-width': 16,
          'line-color': '#dc2626',
          'line-opacity': 0.3,
          'line-blur': 8,
        },
      }, 'ai-blocked-roads-layer');
    }
  };

  const addImpactZonesLayer = (impactZones: any[]) => {
    if (!map || !impactZones || impactZones.length === 0) return;

    console.log('Adding impact zones:', impactZones);

    const features = impactZones.map((zone: any) => {
      // Generate polygon from center point and radius
      const center = zone.center || zone.location || { lng: -122.4194, lat: 37.7749 };
      const radius = zone.radius || 0.01; // ~1km

      // Create circle polygon
      const points: [number, number][] = [];
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        points.push([
          center.lng + radius * Math.cos(angle),
          center.lat + radius * Math.sin(angle),
        ]);
      }

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [points],
        },
        properties: {
          severity: zone.severity || zone.impact || 'medium',
          description: zone.description || zone.name || 'Impact Zone',
        },
      };
    });

    if (!map.getSource('ai-impact-zones')) {
      map.addSource('ai-impact-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });
    }

    if (!map.getLayer('ai-impact-zones-layer')) {
      map.addLayer({
        id: 'ai-impact-zones-layer',
        type: 'fill',
        source: 'ai-impact-zones',
        paint: {
          'fill-color': [
            'match',
            ['get', 'severity'],
            'high', '#8b5cf6',
            'medium', '#3b82f6',
            'low', '#10b981',
            '#6366f1',
          ],
          'fill-opacity': 0.25,
        },
        layout: {
          visibility: 'visible', // Start VISIBLE
        },
      });

      // Add outline
      map.addLayer({
        id: 'ai-impact-zones-outline',
        type: 'line',
        source: 'ai-impact-zones',
        paint: {
          'line-color': [
            'match',
            ['get', 'severity'],
            'high', '#8b5cf6',
            'medium', '#3b82f6',
            'low', '#10b981',
            '#6366f1',
          ],
          'line-width': 2,
          'line-opacity': 0.8,
        },
        layout: {
          visibility: 'visible', // Start VISIBLE
        },
      });
    }
  };

  const addTrafficHeatmap = (heatmapData: any) => {
    if (!map) return;

    console.log('Adding traffic heatmap:', heatmapData);

    // Convert AI data to points
    const points = [];
    
    if (Array.isArray(heatmapData)) {
      points.push(...heatmapData.map((point: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lng || point.lon || -122.4194, point.lat || 37.7749],
        },
        properties: {
          intensity: point.intensity || point.value || 0.5,
        },
      })));
    } else if (heatmapData.points) {
      points.push(...heatmapData.points.map((point: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lng || -122.4194, point.lat || 37.7749],
        },
        properties: {
          intensity: point.intensity || 0.5,
        },
      })));
    }

    // Add default points if none provided
    if (points.length === 0) {
      // Generate sample heatmap around SF
      for (let i = 0; i < 50; i++) {
        points.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [-122.4194 + (Math.random() - 0.5) * 0.05, 37.7749 + (Math.random() - 0.5) * 0.05],
          },
          properties: {
            intensity: Math.random(),
          },
        });
      }
    }

    if (!map.getSource('ai-heatmap')) {
      map.addSource('ai-heatmap', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: points,
        },
      });
    }

    if (!map.getLayer('ai-heatmap-layer')) {
      map.addLayer({
        id: 'ai-heatmap-layer',
        type: 'heatmap',
        source: 'ai-heatmap',
        maxzoom: 15,
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,255,0)',
            0.2, 'rgb(0,255,0)',
            0.4, 'rgb(255,255,0)',
            0.6, 'rgb(255,165,0)',
            0.8, 'rgb(255,0,0)',
            1, 'rgb(139,0,0)',
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.7,
        },
        layout: {
          visibility: 'visible', // Start VISIBLE
        },
      });
    }
  };

  const addAlternateRoutesLayer = (alternateRoutes: any[]) => {
    if (!map || !alternateRoutes || alternateRoutes.length === 0) return;

    console.log('Adding alternate routes:', alternateRoutes);

    const features = alternateRoutes.map((route: any) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: route.coordinates || route.path || [],
      },
      properties: {
        name: route.name || 'Alternate Route',
        delay: route.delay || route.additional_time || '+5 min',
      },
    }));

    if (!map.getSource('ai-alternate-routes')) {
      map.addSource('ai-alternate-routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });
    }

    if (!map.getLayer('ai-alternate-routes-layer')) {
      map.addLayer({
        id: 'ai-alternate-routes-layer',
        type: 'line',
        source: 'ai-alternate-routes',
        paint: {
          'line-width': 4,
          'line-color': '#10b981',
          'line-opacity': 0.7,
          'line-dasharray': [2, 2],
        },
        layout: {
          visibility: 'visible', // Start VISIBLE
        },
      });
    }
  };

  const addHighlightAreas = (highlightAreas: any[]) => {
    if (!map || !highlightAreas || highlightAreas.length === 0) return;

    console.log('Adding highlight areas:', highlightAreas);

    const features = highlightAreas.map((area: any) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [area.lng || -122.4194, area.lat || 37.7749],
      },
      properties: {
        name: area.name || area.title || 'Highlight',
        description: area.description || '',
      },
    }));

    if (!map.getSource('ai-highlights')) {
      map.addSource('ai-highlights', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });
    }

    if (!map.getLayer('ai-highlights-layer')) {
      map.addLayer({
        id: 'ai-highlights-layer',
        type: 'circle',
        source: 'ai-highlights',
        paint: {
          'circle-radius': 20,
          'circle-color': '#f59e0b',
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#f59e0b',
        },
      });
    }
  };

  const addImpactMarkers = (markers: any[]) => {
    if (!map || !markers || markers.length === 0) return;

    console.log('Adding impact markers:', markers);

    markers.forEach((markerData: any) => {
      const coords = markerData.coordinates || markerData.location || {};
      const lng = coords.lng || coords.lon || -122.4194;
      const lat = coords.lat || 37.7749;

      const el = document.createElement('div');
      el.innerHTML = `
        <div class="relative group cursor-pointer">
          <div class="absolute -inset-2 bg-red-500 rounded-full blur-xl opacity-40"></div>
          <div class="relative w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-2xl text-xl">
            ${markerData.icon || '📍'}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-3 bg-black/90 rounded-lg">
              <h4 class="font-bold text-cyan-400 mb-2">${markerData.title || markerData.name || 'Impact Point'}</h4>
              <p class="text-white text-sm">${markerData.description || ''}</p>
              ${markerData.impact ? `<div class="mt-2 text-xs text-gray-300">${markerData.impact}</div>` : ''}
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  const toggleLayer = (layerId: string) => {
    if (!map) return;

    const newEnabled = !enabledLayers[layerId];
    setEnabledLayers(prev => ({ ...prev, [layerId]: newEnabled }));

    // Toggle visibility for all related layers
    const layerMap: Record<string, string[]> = {
      'blocked-roads': ['ai-blocked-roads-layer', 'ai-blocked-roads-glow'],
      'impact-zones': ['ai-impact-zones-layer', 'ai-impact-zones-outline'],
      'heatmap': ['ai-heatmap-layer'],
      'alternate-routes': ['ai-alternate-routes-layer'],
      'highlight-areas': ['ai-highlights-layer'],
    };

    const layers = layerMap[layerId] || [];
    layers.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', newEnabled ? 'visible' : 'none');
      }
    });
  };

  const cleanup = () => {
    if (!map) return;

    // Remove markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Remove layers and sources
    const layerIds = [
      'ai-blocked-roads-glow',
      'ai-blocked-roads-layer',
      'ai-impact-zones-outline',
      'ai-impact-zones-layer',
      'ai-heatmap-layer',
      'ai-alternate-routes-layer',
      'ai-highlights-layer',
    ];

    layerIds.forEach(id => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    });

    const sourceIds = [
      'ai-blocked-roads',
      'ai-impact-zones',
      'ai-heatmap',
      'ai-alternate-routes',
      'ai-highlights',
    ];

    sourceIds.forEach(id => {
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    });
  };

  return {
    overlayLayers,
    enabledLayers,
    toggleLayer,
    refresh: initializeOverlayLayers,
  };
}


