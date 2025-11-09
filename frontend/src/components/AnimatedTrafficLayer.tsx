/**
 * Animated Traffic Layer
 * Shows tiny cars following real roads with traffic congestion
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface Car {
  id: string;
  position: [number, number];
  route: [number, number][];
  currentIndex: number;
  speed: number;
  color: string;
  type: string;
}

interface AnimatedTrafficLayerProps {
  map: mapboxgl.Map | null;
  trafficData?: any;
  showCars: boolean;
  congestionLevel?: number;
}

export function useAnimatedTrafficLayer({
  map,
  trafficData,
  showCars = true,
  congestionLevel = 0.5
}: AnimatedTrafficLayerProps) {
  const carsRef = useRef<Car[]>([]);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const animationRef = useRef<number>();
  const currentZoom = useRef<number>(12);

  // Major SF roads and their routes - SPREAD ACROSS THE CITY
  const majorRoutes = [
    // Mission Street (north-south) - EASTERN side
    {
      name: 'Mission St',
      path: [
        [-122.4194, 37.7950], // Start north
        [-122.4194, 37.7900],
        [-122.4194, 37.7850],
        [-122.4194, 37.7800],
        [-122.4194, 37.7750],
        [-122.4194, 37.7700],
        [-122.4194, 37.7650],
        [-122.4194, 37.7599], // End south (16th St)
      ],
      carCount: 8,
      avgSpeed: 0.00005, // MUCH slower for visibility
    },
    // Market Street (diagonal) - CENTER
    {
      name: 'Market St',
      path: [
        [-122.3950, 37.7930], // Financial District
        [-122.3977, 37.7886], 
        [-122.4050, 37.7850],
        [-122.4100, 37.7810],
        [-122.4161, 37.7799], // Civic Center
        [-122.4250, 37.7760],
        [-122.4350, 37.7720],
      ],
      carCount: 10,
      avgSpeed: 0.00006,
    },
    // US-101 (highway) - WESTERN side
    {
      name: 'US-101',
      path: [
        [-122.4100, 37.7500], // South
        [-122.4080, 37.7600],
        [-122.4060, 37.7700],
        [-122.4040, 37.7800],
        [-122.4020, 37.7900], // North
      ],
      carCount: 12,
      avgSpeed: 0.0001, // Highway faster but still visible
    },
    // Valencia Street - WESTERN residential
    {
      name: 'Valencia St',
      path: [
        [-122.4216, 37.7950],
        [-122.4216, 37.7850],
        [-122.4216, 37.7750],
        [-122.4216, 37.7650],
        [-122.4216, 37.7550],
      ],
      carCount: 6,
      avgSpeed: 0.00005,
    },
    // Van Ness Avenue - FAR WEST
    {
      name: 'Van Ness Ave',
      path: [
        [-122.4242, 37.8000],
        [-122.4242, 37.7900],
        [-122.4242, 37.7800],
        [-122.4242, 37.7700],
        [-122.4242, 37.7600],
      ],
      carCount: 7,
      avgSpeed: 0.00006,
    },
    // Embarcadero - WATERFRONT (east)
    {
      name: 'Embarcadero',
      path: [
        [-122.3933, 37.8000],
        [-122.3933, 37.7900],
        [-122.3933, 37.7800],
        [-122.3933, 37.7700],
        [-122.3933, 37.7600],
      ],
      carCount: 5,
      avgSpeed: 0.00005,
    }
  ];

  useEffect(() => {
    if (!map || !showCars) {
      if (!showCars) {
        clearCars();
      }
      return;
    }

    console.log('🚗 AnimatedTrafficLayer: Initializing...');
    console.log('  - Map loaded:', !!map);
    console.log('  - Show cars:', showCars);
    console.log('  - Current zoom:', map.getZoom());

    // Monitor zoom level
    const handleZoom = () => {
      const zoom = map.getZoom();
      currentZoom.current = zoom;
      
      console.log('Zoom changed to:', zoom);
      
      // Show cars at zoom 11+ for easy visibility
      if (zoom >= 11 && carsRef.current.length === 0) {
        console.log('✅ Zoom threshold met! Creating cars...');
        initializeCars();
      } else if (zoom < 11 && carsRef.current.length > 0) {
        console.log('Zoom too far out, clearing cars');
        clearCars();
      }
    };

    map.on('zoom', handleZoom);
    
    // Add Mapbox Traffic layer for real-time traffic
    if (!map.getLayer('traffic')) {
      try {
        map.addLayer({
          id: 'traffic',
          type: 'line',
          source: {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-traffic-v1'
          },
          'source-layer': 'traffic',
          paint: {
            'line-width': 4,
            'line-opacity': 0.85,
            'line-color': [
              'case',
              ['==', ['get', 'congestion'], 'low'], '#10b981',
              ['==', ['get', 'congestion'], 'moderate'], '#f59e0b',
              ['==', ['get', 'congestion'], 'heavy'], '#ef4444',
              ['==', ['get', 'congestion'], 'severe'], '#991b1b',
              '#64748b'
            ]
          }
        });
        console.log('✅ Traffic layer added');
      } catch (e) {
        console.error('Failed to add traffic layer:', e);
      }
    }

    // ALWAYS initialize cars immediately if zoom is good
    const currentZoom = map.getZoom();
    console.log('Initial zoom:', currentZoom);
    if (currentZoom >= 11) {
      console.log('✅ Starting with cars visible');
      initializeCars();
    } else {
      console.log('💡 Zoom in to level 11+ to see cars');
    }

    return () => {
      map.off('zoom', handleZoom);
      stopAnimation();
      clearCars();
    };
  }, [map, showCars]);

  const initializeCars = () => {
    if (!map) {
      console.error('Cannot initialize cars: map not available');
      return;
    }

    console.log('🚗 Creating cars on routes...');

    const newCars: Car[] = [];

    majorRoutes.forEach((route, routeIndex) => {
      // Adjust car count based on congestion
      const adjustedCount = Math.floor(route.carCount * (1 + congestionLevel));
      
      console.log(`  Route ${route.name}: Creating ${adjustedCount} cars`);
      
      for (let i = 0; i < adjustedCount; i++) {
        const startIndex = Math.floor(Math.random() * (route.path.length - 1));
        
        newCars.push({
          id: `car-${routeIndex}-${i}`,
          position: route.path[startIndex] as [number, number],
          route: route.path as [number, number][],
          currentIndex: startIndex,
          speed: route.avgSpeed * (0.8 + Math.random() * 0.4), // Randomize speed
          color: getCarColor(i % 5),
          type: i % 10 === 0 ? 'truck' : 'car'
        });
      }
    });

    carsRef.current = newCars;
    console.log(`✅ Created ${newCars.length} cars`);
    
    createCarMarkers();
    startAnimation();
  };

  const getCarColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[index];
  };

  const createCarMarkers = () => {
    if (!map) {
      console.error('Cannot create markers: map not available');
      return;
    }

    console.log(`🎨 Creating ${carsRef.current.length} car markers...`);

    carsRef.current.forEach((car, idx) => {
      const el = document.createElement('div');
      el.className = 'animated-car';
      
      // Make cars MUCH more visible
      const width = car.type === 'truck' ? 24 : 18;
      const height = car.type === 'truck' ? 32 : 28;
      
      el.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        background: linear-gradient(135deg, ${car.color}, ${car.color}dd);
        border-radius: 6px;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.8), 0 0 20px ${car.color}, inset 0 -8px 8px rgba(0,0,0,0.2);
        transition: all 0.05s linear;
        position: relative;
        z-index: 10000 !important;
        pointer-events: none;
        transform-origin: center;
      `;

      // Add detailed car design
      el.innerHTML = `
        <!-- Windshield -->
        <div style="
          position: absolute;
          top: ${car.type === 'truck' ? '8px' : '6px'};
          left: 3px;
          right: 3px;
          height: ${car.type === 'truck' ? '8px' : '6px'};
          background: rgba(100, 200, 255, 0.4);
          border-radius: 2px;
          border: 1px solid rgba(255,255,255,0.3);
        "></div>
        
        <!-- Headlights -->
        <div style="
          position: absolute;
          top: 2px;
          left: 3px;
          width: 3px;
          height: 3px;
          background: #ffff00;
          border-radius: 50%;
          box-shadow: 0 0 6px #ffff00;
        "></div>
        <div style="
          position: absolute;
          top: 2px;
          right: 3px;
          width: 3px;
          height: 3px;
          background: #ffff00;
          border-radius: 50%;
          box-shadow: 0 0 6px #ffff00;
        "></div>
        
        <!-- Shadow underneath -->
        <div style="
          position: absolute;
          bottom: -4px;
          left: 2px;
          right: 2px;
          height: 2px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
          filter: blur(2px);
        "></div>
      `;

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
        .setLngLat(car.position)
        .addTo(map);

      markersRef.current.push(marker);
      
      if (idx === 0) {
        console.log(`✅ First car created at [${car.position[0]}, ${car.position[1]}]`);
      }
    });
    
    console.log(`✅ All ${markersRef.current.length} car markers added to map`);
  };

  const clearCars = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    carsRef.current = [];
  };

  const startAnimation = () => {
    console.log('🎬 Starting car animation...');
    
    let frameCount = 0;
    
    const animate = () => {
      if (!map || carsRef.current.length === 0) {
        console.log('Animation stopped: no map or cars');
        return;
      }

      frameCount++;
      
      // Log every 60 frames (once per second at 60fps)
      if (frameCount % 60 === 0) {
        console.log(`🚗 Animation running: ${carsRef.current.length} cars, frame ${frameCount}`);
      }

      carsRef.current.forEach((car, carIndex) => {
        // Move car along route
        car.currentIndex += car.speed;
        
        if (car.currentIndex >= car.route.length - 1) {
          // Loop back to start
          car.currentIndex = 0;
        }

        // Interpolate position between route points
        const index = Math.floor(car.currentIndex);
        const nextIndex = Math.min(index + 1, car.route.length - 1);
        const fraction = car.currentIndex - index;

        const currentPoint = car.route[index];
        const nextPoint = car.route[nextIndex];

        const newLng = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * fraction;
        const newLat = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * fraction;
        
        car.position = [newLng, newLat];

        // Update marker position
        if (markersRef.current[carIndex]) {
          try {
            markersRef.current[carIndex].setLngLat([newLng, newLat]);
          } catch (e) {
            console.error(`Failed to update car ${carIndex}:`, e);
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start the animation
    animationRef.current = requestAnimationFrame(animate);
    console.log('✅ Animation loop started');
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return {
    carCount: carsRef.current.length,
    routes: majorRoutes.length,
    clearCars,
    initializeCars,
  };
}

