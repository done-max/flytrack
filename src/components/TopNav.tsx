import React, { useEffect, useState } from 'react';
import { Shield, Radio, Clock, Play, Pause, Activity, Sparkles, Terminal, AlertTriangle, CloudLightning } from 'lucide-react';

interface TopNavProps {
  isRunning: boolean;
  simSpeed: number;
  simTimeSeconds: number;
  aircraftCount: number;
  activeConflictsCount: number;
  weatherWarningsCount: number;
  airspaceStatus: 'SAFE' | 'CAUTION' | 'HIGH RISK' | 'CRITICAL';
  activeScenarioName: string;
  isDemoMode: boolean;
  isDebugOpen: boolean;
  onTogglePlayPause: () => void;
  onToggleDemoMode: () => void;
  onToggleDebug: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isRunning,
  simSpeed,
  simTimeSeconds,
  aircraftCount,
  activeConflictsCount,
  weatherWarningsCount,
  airspaceStatus,
  activeScenarioName,
  isDemoMode,
  isDebugOpen,
  onTogglePlayPause,
  onToggleDemoMode,
  onToggleDebug,
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

  const getStatusBadge = () => {
    switch (airspaceStatus) {
      case 'CRITICAL':
        return 'bg-red-500/30 text-red-200 border-red-500/50 animate-pulse';
      case 'HIGH RISK':
        return 'bg-orange-500/30 text-orange-200 border-orange-500/50';
      case 'CAUTION':
        return 'bg-amber-500/30 text-amber-200 border-amber-500/50';
      case 'SAFE':
      default:
        return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
    }
  };

  return (
    <header className="liquid-glass mx-3 mt-2 mb-1.5 px-4 py-2 rounded-full flex items-center justify-between select-none z-30 font-sans shadow-2xl border border-white/15">
      {/* Brand & Sector Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/15 border border-sky-400/30 text-white shadow-[0_0_15px_rgba(56,189,248,0.25)]">
          <Shield className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wide text-white">
              SkyGuard <span className="text-sky-400 font-bold">AI</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[11px] text-slate-300 font-normal">
              Predictive Airspace Safety
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5">
            <span>SECTOR: <strong className="text-slate-300 font-semibold">ZNY-04</strong></span>
            <span>•</span>
            <span>SCENARIO: <strong className="text-sky-300 font-semibold">{activeScenarioName}</strong></span>
          </p>
        </div>
      </div>

      {/* Presentation HUD Stats Capsules */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Airspace Status Pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge()}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>STATUS: {airspaceStatus}</span>
        </div>

        {/* Live Aircraft Track Counter */}
        <div className="hidden md:flex items-center gap-1.5 liquid-glass-subtle px-2.5 py-1 rounded-full text-slate-300 border border-white/10 text-[10px]">
          <Radio className="w-3 h-3 text-sky-400" />
          <span className="text-slate-400 font-sans font-medium">FLEET:</span>
          <span className="text-white font-bold">{aircraftCount}</span>
        </div>

        {/* Active Conflicts */}
        {activeConflictsCount > 0 ? (
          <div className="flex items-center gap-1.5 liquid-glass-red px-2.5 py-1 rounded-full text-red-200 border border-red-500/40 text-[10px] animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>{activeConflictsCount} CONFLICTS</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 liquid-glass-subtle px-2.5 py-1 rounded-full text-slate-400 border border-white/10 text-[10px]">
            <span>0 CONFLICTS</span>
          </div>
        )}

        {/* Active Weather Warnings */}
        {weatherWarningsCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 liquid-glass-amber px-2.5 py-1 rounded-full text-amber-200 border border-amber-500/40 text-[10px]">
            <CloudLightning className="w-3 h-3 text-amber-400" />
            <span>{weatherWarningsCount} WX CELLS</span>
          </div>
        )}

        {/* UTC Clock */}
        <div className="hidden xl:flex items-center gap-1.5 liquid-glass-subtle px-2.5 py-1 rounded-full text-slate-300 border border-white/10 text-[10px]">
          <Clock className="w-3 h-3 text-sky-400" />
          <span className="text-white font-semibold">{utcTime || '00:00:00 Z'}</span>
        </div>

        {/* Sim Time */}
        <div className="flex items-center gap-1.5 liquid-glass-subtle px-2.5 py-1 rounded-full text-slate-300 border border-white/10 text-[10px]">
          <Activity className="w-3 h-3 text-sky-400" />
          <span className="text-sky-300 font-bold tabular-nums">{formatSimTime(simTimeSeconds)}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 border border-white/20 text-white font-bold">
            {simSpeed}X
          </span>
        </div>
      </div>

      {/* Action Toggles: Demo Mode, Dev HUD, Play/Pause */}
      <div className="flex items-center gap-2 font-mono">
        {/* Demo Mode Toggle */}
        <button
          onClick={onToggleDemoMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold cursor-pointer transition-all duration-200 shadow-md ${
            isDemoMode
              ? 'liquid-glass-active text-white border border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              : 'liquid-glass-subtle text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Demo Mode</span>
        </button>

        {/* Dev HUD Toggle */}
        <button
          onClick={onToggleDebug}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10.5px] font-bold cursor-pointer transition-all duration-200 ${
            isDebugOpen
              ? 'liquid-glass-active text-emerald-300 border border-emerald-500/50'
              : 'liquid-glass-subtle text-slate-400 hover:text-white border border-white/10'
          }`}
          title="Toggle Developer Telemetry HUD"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">HUD</span>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlayPause}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
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
      </div>
    </header>
  );
};

