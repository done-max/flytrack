import React from 'react';
import type { CollisionEvent } from '../types/collision';
import {
  History,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Trash2,
} from 'lucide-react';

interface EventLogProps {
  events: CollisionEvent[];
  onClearEvents: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({ events, onClearEvents }) => {
  const formatSimTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `T+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="liquid-glass rounded-3xl p-4 text-slate-200 select-none font-sans text-xs flex flex-col gap-3 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-sky-400" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-white">
            Tactical Conflict Event Log
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
            {events.length} Events
          </span>
          {events.length > 0 && (
            <button
              onClick={onClearEvents}
              title="Clear event history"
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/10 flex flex-col items-center justify-center text-center gap-2 my-2 text-slate-400">
          <History className="w-6 h-6 text-slate-500 opacity-60" />
          <p className="text-[11px] font-mono">No conflict events logged yet.</p>
          <span className="text-[10px] text-slate-500">
            Events trigger upon STCA conflict detection, severity escalation, and separation resolution.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-0.5">
          {events.map((evt) => {
            const isDetected = evt.type === 'CONFLICT_DETECTED';
            const isEscalated = evt.type === 'RISK_ESCALATED';

            return (
              <div
                key={evt.id}
                className={`p-2.5 rounded-2xl border transition-all duration-150 ${
                  isEscalated
                    ? 'liquid-glass-red border-red-500/40 shadow-sm'
                    : isDetected
                    ? 'liquid-glass-amber border-amber-500/30 shadow-sm'
                    : 'liquid-glass-subtle border-sky-500/30 shadow-sm'
                }`}
              >
                {/* Event Top Line */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    {isEscalated ? (
                      <TrendingUp className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    ) : isDetected ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isEscalated
                          ? 'bg-red-500/30 text-red-200 border border-red-500/40'
                          : isDetected
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-200 border border-sky-500/30'
                      }`}
                    >
                      {evt.type.replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 font-medium">
                    {formatSimTime(evt.simTimeSeconds)}
                  </span>
                </div>

                {/* Conflict Target Pair & Details */}
                <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-white my-1">
                  <span>
                    {evt.aircraftA.callsign} ⚡ {evt.aircraftB.callsign}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      evt.riskLevel === 'CRITICAL'
                        ? 'text-red-300'
                        : evt.riskLevel === 'HIGH_RISK'
                        ? 'text-amber-300'
                        : evt.riskLevel === 'WARNING'
                        ? 'text-yellow-300'
                        : 'text-sky-300'
                    }`}
                  >
                    {evt.riskLevel}
                  </span>
                </div>

                {/* Event Message */}
                <p className="text-[10.5px] text-slate-300 leading-snug font-sans">
                  {evt.message}
                </p>

                {/* Telemetry Metrics */}
                {evt.type !== 'CONFLICT_RESOLVED' && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                    <span>
                      CPA: <strong className="text-white">{evt.predictedClosestSeparation}px</strong>
                    </span>
                    <span>
                      T-CPA: <strong className="text-red-300">{evt.timeToClosestApproach}s</strong>
                    </span>
                    <span>
                      Alt Δ: <strong className="text-slate-200">{evt.altitudeDifference}ft</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
