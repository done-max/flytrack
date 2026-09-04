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
  CheckCircle2,
  CloudLightning,
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
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
          <h2 className="text-xs font-bold tracking-wider uppercase text-white">
            Control Console
          </h2>
        </div>
        <button
          onClick={onOpenAddAircraftModal}
          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold liquid-glass-interactive liquid-glass-subtle text-white rounded-xl cursor-pointer border border-white/15"
        >
          <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
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
                ? 'liquid-glass-red text-red-100 hover:brightness-110'
                : 'liquid-glass-active text-white hover:brightness-110'
            }`}
          >
            {settings.isRunning ? (
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

          <button
            onClick={onStepManual}
            disabled={settings.isRunning}
            title="Step 0.5s forward"
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl liquid-glass-subtle text-slate-300 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer active:scale-95 border border-white/10"
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-[11px]">STEP 0.5s</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl liquid-glass-subtle text-slate-300 hover:text-red-300 hover:border-red-400/40 transition-all duration-150 cursor-pointer active:scale-95 border border-white/10"
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
          <span className="text-[11px] text-sky-400 font-bold font-mono">{settings.simSpeed}X REALTIME</span>
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
                    ? 'liquid-glass-active text-white shadow-[0_0_12px_rgba(255,255,255,0.2)]'
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
            onClick={() => onUpdateSettings({ showWeatherOverlay: !settings.showWeatherOverlay })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showWeatherOverlay
                ? 'liquid-glass-subtle text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Weather Radar</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showWeatherOverlay ? 'text-sky-300' : 'text-slate-500'}`}>
              {settings.showWeatherOverlay ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showAirspaceSafetyGrid: !settings.showAirspaceSafetyGrid })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showAirspaceSafetyGrid
                ? 'liquid-glass-subtle text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Safety Heatmap</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showAirspaceSafetyGrid ? 'text-sky-300' : 'text-slate-500'}`}>
              {settings.showAirspaceSafetyGrid ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showTrails: !settings.showTrails })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showTrails
                ? 'liquid-glass-subtle text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">History Returns</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showTrails ? 'text-sky-300' : 'text-slate-500'}`}>
              {settings.showTrails ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showTrajectories: !settings.showTrajectories })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showTrajectories
                ? 'liquid-glass-subtle text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Vector Projection</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showTrajectories ? 'text-sky-300' : 'text-slate-500'}`}>
              {settings.showTrajectories ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showLabels: !settings.showLabels })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showLabels
                ? 'liquid-glass-subtle text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Full Data Blocks</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showLabels ? 'text-sky-300' : 'text-slate-500'}`}>
              {settings.showLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showRangeRings: !settings.showRangeRings })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showRangeRings
                ? 'liquid-glass-subtle text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Range Rings</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showRangeRings ? 'text-sky-300' : 'text-slate-500'}`}>
              {settings.showRangeRings ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showWaypoints: !settings.showWaypoints })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border ${
              settings.showWaypoints
                ? 'liquid-glass-subtle text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'liquid-glass-subtle text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[11px]">Flight Waypoints</span>
            <span className={`text-[10px] font-mono font-bold ${settings.showWaypoints ? 'text-sky-300' : 'text-slate-500'}`}>
              {settings.showWaypoints ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Operational Test Scenarios (All Phase 2, 3, 4 & 5 Scenarios) */}
      <div className="border-t border-white/10 pt-2.5">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5 font-mono">
          Airspace & Weather Scenarios ({Object.keys(SCENARIOS).length} Tests)
        </label>
        <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-0.5">
          {Object.values(SCENARIOS).map((scenario) => {
            const isSelected = activeScenarioId === scenario.id;
            const isPhase5 = scenario.id.startsWith('scenario_phase5');
            const isWeatherScenario = scenario.id.startsWith('scenario_weather');
            const isConflict = scenario.id === 'scenario_conflict' || scenario.id === 'scenario_headon';
            const isSafe = scenario.id === 'scenario_safe' || scenario.id === 'scenario_altitude' || scenario.id === 'scenario_weather_clear';

            return (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario)}
                className={`text-left p-2.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'liquid-glass-active text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                    : 'liquid-glass-subtle text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-white">
                    {scenario.name}
                  </span>
                  {isPhase5 ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono">
                      <Zap className="w-2.5 h-2.5 text-cyan-400" />
                      PHASE 5
                    </span>
                  ) : isWeatherScenario ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono">
                      <CloudLightning className="w-2.5 h-2.5 text-indigo-400" />
                      WX
                    </span>
                  ) : isConflict ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 font-mono animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                      STCA
                    </span>
                  ) : isSafe ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono">
                      <CheckCircle2 className="w-2.5 h-2.5 text-sky-400" />
                      SAFE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      MIXED
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 leading-snug font-sans">
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
