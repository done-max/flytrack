import React, { useRef, useState } from 'react';
import type { Aircraft, AirspaceDimensions, SimulationSettings } from '../types/aircraft';
import type { CollisionPrediction } from '../types/collision';
import { RadarGrid } from './RadarGrid';
import { FlightTrail } from './FlightTrail';
import { TrajectoryLine } from './TrajectoryLine';
import { ConflictZoneLayer } from './ConflictZoneLayer';
import { AircraftMarker } from './AircraftMarker';
import { ZoomIn, ZoomOut, RotateCcw, Compass, Crosshair, AlertTriangle } from 'lucide-react';

interface AirspaceProps {
  aircraft: Aircraft[];
  conflicts?: CollisionPrediction[];
  selectedAircraftId: string | null;
  settings: SimulationSettings;
  bounds: AirspaceDimensions;
  onSelectAircraft: (aircraft: Aircraft | null) => void;
}

export const Airspace: React.FC<AirspaceProps> = ({
  aircraft,
  conflicts = [],
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

  const topCriticalConflict = conflicts.find((c) => c.collisionRisk === 'CRITICAL') || conflicts[0];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#05080e]/95 overflow-hidden select-none cursor-crosshair rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl"
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

        {/* Layer 3: Projected Trajectories & Prediction Markers */}
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

        {/* Layer 4: Mathematical Conflict Points & Predicted Danger Regions */}
        <ConflictZoneLayer conflicts={conflicts} />

        {/* Layer 5: SSR Aircraft Radar Targets & Full Data Blocks */}
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

      {/* Floating Top Center Conflict Alert Pill (When Conflict Detected) */}
      {topCriticalConflict && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="liquid-glass-red px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono text-red-100 font-bold shadow-2xl animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
            <span>
              CONFLICT DETECTED: {topCriticalConflict.aircraftA.callsign} & {topCriticalConflict.aircraftB.callsign} (T-{topCriticalConflict.timeToClosestApproach}s CPA)
            </span>
          </div>
        </div>
      )}

      {/* Floating iOS Glass Control Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <div className="flex items-center liquid-glass px-1.5 py-1 rounded-2xl shadow-xl">
          <button
            onClick={() => handleZoom(1.15)}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150 active:scale-90"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.85)}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150 active:scale-90"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            title="Reset Scope View"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150 active:scale-90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="liquid-glass px-3 py-1.5 rounded-2xl text-[11px] font-mono text-slate-200 flex items-center gap-1.5 shadow-xl">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>MAG 000°</span>
        </div>
      </div>

      {/* Floating iOS Glass Scope Telemetry Footer (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2.5 liquid-glass px-3.5 py-1.5 rounded-2xl text-[11px] font-mono text-slate-300 shadow-xl">
        <div className="flex items-center gap-1 text-sky-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span className="font-sans font-medium text-[10px] text-slate-400">CURSOR</span>
        </div>
        <span>
          X: <strong className="text-white font-semibold">{cursorPos ? cursorPos.x : '---'}</strong>
        </span>
        <span>
          Y: <strong className="text-white font-semibold">{cursorPos ? cursorPos.y : '---'}</strong>
        </span>
        <span className="text-white/20">|</span>
        <span>
          ZOOM: <strong className="text-white font-semibold">{Math.round(zoom * 100)}%</strong>
        </span>
      </div>
    </div>
  );
};
