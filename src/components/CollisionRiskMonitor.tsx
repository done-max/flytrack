import React from 'react';
import type { AirspaceConflictSummary } from '../types/collision';
import type { Aircraft } from '../types/aircraft';
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  Navigation,
  ArrowRightLeft,
  Activity,
} from 'lucide-react';

interface CollisionRiskMonitorProps {
  conflictSummary: AirspaceConflictSummary;
  aircraftList: Aircraft[];
  selectedAircraftId: string | null;
  onSelectAircraft: (aircraft: Aircraft) => void;
}

export const CollisionRiskMonitor: React.FC<CollisionRiskMonitorProps> = ({
  conflictSummary,
  selectedAircraftId,
  onSelectAircraft,
}) => {
  const { conflicts, totalPairsChecked, highestRiskLevel } = conflictSummary;

  return (
    <div className="liquid-glass rounded-3xl p-4 text-slate-200 select-none font-sans text-xs flex flex-col gap-3.5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              highestRiskLevel === 'CRITICAL'
                ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-ping'
                : highestRiskLevel === 'HIGH_RISK'
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : highestRiskLevel === 'WARNING'
                ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
            }`}
          />
          <h2 className="text-xs font-bold tracking-wider uppercase text-white">
            Collision Risk Monitor
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle border border-white/10 text-[10px] font-mono text-slate-300">
          <Activity className="w-3 h-3 text-sky-400" />
          <span>{totalPairsChecked} Pairs Monitored</span>
        </div>
      </div>

      {/* No Conflicts: Reassuring Liquid Glass Nominal State */}
      {conflicts.length === 0 ? (
        <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/10 flex flex-col items-center text-center gap-2.5 my-1">
          <div className="w-10 h-10 rounded-2xl liquid-glass-active flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">
              AIRSPACE SECTOR NOMINAL
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
              All aircraft are maintaining standard ICAO lateral and vertical separation minima (5 NM / 1,000 FT). Zero conflict vectors detected.
            </p>
          </div>
          <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2.5 border-t border-white/10 font-mono text-[10px]">
            <div className="text-left bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-slate-400 block">LOOKAHEAD</span>
              <span className="text-white font-bold">120 SECONDS</span>
            </div>
            <div className="text-left bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-slate-400 block">MIN VERTICAL</span>
              <span className="text-white font-bold">1,000 FT</span>
            </div>
          </div>
        </div>
      ) : (
        /* Active Conflict Cards */
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-0.5">
          {conflicts.map((conflict, index) => {
            const isSelectedPair =
              selectedAircraftId === conflict.aircraftA.id ||
              selectedAircraftId === conflict.aircraftB.id;

            const isCritical = conflict.collisionRisk === 'CRITICAL';
            const isHighRisk = conflict.collisionRisk === 'HIGH_RISK';

            return (
              <div
                key={`${conflict.aircraftA.id}-${conflict.aircraftB.id}-${index}`}
                className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                  isCritical
                    ? 'liquid-glass-red border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                    : isHighRisk
                    ? 'liquid-glass-amber border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                    : 'liquid-glass-subtle border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                } ${isSelectedPair ? 'ring-2 ring-white/50' : ''}`}
              >
                {/* Conflict Header */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-white">
                    <button
                      onClick={() => onSelectAircraft(conflict.aircraftA)}
                      className="hover:underline hover:text-sky-300 transition-colors cursor-pointer"
                      title="Inspect Aircraft A"
                    >
                      {conflict.aircraftA.callsign}
                    </button>
                    <ArrowRightLeft className="w-3 h-3 text-red-400 animate-pulse" />
                    <button
                      onClick={() => onSelectAircraft(conflict.aircraftB)}
                      className="hover:underline hover:text-sky-300 transition-colors cursor-pointer"
                      title="Inspect Aircraft B"
                    >
                      {conflict.aircraftB.callsign}
                    </button>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1 ${
                      isCritical
                        ? 'bg-red-500/30 text-red-200 border-red-400/60 animate-pulse'
                        : isHighRisk
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                        : 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40'
                    }`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {conflict.collisionRisk}
                  </span>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  {/* Time to CPA Countdown */}
                  <div className="bg-black/30 p-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                      <Clock className="w-3 h-3 text-red-400" />
                      <span>TIME TO CPA</span>
                    </div>
                    <span className="text-base font-black text-red-400 tracking-tight">
                      {conflict.timeToClosestApproach}s
                    </span>
                  </div>

                  {/* Predicted Min Separation */}
                  <div className="bg-black/30 p-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                      <Navigation className="w-3 h-3 text-sky-400" />
                      <span>PREDICTED CPA</span>
                    </div>
                    <span className="text-base font-black text-white tracking-tight">
                      {conflict.predictedClosestDistance} <span className="text-[10px] text-slate-400">PX</span>
                    </span>
                  </div>

                  {/* Current Distance */}
                  <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[9px]">CURRENT DIST</span>
                    <span className="text-slate-200 font-bold">
                      {conflict.currentDistance} PX
                    </span>
                  </div>

                  {/* Altitude Difference */}
                  <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[9px]">ALTITUDE Δ @ CPA</span>
                    <span className={`font-bold ${conflict.altitudeDifference < 1000 ? 'text-red-400' : 'text-slate-200'}`}>
                      {conflict.altitudeDifference} FT
                    </span>
                  </div>
                </div>

                {/* Relative Speed & LoS Window */}
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>
                    Closing Speed:{' '}
                    <strong className="text-white">
                      {conflict.relativeVelocity.relativeSpeed} kts
                    </strong>
                  </span>
                  {conflict.lossOfSeparationWindow && (
                    <span className="text-red-300">
                      LoS: ~{conflict.lossOfSeparationWindow.durationSeconds}s window
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
