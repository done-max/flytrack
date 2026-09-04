import React, { useEffect, useState } from 'react';
import { Shield, Radio, Clock, Play, Pause, Activity } from 'lucide-react';

interface TopNavProps {
  isRunning: boolean;
  simSpeed: number;
  simTimeSeconds: number;
  aircraftCount: number;
  activeScenarioName: string;
  onTogglePlayPause: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isRunning,
  simSpeed,
  simTimeSeconds,
  aircraftCount,
  activeScenarioName,
  onTogglePlayPause,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ')[4] + ' ZULU');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSimTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((totalSeconds % 1) * 10);
    return `T+${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  };

  return (
    <header className="liquid-glass mx-3 mt-2 mb-1 px-4 py-2.5 rounded-2xl flex items-center justify-between select-none z-30 font-sans shadow-2xl">
      {/* Brand & Sector Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-700/10 border border-green-400/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.25)]">
          <Shield className="w-4.5 h-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-green-400 uppercase drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
              SKYGUARD <span className="text-white/90">ATM</span>
            </span>
            <span className="text-[10px] text-white/20">|</span>
            <span className="text-[11px] text-emerald-200/90 font-medium">
              Sector 04 High [ZNY-Enroute]
            </span>
          </div>
          <p className="text-[10px] text-slate-400/90 tracking-tight font-mono">
            PROFILE: <span className="text-emerald-400 font-semibold uppercase">{activeScenarioName}</span>
          </p>
        </div>
      </div>

      {/* Telemetry & Clocks (Translucent Glass Pill Capsules) */}
      <div className="flex items-center gap-2.5 font-mono text-xs">
        <div className="flex items-center gap-2 liquid-glass-subtle px-3 py-1.5 rounded-xl text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 text-[10px] font-sans">TIME</span>
          <span className="text-emerald-300 font-semibold tracking-wider">{utcTime || '00:00:00 ZULU'}</span>
        </div>

        <div className="flex items-center gap-2 liquid-glass-subtle px-3 py-1.5 rounded-xl text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 text-[10px] font-sans">SIM CLOCK</span>
          <span className="text-emerald-400 font-bold tabular-nums">{formatSimTime(simTimeSeconds)}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-300 font-bold">
            {simSpeed}X
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 liquid-glass-subtle px-3 py-1.5 rounded-xl text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 text-[10px] font-sans">RADAR TRACKS</span>
          <span className="text-emerald-300 font-bold tabular-nums">{aircraftCount} ACTIVE</span>
        </div>
      </div>

      {/* Simulation Master State Controls (iOS Liquid Pill Action Buttons) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlayPause}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
            isRunning
              ? 'liquid-glass-red text-red-200 hover:brightness-110'
              : 'liquid-glass-green text-emerald-100 hover:brightness-110'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RESUME</span>
            </>
          )}
        </button>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
            isRunning
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
              : 'bg-red-950/40 border-red-500/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`}
          />
          <span className="font-mono">{isRunning ? 'RADAR ACTIVE' : 'HOLD'}</span>
        </div>
      </div>
    </header>
  );
};
