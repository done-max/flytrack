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
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 border border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]">
          <Shield className="w-4.5 h-4.5 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              SKYGUARD <span className="text-sky-400 font-extrabold">ATM</span>
            </span>
            <span className="text-[10px] text-white/20">|</span>
            <span className="text-[11px] text-slate-300 font-medium">
              Sector 04 High [ZNY-Enroute]
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            PROFILE: <span className="text-white font-semibold uppercase">{activeScenarioName}</span>
          </p>
        </div>
      </div>

      {/* Telemetry & Clocks (Translucent Glass Pill Capsules) */}
      <div className="flex items-center gap-2.5 font-mono text-xs">
        <div className="flex items-center gap-2 liquid-glass-subtle px-3 py-1.5 rounded-xl text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 text-[10px] font-sans">TIME</span>
          <span className="text-white font-semibold tracking-wider">{utcTime || '00:00:00 ZULU'}</span>
        </div>

        <div className="flex items-center gap-2 liquid-glass-subtle px-3 py-1.5 rounded-xl text-slate-300">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 text-[10px] font-sans">SIM CLOCK</span>
          <span className="text-sky-300 font-bold tabular-nums">{formatSimTime(simTimeSeconds)}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-white/10 border border-white/20 text-white font-bold">
            {simSpeed}X
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 liquid-glass-subtle px-3 py-1.5 rounded-xl text-slate-300">
          <Radio className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400 text-[10px] font-sans">RADAR TRACKS</span>
          <span className="text-white font-bold tabular-nums">{aircraftCount} ACTIVE</span>
        </div>
      </div>

      {/* Simulation Master State Controls (iOS Liquid Pill Action Buttons) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlayPause}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
            isRunning
              ? 'liquid-glass-red text-red-100 hover:brightness-110'
              : 'liquid-glass-active text-white hover:brightness-110'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current text-red-300" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-sky-300" />
              <span>RESUME</span>
            </>
          )}
        </button>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
            isRunning
              ? 'liquid-glass-subtle border-sky-400/30 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
              : 'liquid-glass-subtle border-red-400/30 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-red-400'
            }`}
          />
          <span className="font-mono">{isRunning ? 'RADAR ACTIVE' : 'HOLD'}</span>
        </div>
      </div>
    </header>
  );
};
