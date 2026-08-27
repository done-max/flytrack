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
    <div className="bg-[#040704] border border-[#14532d] rounded-xs p-3 text-slate-200 select-none flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#14532d] pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-xs"></span>
          <h3 className="text-xs font-bold tracking-wider uppercase text-green-400">
            ELECTRONIC FLIGHT STRIPS ({aircraft.length})
          </h3>
        </div>
        <span className="text-[10px] text-green-500/70 font-semibold">ZNY HIGH BAY</span>
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
                className={`p-2 rounded-xs border transition-colors cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-[#051c24] border-blue-400'
                    : isCritical
                    ? 'bg-[#1a0505] border-red-500 hover:bg-[#250808]'
                    : isCaution
                    ? 'bg-[#1a1405] border-amber-500 hover:bg-[#251e08]'
                    : 'bg-[#020502] border-[#14532d]/80 hover:bg-[#051405]'
                }`}
              >
                {/* Top Row: Callsign, Type, Route, Alert Status */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100">{ac.callsign}</span>
                    <span className="text-[10px] px-1 bg-[#051405] border border-[#14532d] text-blue-300 rounded-xs">
                      {ac.model ?? 'B738'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ac.origin ?? 'BOS'}-{ac.destination ?? 'SFO'}
                    </span>
                  </div>

                  {isCritical ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-300 bg-red-950 px-1 py-0.2 rounded-xs border border-red-500 animate-pulse">
                      <Flame className="w-2.5 h-2.5 text-red-400" />
                      STCA ALERT
                    </span>
                  ) : isCaution ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-950 px-1 py-0.2 rounded-xs border border-amber-500">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      CONFLICT
                    </span>
                  ) : (
                    <span className="text-[9px] text-green-400 font-semibold">
                      NOMINAL
                    </span>
                  )}
                </div>

                {/* Strip Matrix Grid: FL, Speed, Heading, Squawk */}
                <div className="grid grid-cols-4 gap-1 text-[10px] bg-[#000000] p-1 rounded-xs border border-[#14532d]/60">
                  <div>
                    <span className="text-[8.5px] text-slate-500 block">ACT FL</span>
                    <span className="text-green-400 font-semibold">FL{Math.round(ac.altitude / 100)}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 block">SPD</span>
                    <span className="text-slate-200 font-semibold">{Math.round(ac.speed)}KT</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 block">HDG</span>
                    <span className="text-blue-300 font-semibold">{String(Math.round(ac.heading)).padStart(3, '0')}°</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 block">SSR</span>
                    <span className="text-green-300 font-semibold">{ac.squawk ?? '1200'}</span>
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
