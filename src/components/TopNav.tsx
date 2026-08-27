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
    <header className="bg-[#090d14] border-b border-slate-800 px-4 py-2 flex items-center justify-between select-none z-30 font-mono">
      {/* Brand & Sector Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 bg-slate-900 border border-slate-700 rounded text-cyan-400">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
              SKYGUARD <span className="text-cyan-400">ATM</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">|</span>
            <span className="text-[11px] text-slate-400 font-medium">
              SECTOR 04 HIGH [ZNY-ENROUTE]
            </span>
          </div>
          <p className="text-[10px] text-slate-500 tracking-tight">
            ACTIVE PROFILE: <span className="text-slate-300 font-semibold uppercase">{activeScenarioName}</span>
          </p>
        </div>
      </div>

      {/* Telemetry & Clocks */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 bg-[#06090f] border border-slate-800 px-2.5 py-1 rounded">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 text-[10px]">TIME:</span>
          <span className="text-slate-200 font-semibold tracking-wider">{utcTime || '00:00:00 ZULU'}</span>
        </div>

        <div className="flex items-center gap-2 bg-[#06090f] border border-slate-800 px-2.5 py-1 rounded">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 text-[10px]">SIM CLOCK:</span>
          <span className="text-cyan-400 font-bold tabular-nums">{formatSimTime(simTimeSeconds)}</span>
          <span className="text-[10px] px-1 py-0.2 bg-slate-800 text-slate-300 rounded">
            {simSpeed}x
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-[#06090f] border border-slate-800 px-2.5 py-1 rounded">
          <Radio className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 text-[10px]">RADAR TRACKS:</span>
          <span className="text-slate-200 font-bold tabular-nums">{aircraftCount} ACTIVE</span>
        </div>
      </div>

      {/* Simulation Master State */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlayPause}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer ${
            isRunning
              ? 'bg-slate-900 border-amber-500/60 text-amber-300 hover:bg-slate-800'
              : 'bg-slate-900 border-emerald-500/60 text-emerald-300 hover:bg-slate-800'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE SIM</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN SIM</span>
            </>
          )}
        </button>

        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border ${
            isRunning
              ? 'bg-[#061e14] border-emerald-600/50 text-emerald-400'
              : 'bg-[#1f1406] border-amber-600/50 text-amber-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRunning ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span>{isRunning ? 'RADAR ACTIVE' : 'HOLD'}</span>
        </div>
      </div>
    </header>
  );
};
