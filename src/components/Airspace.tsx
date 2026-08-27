import React, { useRef, useState } from 'react';
import type { Aircraft, AirspaceDimensions, SimulationSettings } from '../types/aircraft';
import { RadarGrid } from './RadarGrid';
import { FlightTrail } from './FlightTrail';
import { TrajectoryLine } from './TrajectoryLine';
import { AircraftMarker } from './AircraftMarker';
import { ZoomIn, ZoomOut, RotateCcw, Compass, Crosshair } from 'lucide-react';

interface AirspaceProps {
  aircraft: Aircraft[];
  selectedAircraftId: string | null;
  settings: SimulationSettings;
  bounds: AirspaceDimensions;
  onSelectAircraft: (aircraft: Aircraft | null) => void;
}

export const Airspace: React.FC<AirspaceProps> = ({
  aircraft,
  selectedAircraftId,
  settings,
  bounds,
  onSelectAircraft,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom transformation states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Handle Zoom In / Out / Reset
  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.6), 3.0));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left - pan.x) / (rect.width * zoom)) * bounds.width;
      const svgY = ((e.clientY - rect.top - pan.y) / (rect.height * zoom)) * bounds.height;
      setCursorPos({ x: Math.round(svgX), y: Math.round(svgY) });
    }

    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    handleZoom(factor);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).tagName === 'svg' ||
      (e.target as HTMLElement).tagName === 'rect'
    ) {
      onSelectAircraft(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#04070e] overflow-hidden select-none cursor-crosshair border border-slate-800 rounded-sm"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setCursorPos(null);
      }}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
    >
      {/* SVG Airspace Tactical Scope Layer */}
      <svg
        viewBox={`0 0 ${bounds.width} ${bounds.height}`}
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Layer 1: Radar Airway Grid & Navigation Waypoints */}
        <RadarGrid
          width={bounds.width}
          height={bounds.height}
          showRangeRings={settings.showRangeRings}
          showSectorGrid={settings.showSectorGrid}
          showRadarSweep={settings.radarSweep && settings.isRunning}
        />

        {/* Layer 2: Historical Radar Returns */}
        {settings.showTrails && (
          <g className="flight-trails-layer">
            {aircraft.map((ac) => (
              <FlightTrail
                key={`trail-${ac.id}`}
                history={ac.routeHistory}
                currentX={ac.x}
                currentY={ac.y}
                status={ac.status}
              />
            ))}
          </g>
        )}

        {/* Layer 3: Projected Trajectories */}
        {settings.showTrajectories && (
          <g className="trajectories-layer">
            {aircraft.map((ac) => (
              <TrajectoryLine
                key={`traj-${ac.id}`}
                currentX={ac.x}
                currentY={ac.y}
                trajectory={ac.predictedTrajectory}
                status={ac.status}
                isSelected={ac.id === selectedAircraftId}
              />
            ))}
          </g>
        )}

        {/* Layer 4: SSR Aircraft Radar Targets & Full Data Blocks */}
        <g className="aircraft-layer">
          {aircraft.map((ac) => (
            <AircraftMarker
              key={ac.id}
              aircraft={ac}
              isSelected={ac.id === selectedAircraftId}
              showLabels={settings.showLabels}
              onSelect={onSelectAircraft}
            />
          ))}
        </g>
      </svg>

      {/* Scope Control Toolbar (Top Right) */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 font-mono">
        <div className="flex items-center bg-[#090d16]/90 border border-slate-800 px-1 py-0.5 rounded text-xs">
          <button
            onClick={() => handleZoom(1.15)}
            title="Zoom In"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.85)}
            title="Zoom Out"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            title="Reset Scope View"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#090d16]/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-400 flex items-center gap-1">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>HDG REF: MAG 000°</span>
        </div>
      </div>

      {/* Scope Telemetry Footer (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 bg-[#090d16]/90 border border-slate-800 px-2.5 py-1 rounded text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1 text-slate-300">
          <Crosshair className="w-3 h-3 text-cyan-400" />
          <span>CURSOR:</span>
        </div>
        <span>
          X: <strong className="text-slate-200">{cursorPos ? cursorPos.x : '---'}</strong>
        </span>
        <span>
          Y: <strong className="text-slate-200">{cursorPos ? cursorPos.y : '---'}</strong>
        </span>
        <span className="text-slate-700">|</span>
        <span>
          ZOOM: <strong className="text-slate-200">{Math.round(zoom * 100)}%</strong>
        </span>
      </div>
    </div>
  );
};
