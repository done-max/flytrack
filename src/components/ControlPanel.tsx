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
    <div className="flex flex-col gap-3 bg-[#040704] border border-[#14532d] rounded-xs p-3 text-slate-200 select-none font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#14532d] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-xs"></span>
          <h2 className="text-xs font-bold tracking-wider uppercase text-green-400">
            RADAR CONTROL CONSOLE
          </h2>
        </div>
        <button
          onClick={onOpenAddAircraftModal}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-[#051405] hover:bg-[#082408] border border-green-600/70 text-green-300 rounded-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3 h-3 text-green-400" />
          <span>INJECT TARGET</span>
        </button>
      </div>

      {/* Primary Simulation Playback Bar */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-green-500/80 block mb-1.5 font-semibold">
          Simulation State
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onTogglePlayPause}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xs font-bold transition-colors cursor-pointer border ${
              settings.isRunning
                ? 'bg-[#1a0505] border-red-500 text-red-300 hover:bg-[#250808]'
                : 'bg-[#051a05] border-green-500 text-green-300 hover:bg-[#082808]'
            }`}
          >
            {settings.isRunning ? (
              <>
                <Pause className="w-3 h-3 text-red-400" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-green-400" />
                <span>RESUME</span>
              </>
            )}
          </button>

          <button
            onClick={onStepManual}
            disabled={settings.isRunning}
            title="Step 0.5s forward"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xs bg-[#050805] border border-blue-900 text-blue-300 hover:bg-[#081420] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-blue-400" />
            <span>STEP 0.5s</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xs bg-[#050805] border border-red-900/80 text-red-400 hover:bg-[#1a0505] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-red-400" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Simulation Speed Multiplier */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] uppercase tracking-wider text-green-500/80 font-semibold">
            Time Acceleration
          </label>
          <span className="text-[11px] text-green-400 font-bold">{settings.simSpeed}X REALTIME</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => onSetSpeed(speed)}
              className={`py-1 text-xs font-semibold rounded-xs border transition-colors cursor-pointer ${
                settings.simSpeed === speed
                  ? 'bg-[#052005] border-green-400 text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                  : 'bg-[#050805] border-[#14532d]/60 text-slate-400 hover:bg-[#081408] hover:text-green-300'
              }`}
            >
              {speed}X
            </button>
          ))}
        </div>
      </div>

      {/* Scope Display Filters */}
      <div className="border-t border-[#14532d] pt-2">
        <label className="text-[10px] uppercase tracking-wider text-green-500/80 block mb-1.5 font-semibold">
          Scope Video Filters
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onUpdateSettings({ showTrails: !settings.showTrails })}
            className={`flex items-center justify-between px-2 py-1.5 rounded-xs border transition-colors cursor-pointer ${
              settings.showTrails
                ? 'bg-[#051805] border-green-600/70 text-green-300'
                : 'bg-[#050805] border-[#14532d]/40 text-slate-600'
            }`}
          >
            <span>History Returns</span>
            <span className={`text-[10px] font-bold ${settings.showTrails ? 'text-green-400' : 'text-slate-600'}`}>
              {settings.showTrails ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showTrajectories: !settings.showTrajectories })}
            className={`flex items-center justify-between px-2 py-1.5 rounded-xs border transition-colors cursor-pointer ${
              settings.showTrajectories
                ? 'bg-[#051805] border-green-600/70 text-green-300'
                : 'bg-[#050805] border-[#14532d]/40 text-slate-600'
            }`}
          >
            <span>Vector Lookahead</span>
            <span className={`text-[10px] font-bold ${settings.showTrajectories ? 'text-green-400' : 'text-slate-600'}`}>
              {settings.showTrajectories ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showLabels: !settings.showLabels })}
            className={`flex items-center justify-between px-2 py-1.5 rounded-xs border transition-colors cursor-pointer ${
              settings.showLabels
                ? 'bg-[#051805] border-green-600/70 text-green-300'
                : 'bg-[#050805] border-[#14532d]/40 text-slate-600'
            }`}
          >
            <span>Full Data Blocks</span>
            <span className={`text-[10px] font-bold ${settings.showLabels ? 'text-green-400' : 'text-slate-600'}`}>
              {settings.showLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showRangeRings: !settings.showRangeRings })}
            className={`flex items-center justify-between px-2 py-1.5 rounded-xs border transition-colors cursor-pointer ${
              settings.showRangeRings
                ? 'bg-[#051805] border-green-600/70 text-green-300'
                : 'bg-[#050805] border-[#14532d]/40 text-slate-600'
            }`}
          >
            <span>Range Rings</span>
            <span className={`text-[10px] font-bold ${settings.showRangeRings ? 'text-green-400' : 'text-slate-600'}`}>
              {settings.showRangeRings ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Operational Test Scenarios */}
      <div className="border-t border-[#14532d] pt-2">
        <label className="text-[10px] uppercase tracking-wider text-green-500/80 block mb-1.5 font-semibold">
          Airspace Traffic Scenarios
        </label>
        <div className="flex flex-col gap-1.5">
          {Object.values(SCENARIOS).map((scenario) => {
            const isSelected = activeScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario)}
                className={`text-left p-2 rounded-xs border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#051805] border-green-400 text-green-200'
                    : 'bg-[#020502] border-[#14532d]/60 text-slate-400 hover:bg-[#050e05] hover:text-green-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-bold text-slate-200">
                    {scenario.name}
                  </span>
                  {scenario.id === 'scenario_collision' && (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1 py-0.2 rounded-xs bg-[#1a0505] border border-red-500 text-red-300">
                      <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                      STCA ALERT
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
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
