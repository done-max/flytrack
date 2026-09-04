import React from 'react';
import type { SimulationSettings, ScenarioDefinition } from '../types/aircraft';
import { SCENARIOS } from '../simulation/scenarios';
import {
  Play,
  Pause,
  RotateCcw,
  PlusCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface ControlPanelProps {
  settings: SimulationSettings;
  activeScenarioId: string;
  onTogglePlayPause: () => void;
  onStepManual: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  onUpdateSettings: (newSettings: Partial<SimulationSettings>) => void;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  onOpenAddAircraftModal: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  activeScenarioId,
  onTogglePlayPause,
  onStepManual,
  onReset,
  onSetSpeed,
  onUpdateSettings,
  onSelectScenario,
  onOpenAddAircraftModal,
}) => {
  const speedOptions = [1, 2, 5, 10];

  return (
    <div className="liquid-glass rounded-3xl p-4 text-slate-200 select-none font-sans text-xs flex flex-col gap-3.5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <h2 className="text-xs font-bold tracking-wider uppercase text-emerald-300">
            Control Console
          </h2>
        </div>
        <button
          onClick={onOpenAddAircraftModal}
          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold liquid-glass-interactive liquid-glass-green text-emerald-100 rounded-xl cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
          <span>Inject Target</span>
        </button>
      </div>

      {/* Primary Simulation Playback Bar */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5 font-mono">
          Playback Engine
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onTogglePlayPause}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold transition-all duration-200 cursor-pointer shadow-md active:scale-95 ${
              settings.isRunning
                ? 'liquid-glass-red text-red-200 hover:brightness-110'
                : 'liquid-glass-green text-emerald-100 hover:brightness-110'
            }`}
          >
            {settings.isRunning ? (
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

          <button
            onClick={onStepManual}
            disabled={settings.isRunning}
            title="Step 0.5s forward"
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl liquid-glass-subtle text-sky-300 hover:bg-sky-500/20 hover:border-sky-400/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer active:scale-95 border border-white/10"
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-[11px]">STEP 0.5s</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl liquid-glass-subtle text-red-300 hover:bg-red-500/20 hover:border-red-400/40 transition-all duration-150 cursor-pointer active:scale-95 border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span className="font-mono text-[11px]">RESET</span>
          </button>
        </div>
      </div>

      {/* Simulation Speed Multiplier (iOS Segmented Control) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
            Time Warp
          </label>
          <span className="text-[11px] text-emerald-400 font-bold font-mono">{settings.simSpeed}X REALTIME</span>
        </div>
        <div className="liquid-glass-subtle p-1 rounded-2xl grid grid-cols-4 gap-1 border border-white/10">
          {speedOptions.map((speed) => {
            const isActive = settings.simSpeed === speed;
            return (
              <button
                key={speed}
                onClick={() => onSetSpeed(speed)}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer font-mono ${
                  isActive
                    ? 'liquid-glass-green text-emerald-100 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {speed}X
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope Display Filters */}
      <div className="border-t border-white/10 pt-2.5">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5 font-mono">
          Radar Video Filters
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onUpdateSettings({ showTrails: !settings.showTrails })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showTrails
                ? 'liquid-glass-green text-emerald-100 border-emerald-500/40'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">History Returns</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showTrails ? 'text-emerald-300' : 'text-slate-500'}`}>
              {settings.showTrails ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showTrajectories: !settings.showTrajectories })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showTrajectories
                ? 'liquid-glass-green text-emerald-100 border-emerald-500/40'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Vector Projection</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showTrajectories ? 'text-emerald-300' : 'text-slate-500'}`}>
              {settings.showTrajectories ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showLabels: !settings.showLabels })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showLabels
                ? 'liquid-glass-green text-emerald-100 border-emerald-500/40'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Full Data Blocks</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showLabels ? 'text-emerald-300' : 'text-slate-500'}`}>
              {settings.showLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showRangeRings: !settings.showRangeRings })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showRangeRings
                ? 'liquid-glass-green text-emerald-100 border-emerald-500/40'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Range Rings</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showRangeRings ? 'text-emerald-300' : 'text-slate-500'}`}>
              {settings.showRangeRings ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Operational Test Scenarios */}
      <div className="border-t border-white/10 pt-2.5">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5 font-mono">
          Airspace Traffic Scenarios
        </label>
        <div className="flex flex-col gap-1.5">
          {Object.values(SCENARIOS).map((scenario) => {
            const isSelected = activeScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario)}
                className={`text-left p-3 rounded-2xl transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'liquid-glass-green text-emerald-100 border-emerald-400/50 shadow-[0_0_15px_rgba(34,197,94,0.25)]'
                    : 'liquid-glass-subtle text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-white">
                    {scenario.name}
                  </span>
                  {scenario.id === 'scenario_collision' && (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 font-mono animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                      STCA ALERT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug font-sans">
                  {scenario.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
