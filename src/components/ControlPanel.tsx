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
    <div className="flex flex-col gap-3 bg-[#090d14] border border-slate-800 rounded p-3 text-slate-200 select-none font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-cyan-400 rounded-xs"></span>
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-200">
            RADAR CONTROL CONSOLE
          </h2>
        </div>
        <button
          onClick={onOpenAddAircraftModal}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3 h-3" />
          <span>INJECT TARGET</span>
        </button>
      </div>

      {/* Primary Simulation Playback Bar */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
          Simulation State
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onTogglePlayPause}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-bold transition-colors cursor-pointer border ${
              settings.isRunning
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 hover:bg-amber-950/50'
                : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/50'
            }`}
          >
            {settings.isRunning ? (
              <>
                <Pause className="w-3 h-3" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>RESUME</span>
              </>
            )}
          </button>

          <button
            onClick={onStepManual}
            disabled={settings.isRunning}
            title="Step 0.5s forward"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>STEP 0.5s</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-red-950/30 hover:border-red-500/40 hover:text-red-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Simulation Speed Multiplier */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Time Acceleration
          </label>
          <span className="text-[11px] text-cyan-400 font-bold">{settings.simSpeed}X REALTIME</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => onSetSpeed(speed)}
              className={`py-1 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                settings.simSpeed === speed
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {speed}X
            </button>
          ))}
        </div>
      </div>

      {/* Scope Display Filters */}
      <div className="border-t border-slate-800/80 pt-2">
        <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
          Scope Video Filters
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onUpdateSettings({ showTrails: !settings.showTrails })}
            className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors cursor-pointer ${
              settings.showTrails
                ? 'bg-slate-900 border-slate-700 text-slate-200'
                : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}
          >
            <span>History Returns</span>
            <span className={`text-[10px] font-bold ${settings.showTrails ? 'text-cyan-400' : 'text-slate-600'}`}>
              {settings.showTrails ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showTrajectories: !settings.showTrajectories })}
            className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors cursor-pointer ${
              settings.showTrajectories
                ? 'bg-slate-900 border-slate-700 text-slate-200'
                : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}
          >
            <span>Vector Lookahead</span>
            <span className={`text-[10px] font-bold ${settings.showTrajectories ? 'text-cyan-400' : 'text-slate-600'}`}>
              {settings.showTrajectories ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showLabels: !settings.showLabels })}
            className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors cursor-pointer ${
              settings.showLabels
                ? 'bg-slate-900 border-slate-700 text-slate-200'
                : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}
          >
            <span>Full Data Blocks</span>
            <span className={`text-[10px] font-bold ${settings.showLabels ? 'text-cyan-400' : 'text-slate-600'}`}>
              {settings.showLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showRangeRings: !settings.showRangeRings })}
            className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors cursor-pointer ${
              settings.showRangeRings
                ? 'bg-slate-900 border-slate-700 text-slate-200'
                : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}
          >
            <span>Range Rings</span>
            <span className={`text-[10px] font-bold ${settings.showRangeRings ? 'text-cyan-400' : 'text-slate-600'}`}>
              {settings.showRangeRings ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Operational Test Scenarios */}
      <div className="border-t border-slate-800/80 pt-2">
        <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
          Airspace Traffic Scenarios
        </label>
        <div className="flex flex-col gap-1.5">
          {Object.values(SCENARIOS).map((scenario) => {
            const isSelected = activeScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario)}
                className={`text-left p-2 rounded border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/80 text-slate-100'
                    : 'bg-[#06090f] border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-bold text-slate-200">
                    {scenario.name}
                  </span>
                  {scenario.id === 'scenario_collision' && (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1 py-0.2 rounded bg-amber-950/60 border border-amber-600/60 text-amber-300">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      STCA
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
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
