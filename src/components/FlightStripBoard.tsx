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
    <div className="bg-[#090d14] border border-slate-800 rounded p-3 text-slate-200 select-none flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-slate-500 rounded-xs"></span>
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300">
            ELECTRONIC FLIGHT STRIPS ({aircraft.length})
          </h3>
        </div>
        <span className="text-[10px] text-slate-500">ZNY HIGH BAY</span>
      </div>

      {/* Flight Strips Rack */}
      <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto pr-1">
        {aircraft.length === 0 ? (
          <div className="text-center py-4 text-[11px] text-slate-600">
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
                className={`p-2 rounded border transition-colors cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400'
                    : isCritical
                    ? 'bg-red-950/30 border-red-500/60 hover:bg-red-950/50'
                    : isCaution
                    ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/40'
                    : 'bg-[#06090f] border-slate-800 hover:bg-slate-900'
                }`}
              >
                {/* Top Row: Callsign, Type, Route, Alert Status */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100">{ac.callsign}</span>
                    <span className="text-[10px] px-1 bg-slate-800 text-slate-400 rounded">
                      {ac.model ?? 'B738'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {ac.origin ?? 'BOS'}-{ac.destination ?? 'SFO'}
                    </span>
                  </div>

                  {isCritical ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-950 px-1 py-0.2 rounded border border-red-500 animate-pulse">
                      <Flame className="w-2.5 h-2.5" />
                      STCA ALERT
                    </span>
                  ) : isCaution ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-950 px-1 py-0.2 rounded border border-amber-500">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      CONFLICT
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-semibold">
                      OK
                    </span>
                  )}
                </div>

                {/* Strip Matrix Grid: FL, Speed, Heading, Squawk */}
                <div className="grid grid-cols-4 gap-1 text-[10px] bg-[#03060a] p-1 rounded border border-slate-800/60">
                  <div>
                    <span className="text-[8.5px] text-slate-600 block">ACT FL</span>
                    <span className="text-cyan-300 font-semibold">FL{Math.round(ac.altitude / 100)}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-600 block">SPD</span>
                    <span className="text-slate-200 font-semibold">{Math.round(ac.speed)}KT</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-600 block">HDG</span>
                    <span className="text-slate-200 font-semibold">{String(Math.round(ac.heading)).padStart(3, '0')}°</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-600 block">SSR</span>
                    <span className="text-slate-300 font-semibold">{ac.squawk ?? '1200'}</span>
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
