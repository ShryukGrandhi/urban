"""
Mapbox MCP Integration
Provides intelligent tool selection based on policy analysis
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class MapboxMCPTools:
    """
    Mapbox MCP Tool Selector
    Returns available Mapbox visualization tools that can be used
    """
    
    @staticmethod
    def get_available_tools() -> List[Dict[str, Any]]:
        """
        Get all available Mapbox visualization tools
        These can be intelligently selected based on policy type
        """
        return [
            {
                "name": "heatmap",
                "description": "Create density heatmap for continuous data (population, traffic, crime, etc.)",
                "use_cases": ["population_density", "traffic_volume", "crime_hotspots", "economic_activity"],
                "parameters": {
                    "data_points": "array of {lat, lng, intensity}",
                    "color_scale": "gradient colors",
                    "radius": "heat radius in pixels",
                    "opacity": "0-1"
                },
                "example": {
                    "type": "heatmap",
                    "data": [
                        {"lat": 37.7749, "lng": -122.4194, "intensity": 0.8, "value": "high density"}
                    ],
                    "colorScale": ["#10b981", "#f59e0b", "#ef4444"],
                    "radius": 30
                }
            },
            {
                "name": "choropleth",
                "description": "Color geographic regions by data values (neighborhoods by income, districts by voting, etc.)",
                "use_cases": ["neighborhood_stats", "district_demographics", "zone_classifications"],
                "parameters": {
                    "regions": "GeoJSON polygons",
                    "data_field": "field to visualize",
                    "color_scale": "gradient"
                }
            },
            {
                "name": "markers",
                "description": "Place custom markers at specific locations (businesses, incidents, services, etc.)",
                "use_cases": ["point_of_interest", "incident_locations", "service_locations", "impact_zones"],
                "parameters": {
                    "locations": "array of {lat, lng, data}",
                    "icon": "marker icon",
                    "color": "marker color",
                    "popup": "popup content"
                },
                "example": {
                    "type": "marker",
                    "locations": [
                        {
                            "lat": 37.7599,
                            "lng": -122.4194,
                            "icon": "building",
                            "color": "#3b82f6",
                            "popup": "New affordable housing unit"
                        }
                    ]
                }
            },
            {
                "name": "route_lines",
                "description": "Draw routes or corridors (transit lines, traffic corridors, bike paths)",
                "use_cases": ["transit_routes", "traffic_corridors", "bike_lanes", "pedestrian_paths"],
                "parameters": {
                    "routes": "array of coordinate arrays",
                    "color": "line color",
                    "width": "line width",
                    "style": "solid/dashed"
                }
            },
            {
                "name": "3d_extrusion",
                "description": "Show 3D building heights or elevations (building heights, elevation changes)",
                "use_cases": ["building_development", "height_restrictions", "skyline_changes"],
                "parameters": {
                    "geometries": "building footprints",
                    "height_field": "height data",
                    "color": "building color"
                }
            },
            {
                "name": "circles",
                "description": "Draw sized circles for quantitative data (impact radius, service areas)",
                "use_cases": ["impact_radius", "coverage_area", "influence_zones"],
                "parameters": {
                    "centers": "array of {lat, lng, radius}",
                    "color": "circle color",
                    "opacity": "0-1"
                }
            },
            {
                "name": "isochrones",
                "description": "Show travel time zones from locations (15-min neighborhoods, transit accessibility)",
                "use_cases": ["accessibility", "travel_time", "service_coverage"],
                "parameters": {
                    "origin": "starting point",
                    "times": "array of time intervals",
                    "mode": "walking/driving/transit"
                }
            },
            {
                "name": "fill_polygons",
                "description": "Fill specific areas with colors (affected zones, restricted areas)",
                "use_cases": ["zoning", "restricted_areas", "affected_regions", "jurisdiction_boundaries"],
                "parameters": {
                    "polygons": "GeoJSON polygons",
                    "fill_color": "area color",
                    "opacity": "0-1",
                    "outline": "border style"
                }
            },
            {
                "name": "clusters",
                "description": "Cluster multiple points together (group nearby incidents, aggregate data)",
                "use_cases": ["incident_clustering", "facility_grouping", "data_aggregation"],
                "parameters": {
                    "points": "array of locations",
                    "cluster_radius": "clustering distance",
                    "color_by_count": "gradient by cluster size"
                }
            },
            {
                "name": "animated_flow",
                "description": "Show directional flow or movement (traffic flow, migration patterns)",
                "use_cases": ["traffic_flow", "pedestrian_movement", "transit_flow"],
                "parameters": {
                    "flow_lines": "array of directional paths",
                    "animation_speed": "flow speed",
                    "color": "flow color"
                }
            }
        ]
    
    @staticmethod
    def select_tools_for_policy(
        policy_type: str,
        policy_text: str,
        analysis_context: str
    ) -> List[Dict[str, Any]]:
        """
        Intelligently select which Mapbox tools to use based on policy analysis
        
        Args:
            policy_type: Type of policy (traffic, housing, environmental, etc.)
            policy_text: Full policy document text
            analysis_context: Agent's analysis and findings
            
        Returns:
            List of recommended tools with configurations
        """
        available_tools = MapboxMCPTools.get_available_tools()
        recommended_tools = []
        
        # Simple keyword-based selection (in production, use LLM for this)
        keywords_to_tools = {
            "traffic": ["heatmap", "route_lines", "animated_flow"],
            "housing": ["markers", "3d_extrusion", "choropleth"],
            "population": ["heatmap", "choropleth", "circles"],
            "crime": ["heatmap", "markers", "clusters"],
            "transit": ["route_lines", "isochrones", "markers"],
            "environment": ["heatmap", "fill_polygons", "choropleth"],
            "development": ["3d_extrusion", "markers", "fill_polygons"],
            "zoning": ["fill_polygons", "choropleth"],
            "accessibility": ["isochrones", "heatmap", "circles"],
        }
        
        # Check policy text for keywords
        policy_lower = (policy_type + " " + policy_text + " " + analysis_context).lower()
        
        for keyword, tool_names in keywords_to_tools.items():
            if keyword in policy_lower:
                for tool_name in tool_names:
                    tool = next((t for t in available_tools if t["name"] == tool_name), None)
                    if tool and tool not in recommended_tools:
                        recommended_tools.append(tool)
        
        # If no tools selected, default to heatmap and markers
        if not recommended_tools:
            recommended_tools = [
                next(t for t in available_tools if t["name"] == "heatmap"),
                next(t for t in available_tools if t["name"] == "markers")
            ]
        
        return recommended_tools


# Singleton instance
mapbox_mcp = MapboxMCPTools()



