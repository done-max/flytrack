import React, { useState } from 'react';
import type { CollisionEvent } from '../types/collision';
import type { WeatherEvent } from '../types/weather';
import {
  History,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Trash2,
  CloudLightning,
  ShieldAlert,
  ArrowRightCircle,
  CheckCircle,
} from 'lucide-react';

export type UnifiedEvent =
  | ({ category: 'COLLISION' } & CollisionEvent)
  | ({ category: 'WEATHER' } & WeatherEvent);

interface EventLogProps {
  collisionEvents: CollisionEvent[];
  weatherEvents: WeatherEvent[];
  onClearEvents: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({
  collisionEvents,
  weatherEvents,
  onClearEvents,
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'COLLISION' | 'WEATHER'>('ALL');

  const formatSimTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `T+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const unifiedList: UnifiedEvent[] = [
    ...collisionEvents.map((e) => ({ ...e, category: 'COLLISION' as const })),
    ...weatherEvents.map((e) => ({ ...e, category: 'WEATHER' as const })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredList = unifiedList.filter((e) => {
    if (filterCategory === 'ALL') return true;
    return e.category === filterCategory;
  });

  return (
    <div className="liquid-glass rounded-3xl p-4 text-slate-200 select-none font-sans text-xs flex flex-col gap-3 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-sky-400" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-white">
            Airspace Audit & Event Log
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
            {filteredList.length} Events
          </span>
          {unifiedList.length > 0 && (
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

      {/* Category Filter Pills */}
      <div className="liquid-glass-subtle p-1 rounded-2xl grid grid-cols-3 gap-1 border border-white/10 font-mono text-[10px]">
        <button
          onClick={() => setFilterCategory('ALL')}
          className={`py-1 rounded-xl font-bold transition-all cursor-pointer ${
            filterCategory === 'ALL'
              ? 'liquid-glass-active text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ALL ({unifiedList.length})
        </button>
        <button
          onClick={() => setFilterCategory('COLLISION')}
          className={`py-1 rounded-xl font-bold transition-all cursor-pointer ${
            filterCategory === 'COLLISION'
              ? 'liquid-glass-active text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          STCA ({collisionEvents.length})
        </button>
        <button
          onClick={() => setFilterCategory('WEATHER')}
          className={`py-1 rounded-xl font-bold transition-all cursor-pointer ${
            filterCategory === 'WEATHER'
              ? 'liquid-glass-active text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          WEATHER ({weatherEvents.length})
        </button>
      </div>

      {/* Events List */}
      {filteredList.length === 0 ? (
        <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/10 flex flex-col items-center justify-center text-center gap-2 my-2 text-slate-400">
          <History className="w-6 h-6 text-slate-500 opacity-60" />
          <p className="text-[11px] font-mono">No events logged for current filter.</p>
          <span className="text-[10px] text-slate-500">
            System records STCA proximity breaches, weather danger zone entries, and risk resolutions.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-0.5">
          {filteredList.map((evt) => {
            if (evt.category === 'COLLISION') {
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
                        STCA {evt.type.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                      {formatSimTime(evt.simTimeSeconds)}
                    </span>
                  </div>

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

                  <p className="text-[10.5px] text-slate-300 leading-snug font-sans">
                    {evt.message}
                  </p>

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
            }

            // Weather Event Rendering
            const isEntered = evt.type === 'AIRCRAFT_ENTERED_DANGER_ZONE';
            const isWarning = evt.type === 'WEATHER_WARNING';
            const isExited = evt.type === 'AIRCRAFT_EXITED_DANGER_ZONE';

            return (
              <div
                key={evt.id}
                className={`p-2.5 rounded-2xl border transition-all duration-150 ${
                  isEntered
                    ? 'liquid-glass-red border-red-500/50 shadow-sm'
                    : isWarning
                    ? 'liquid-glass-amber border-amber-500/35 shadow-sm'
                    : 'liquid-glass-subtle border-sky-500/30 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    {isEntered ? (
                      <CloudLightning className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />
                    ) : isWarning ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : isExited ? (
                      <ArrowRightCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    )}
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isEntered
                          ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                          : isWarning
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-200 border border-sky-500/30'
                      }`}
                    >
                      WX {evt.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 font-medium">
                    {formatSimTime(evt.simTimeSeconds)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-white my-1">
                  <span>
                    {evt.aircraftCallsign} ⚡ {evt.zoneName}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      evt.weatherRisk === 'CRITICAL'
                        ? 'text-red-300'
                        : evt.weatherRisk === 'HIGH'
                        ? 'text-orange-300'
                        : evt.weatherRisk === 'MODERATE'
                        ? 'text-amber-300'
                        : 'text-sky-300'
                    }`}
                  >
                    {evt.weatherRisk}
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-300 leading-snug font-sans">
                  {evt.message}
                </p>

                {isWarning && evt.timeToEntry !== null && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                    <span>
                      Est. Entry: <strong className="text-red-300">{evt.timeToEntry}s</strong>
                    </span>
                    <span>
                      Distance: <strong className="text-white">{evt.distanceToZone}px</strong>
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
