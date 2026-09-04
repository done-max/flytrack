import React from 'react';
import type { Aircraft } from '../types/aircraft';
import { AlertTriangle, Flame } from 'lucide-react';

interface FlightStripBoardProps {
  aircraft: Aircraft[];
  selectedAircraftId: string | null;
  onSelectAircraft: (aircraft: Aircraft) => void;
}

export const FlightStripBoard: React.FC<FlightStripBoardProps> = ({
  aircraft,
  selectedAircraftId,
  onSelectAircraft,
}) => {
  return (
    <div className="liquid-glass rounded-3xl p-4 text-slate-200 select-none flex flex-col font-sans text-xs shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <h3 className="text-xs font-bold tracking-wider uppercase text-emerald-300">
            Electronic Flight Strips ({aircraft.length})
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400/80 font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/20">
          ZNY HIGH BAY
        </span>
      </div>

      {/* Flight Strips Rack */}
      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
        {aircraft.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-mono">
            NO ACTIVE STRIPS IN SECTOR
          </div>
        ) : (
          aircraft.map((ac) => {
            const isSelected = ac.id === selectedAircraftId;
            const isCritical = ac.status === 'CRITICAL';
            const isCaution = ac.status === 'CAUTION' || ac.status === 'HIGH_RISK';

            return (
              <div
                key={ac.id}
                onClick={() => onSelectAircraft(ac)}
                className={`p-2.5 rounded-2xl transition-all duration-200 cursor-pointer text-xs ${
                  isSelected
                    ? 'liquid-glass-blue border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                    : isCritical
                    ? 'liquid-glass-red border-red-500/50 hover:brightness-110'
                    : isCaution
                    ? 'liquid-glass-amber border-amber-500/50 hover:brightness-110'
                    : 'liquid-glass-subtle hover:liquid-glass-green border-white/5 hover:border-emerald-400/30'
                }`}
              >
                {/* Top Row: Callsign, Type, Route, Alert Status */}
                <div className="flex items-center justify-between mb-1.5 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-[13px]">{ac.callsign}</span>
                    <span className="text-[10px] px-1.5 py-0.5 liquid-glass-subtle text-sky-200 rounded-lg border border-white/10 font-medium">
                      {ac.model ?? 'B738'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ac.origin ?? 'BOS'}-{ac.destination ?? 'SFO'}
                    </span>
                  </div>

                  {isCritical ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-200 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-400/40 animate-pulse">
                      <Flame className="w-2.5 h-2.5 text-red-400" />
                      STCA
                    </span>
                  ) : isCaution ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      CONFLICT
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/20">
                      NOMINAL
                    </span>
                  )}
                </div>

                {/* Strip Matrix Grid: FL, Speed, Heading, Squawk */}
                <div className="grid grid-cols-4 gap-1.5 text-[10px] bg-black/35 p-1.5 rounded-xl border border-white/5 font-mono">
                  <div>
                    <span className="text-[8.5px] text-slate-400 block font-sans">FLIGHT LVL</span>
                    <span className="text-emerald-300 font-semibold">FL{Math.round(ac.altitude / 100)}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-400 block font-sans">SPEED</span>
                    <span className="text-white font-semibold">{Math.round(ac.speed)}KT</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-400 block font-sans">HEADING</span>
                    <span className="text-sky-300 font-semibold">{String(Math.round(ac.heading)).padStart(3, '0')}°</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-400 block font-sans">SQUAWK</span>
                    <span className="text-emerald-300 font-semibold">{ac.squawk ?? '1200'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
