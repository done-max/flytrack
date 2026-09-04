import React from 'react';
import type { Aircraft, AircraftStatus } from '../types/aircraft';
import type { CollisionPrediction } from '../types/collision';
import {
  X,
  Trash2,
  Sliders,
  Compass,
  Gauge,
  ArrowUpRight,
  AlertTriangle,
  AlertOctagon,
  Flame,
} from 'lucide-react';

interface AircraftInfoProps {
  aircraft: Aircraft | null;
  activeConflict?: CollisionPrediction | null;
  onUpdateAircraft: (id: string, updates: Partial<Aircraft>) => void;
  onDeselect: () => void;
  onRemoveAircraft: (id: string) => void;
}

export const AircraftInfo: React.FC<AircraftInfoProps> = ({
  aircraft,
  activeConflict,
  onUpdateAircraft,
  onDeselect,
  onRemoveAircraft,
}) => {
  if (!aircraft) {
    return (
      <div className="liquid-glass rounded-3xl p-6 text-slate-400 select-none flex flex-col items-center justify-center min-h-[300px] text-center font-sans shadow-2xl">
        <div className="w-10 h-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          +
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1 font-mono">
          No Active Track Hooked
        </h3>
        <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
          Select an SSR radar blip on the scope or click a flight strip to modify real-time ATC vector clearances.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: AircraftStatus) => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full liquid-glass-red text-red-200 font-mono text-[10px] font-bold animate-pulse shadow-lg">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            STCA CONFLICT
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full liquid-glass-red text-red-300 font-mono text-[10px] font-bold">
            <AlertOctagon className="w-3 h-3 text-red-400" />
            HIGH RISK
          </span>
        );
      case 'CAUTION':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full liquid-glass-amber text-amber-200 font-mono text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            CAUTION
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full liquid-glass-green text-emerald-200 font-mono text-[10px] font-semibold">
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

  const approxMach = (aircraft.speed / 573).toFixed(2);
  const otherAircraft = activeConflict
    ? activeConflict.aircraftA.id === aircraft.id
      ? activeConflict.aircraftB
      : activeConflict.aircraftA
    : null;

  return (
    <div className="liquid-glass rounded-3xl p-4 text-slate-200 select-none font-sans text-xs flex flex-col gap-3.5 shadow-2xl">
      {/* Header & Track Identification */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-wider font-mono">
              {aircraft.callsign}
            </span>
            <span className="text-[10px] px-2 py-0.5 liquid-glass-blue text-sky-200 font-mono rounded-lg">
              {aircraft.model ?? 'B738'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            SSR: <span className="text-emerald-300 font-semibold">{aircraft.squawk ?? '1200'}</span> | ROUTE:{' '}
            <span className="text-sky-300 font-semibold">
              {aircraft.origin ?? 'BOS'} ➔ {aircraft.destination ?? 'SFO'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(aircraft.status)}
          <button
            onClick={onDeselect}
            title="Deselect Target"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Predictive Collision Diagnostic Card (Frosted Red Glass) */}
      {activeConflict && otherAircraft && (
        <div className="liquid-glass-red p-3 rounded-2xl flex flex-col gap-2 shadow-xl animate-pulse">
          <div className="flex items-center justify-between">
            <span className="text-red-200 font-bold flex items-center gap-1.5 text-xs font-mono">
              <Flame className="w-4 h-4 text-red-400" />
              STCA PREDICTIVE CONFLICT
            </span>
            <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded-full border border-red-400/40 font-bold text-red-200 font-mono">
              T-{String(activeConflict.timeToClosestApproach).padStart(2, '0')}s CPA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-black/40 p-2 rounded-xl border border-red-500/20 font-mono">
            <div>
              <span className="text-slate-400 block text-[9px] font-sans">CONFLICTING TARGET</span>
              <strong className="text-red-200 font-bold">{otherAircraft.callsign} ({otherAircraft.model ?? 'AC'})</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-sans">MIN PREDICTED DIST</span>
              <strong className="text-red-200 font-bold">{activeConflict.predictedClosestDistance} PX</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-sans">ALT DIFF AT CPA</span>
              <strong className="text-red-200 font-bold">{activeConflict.altitudeDifference} FT</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-sans">RELATIVE SPEED</span>
              <strong className="text-red-200 font-bold">{activeConflict.relativeVelocity.relativeSpeed} KTS</strong>
            </div>
          </div>
        </div>
      )}

      {/* Radar Flight Telemetry Matrix in Translucent Glass */}
      <div className="grid grid-cols-2 gap-2 text-[11px] liquid-glass-subtle p-3 rounded-2xl font-mono">
        <div>
          <span className="text-[9px] text-emerald-400/80 uppercase block font-sans font-medium">RADAR COORD</span>
          <span className="text-white font-semibold">
            X:{Math.round(aircraft.x)} Y:{Math.round(aircraft.y)}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-emerald-400/80 uppercase block font-sans font-medium">ALTITUDE / FL</span>
          <span className="text-emerald-300 font-semibold">
            {aircraft.altitude.toLocaleString()} FT (FL{Math.round(aircraft.altitude / 100)})
          </span>
        </div>
        <div>
          <span className="text-[9px] text-emerald-400/80 uppercase block font-sans font-medium">GROUND SPEED</span>
          <span className="text-white font-semibold">
            {Math.round(aircraft.speed)} KTS / M{approxMach}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-emerald-400/80 uppercase block font-sans font-medium">TRACK / VECTOR</span>
          <span className="text-sky-300 font-semibold">
            HDG {String(Math.round(aircraft.heading)).padStart(3, '0')}° MAG
          </span>
        </div>
      </div>

      {/* Tactical Controller Clearance Panel */}
      <div className="flex flex-col gap-3 border-t border-white/10 pt-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>ATC Vector Clearances</span>
          </label>
          <span className="text-[9px] text-sky-400 font-bold font-mono px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/20">DIRECT EXEC</span>
        </div>

        {/* 1. ASSIGNED HEADING */}
        <div className="space-y-1.5 liquid-glass-subtle p-3 rounded-2xl">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Assigned Heading
            </span>
            <span className="text-emerald-200 font-bold px-2 py-0.5 liquid-glass-green rounded-lg font-mono">
              {String(Math.round(aircraft.heading)).padStart(3, '0')}° MAG
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="359"
            value={Math.round(aircraft.heading)}
            onChange={(e) => handleHeadingChange(Number(e.target.value))}
            className="w-full cursor-pointer"
          />

          {/* Heading step modifiers */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {[-30, -10, +10, +30].map((delta) => (
              <button
                key={delta}
                onClick={() => handleHeadingChange(aircraft.heading + delta)}
                className="flex-1 py-1 text-[10px] font-mono font-semibold liquid-glass-subtle hover:liquid-glass-green text-emerald-300 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 border border-white/5"
              >
                {delta > 0 ? `+${delta}°` : `${delta}°`}
              </button>
            ))}
          </div>
        </div>

        {/* 2. ASSIGNED SPEED */}
        <div className="space-y-1.5 liquid-glass-subtle p-3 rounded-2xl">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Assigned Speed
            </span>
            <span className="text-emerald-200 font-bold px-2 py-0.5 liquid-glass-green rounded-lg font-mono">
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
            className="w-full cursor-pointer"
          />

          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>250 KT (HOLD)</span>
            <span>500 KT (CRZ)</span>
            <span>850 KT (MAX)</span>
          </div>
        </div>

        {/* 3. CLEARED FLIGHT LEVEL */}
        <div className="space-y-1.5 liquid-glass-subtle p-3 rounded-2xl">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              Cleared Flight Level
            </span>
            <span className="text-emerald-200 font-bold px-2 py-0.5 liquid-glass-green rounded-lg font-mono">
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
            className="w-full cursor-pointer"
          />

          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>FL100</span>
            <span>FL300</span>
            <span>FL450</span>
          </div>
        </div>
      </div>

      {/* Delete / Deselect Actions */}
      <div className="border-t border-white/10 pt-2.5 flex items-center justify-between">
        <button
          onClick={() => onRemoveAircraft(aircraft.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold liquid-glass-red text-red-200 rounded-xl transition-all duration-150 cursor-pointer active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-300" />
          <span>Terminate Track</span>
        </button>

        <button
          onClick={onDeselect}
          className="px-3.5 py-1.5 text-[11px] font-semibold liquid-glass-subtle text-slate-300 hover:text-white rounded-xl transition-all duration-150 cursor-pointer active:scale-95 border border-white/10"
        >
          Deselect
        </button>
      </div>
    </div>
  );
};
