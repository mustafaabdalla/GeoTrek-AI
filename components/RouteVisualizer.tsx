import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Coordinate } from '../types';

interface RouteVisualizerProps {
  coordinates: Coordinate[];
  isTracking: boolean;
}

const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ coordinates, isTracking }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || coordinates.length < 2) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    // Clear previous rendering
    svg.selectAll("*").remove();

    // Define margins
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    // Note: Longitude maps to X, Latitude maps to Y
    const xExtent = d3.extent(coordinates, d => d.longitude) as [number, number];
    const yExtent = d3.extent(coordinates, d => d.latitude) as [number, number];

    // Handle case where we don't have enough spread yet (e.g., standing still)
    const latDiff = (yExtent[1] - yExtent[0]) || 0.0001;
    const lonDiff = (xExtent[1] - xExtent[0]) || 0.0001;
    
    const paddingFactor = 0.1;

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - lonDiff * paddingFactor, xExtent[1] + lonDiff * paddingFactor])
      .range([0, innerWidth]);

    // Latitude Y-axis usually needs to be inverted for screen coords (North is up, screen Y 0 is top)
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - latDiff * paddingFactor, yExtent[1] + latDiff * paddingFactor])
      .range([innerHeight, 0]);

    const lineGenerator = d3.line<Coordinate>()
      .x(d => xScale(d.longitude))
      .y(d => yScale(d.latitude))
      .curve(d3.curveCatmullRom.alpha(0.5)); // Smooth the path slightly

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw the path
    g.append("path")
      .datum(coordinates)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6") // Blue-500
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineGenerator)
      .attr("filter", "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))"); // Glow effect

    // Draw Start Point
    const startPoint = coordinates[0];
    g.append("circle")
      .attr("cx", xScale(startPoint.longitude))
      .attr("cy", yScale(startPoint.latitude))
      .attr("r", 6)
      .attr("fill", "#22c55e") // Green-500
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    // Draw Current/End Point
    const endPoint = coordinates[coordinates.length - 1];
    g.append("circle")
      .attr("cx", xScale(endPoint.longitude))
      .attr("cy", yScale(endPoint.latitude))
      .attr("r", 8)
      .attr("fill", isTracking ? "#ef4444" : "#f59e0b") // Red (pulse) if tracking, Amber if stopped
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .classed("animate-pulse", isTracking);

  }, [coordinates, isTracking]);

  if (coordinates.length < 2) {
    return (
      <div className="w-full h-64 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
        <div className="text-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p>Start moving to visualize your path</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-64 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden relative shadow-inner">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-2 right-2 text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
        North is Up
      </div>
    </div>
  );
};

export default RouteVisualizer;