import React from 'react';
import type { Aircraft, AircraftStatus } from '../types/aircraft';
import {
  X,
  Trash2,
  Sliders,
  Compass,
  Gauge,
  ArrowUpRight,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

interface AircraftInfoProps {
  aircraft: Aircraft | null;
  onUpdateAircraft: (id: string, updates: Partial<Aircraft>) => void;
  onDeselect: () => void;
  onRemoveAircraft: (id: string) => void;
}

export const AircraftInfo: React.FC<AircraftInfoProps> = ({
  aircraft,
  onUpdateAircraft,
  onDeselect,
  onRemoveAircraft,
}) => {
  if (!aircraft) {
    return (
      <div className="bg-[#090d14] border border-slate-800 rounded p-4 text-slate-500 select-none flex flex-col items-center justify-center min-h-[260px] text-center font-mono">
        <div className="w-8 h-8 rounded border border-slate-800 bg-slate-900 flex items-center justify-center mb-2 text-slate-600">
          +
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          NO ACTIVE TRACK HOOKED
        </h3>
        <p className="text-[11px] text-slate-600 max-w-[220px]">
          Click an SSR target on the radar scope or select a flight progress strip to view and modify flight clearances.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: AircraftStatus) => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500 text-red-300 font-mono text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3" />
            STCA CONFLICT
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-950/80 border border-orange-500 text-orange-300 font-mono text-[10px] font-bold">
            <AlertOctagon className="w-3 h-3" />
            HIGH RISK
          </span>
        );
      case 'CAUTION':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500 text-amber-300 font-mono text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3" />
            CAUTION
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-[10px] font-semibold">
            NOMINAL
          </span>
        );
    }
  };

  const handleHeadingChange = (deg: number) => {
    let normalized = deg % 360;
    if (normalized < 0) normalized += 360;
    onUpdateAircraft(aircraft.id, { heading: normalized });
  };

  // Approximate Mach number from Ground Speed (assuming cruise at FL300)
  const approxMach = (aircraft.speed / 573).toFixed(2);

  return (
    <div className="flex flex-col gap-3 bg-[#090d14] border border-slate-800 rounded p-3 text-slate-200 select-none font-mono text-xs">
      {/* Header & Track Identification */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-cyan-300 tracking-wider">
              {aircraft.callsign}
            </span>
            <span className="text-[10px] px-1 py-0.2 bg-slate-800 text-slate-300 rounded">
              {aircraft.model ?? 'B738'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            SSR: <span className="text-slate-300">{aircraft.squawk ?? '1200'}</span> | ROUTE:{' '}
            <span className="text-slate-300">
              {aircraft.origin ?? 'BOS'} ➔ {aircraft.destination ?? 'SFO'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {getStatusBadge(aircraft.status)}
          <button
            onClick={onDeselect}
            title="Deselect Target"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Radar Flight Telemetry Matrix */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#06090f] border border-slate-800/80 p-2 rounded">
        <div>
          <span className="text-[9px] text-slate-500 uppercase block">RADAR COORD</span>
          <span className="text-slate-200 font-semibold">
            X:{Math.round(aircraft.x)} Y:{Math.round(aircraft.y)}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 uppercase block">ALTITUDE / FL</span>
          <span className="text-cyan-300 font-semibold">
            {aircraft.altitude.toLocaleString()} FT (FL{Math.round(aircraft.altitude / 100)})
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 uppercase block">GROUND SPEED / MACH</span>
          <span className="text-slate-200 font-semibold">
            {Math.round(aircraft.speed)} KTS / M{approxMach}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 uppercase block">TRACK / VECTOR</span>
          <span className="text-slate-200 font-semibold">
            HDG {String(Math.round(aircraft.heading)).padStart(3, '0')}°
          </span>
        </div>
      </div>

      {/* Tactical Controller Clearance Panel */}
      <div className="flex flex-col gap-2.5 border-t border-slate-800/80 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>ATC VECTOR CLEARANCES</span>
          </label>
          <span className="text-[9px] text-slate-500">DIRECT EXEC</span>
        </div>

        {/* 1. ASSIGNED HEADING */}
        <div className="space-y-1 bg-[#06090f] p-2 rounded border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-500" />
              ASSIGNED HEADING
            </span>
            <span className="text-cyan-300 font-bold px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded">
              {String(Math.round(aircraft.heading)).padStart(3, '0')}° MAG
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="359"
            value={Math.round(aircraft.heading)}
            onChange={(e) => handleHeadingChange(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />

          {/* Heading step modifiers */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {[-30, -10, +10, +30].map((delta) => (
              <button
                key={delta}
                onClick={() => handleHeadingChange(aircraft.heading + delta)}
                className="flex-1 py-0.5 text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-colors cursor-pointer"
              >
                {delta > 0 ? `+${delta}°` : `${delta}°`}
              </button>
            ))}
          </div>
        </div>

        {/* 2. ASSIGNED SPEED */}
        <div className="space-y-1 bg-[#06090f] p-2 rounded border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-slate-500" />
              ASSIGNED SPEED
            </span>
            <span className="text-cyan-300 font-bold px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded">
              {Math.round(aircraft.speed)} KTS
            </span>
          </div>

          <input
            type="range"
            min="250"
            max="850"
            step="10"
            value={Math.round(aircraft.speed)}
            onChange={(e) => onUpdateAircraft(aircraft.id, { speed: Number(e.target.value) })}
            className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[8.5px] text-slate-500">
            <span>250 KT (HOLD)</span>
            <span>500 KT (CRZ)</span>
            <span>850 KT (MAX)</span>
          </div>
        </div>

        {/* 3. CLEARED FLIGHT LEVEL */}
        <div className="space-y-1 bg-[#06090f] p-2 rounded border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-slate-500" />
              CLEARED FLIGHT LEVEL
            </span>
            <span className="text-cyan-300 font-bold px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded">
              FL{Math.round(aircraft.altitude / 100)} ({aircraft.altitude.toLocaleString()} FT)
            </span>
          </div>

          <input
            type="range"
            min="10000"
            max="45000"
            step="1000"
            value={aircraft.altitude}
            onChange={(e) => {
              const alt = Number(e.target.value);
              onUpdateAircraft(aircraft.id, { altitude: alt, targetAltitude: alt });
            }}
            className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[8.5px] text-slate-500">
            <span>FL100</span>
            <span>FL300</span>
            <span>FL450</span>
          </div>
        </div>
      </div>

      {/* Delete / Deselect Actions */}
      <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between">
        <button
          onClick={() => onRemoveAircraft(aircraft.id)}
          className="flex items-center gap-1 px-2 py-1 text-[11px] bg-red-950/30 hover:bg-red-900/50 border border-red-500/40 text-red-300 rounded transition-colors cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>TERMINATE TRACK</span>
        </button>

        <button
          onClick={onDeselect}
          className="px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded transition-colors cursor-pointer"
        >
          DESELECT
        </button>
      </div>
    </div>
  );
};
