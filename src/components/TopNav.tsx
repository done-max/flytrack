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
    <header className="bg-[#020502] border-b border-[#14532d] px-4 py-2 flex items-center justify-between select-none z-30 font-mono">
      {/* Brand & Sector Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 bg-[#050f05] border border-[#22c55e]/60 rounded-xs text-green-400">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-green-400 uppercase">
              SKYGUARD <span className="text-slate-100">ATM</span>
            </span>
            <span className="text-[10px] text-[#14532d] font-normal">|</span>
            <span className="text-[11px] text-green-300/80 font-medium">
              SECTOR 04 HIGH [ZNY-ENROUTE]
            </span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-tight">
            ACTIVE PROFILE: <span className="text-green-400 font-semibold uppercase">{activeScenarioName}</span>
          </p>
        </div>
      </div>

      {/* Telemetry & Clocks (Green & Blue Accents) */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 bg-[#050805] border border-[#14532d] px-2.5 py-1 rounded-xs">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400 text-[10px]">TIME:</span>
          <span className="text-green-300 font-semibold tracking-wider">{utcTime || '00:00:00 ZULU'}</span>
        </div>

        <div className="flex items-center gap-2 bg-[#050805] border border-[#14532d] px-2.5 py-1 rounded-xs">
          <Activity className="w-3.5 h-3.5 text-green-400" />
          <span className="text-slate-400 text-[10px]">SIM CLOCK:</span>
          <span className="text-green-400 font-bold tabular-nums">{formatSimTime(simTimeSeconds)}</span>
          <span className="text-[10px] px-1 py-0.2 bg-[#0a180a] text-blue-300 border border-blue-900 rounded-xs">
            {simSpeed}X
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-[#050805] border border-[#14532d] px-2.5 py-1 rounded-xs">
          <Radio className="w-3.5 h-3.5 text-green-400" />
          <span className="text-slate-400 text-[10px]">RADAR TRACKS:</span>
          <span className="text-green-300 font-bold tabular-nums">{aircraftCount} ACTIVE</span>
        </div>
      </div>

      {/* Simulation Master State Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlayPause}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xs border transition-colors cursor-pointer ${
            isRunning
              ? 'bg-[#1a0505] border-red-500/80 text-red-300 hover:bg-[#2a0808]'
              : 'bg-[#051a05] border-green-500/80 text-green-300 hover:bg-[#082a08]'
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
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xs text-[10px] font-bold border ${
            isRunning
              ? 'bg-[#051405] border-green-600/80 text-green-400'
              : 'bg-[#140505] border-red-600/80 text-red-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRunning ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span>{isRunning ? 'RADAR ACTIVE' : 'HOLD'}</span>
        </div>
      </div>
    </header>
  );
};
