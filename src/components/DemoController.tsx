import React from 'react';
import {
  Sparkles,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  X,
  Zap,
} from 'lucide-react';
import type { DemoStageConfig } from '../types/demo';

export const DEMO_STAGES: DemoStageConfig[] = [
  {
    id: 'STAGE_1_NOMINAL',
    stageNumber: 1,
    title: 'Nominal Airspace Cruise',
    subtitle: 'Fleet operating at standard cruise separation',
    description:
      '10 commercial aircraft are in level cruise flight across active ATC airway corridors maintaining required 5 NM lateral / 1,000 FT vertical separation minima.',
    triggerTimeSeconds: 0,
    highlightAircraftIds: ['AC_DEMO_1', 'AC_DEMO_2'],
  },
  {
    id: 'STAGE_2_APPROACHING',
    stageNumber: 2,
    title: 'Converging Flight Trajectories',
    subtitle: 'SKY 101 and AAL 452 on intercept course',
    description:
      'SKY 101 (FL330 eastbound) and AAL 452 (FL330 northbound) begin closing distance towards intersection fix MERIT. Proximity monitoring begins tracking relative velocity.',
    triggerTimeSeconds: 12,
    highlightAircraftIds: ['AC_DEMO_1', 'AC_DEMO_2'],
  },
  {
    id: 'STAGE_3_PREDICTED_CONFLICT',
    stageNumber: 3,
    title: 'STCA Conflict Predicted & Escalated',
    subtitle: 'Predicted CPA under 30 px within 40s (CRITICAL)',
    description:
      'Collision engine detects imminent loss of separation at (540, 360). Threat level escalates from CAUTION to CRITICAL with active time-to-CPA countdown warning.',
    triggerTimeSeconds: 24,
    highlightAircraftIds: ['AC_DEMO_1', 'AC_DEMO_2'],
  },
  {
    id: 'STAGE_4_WEATHER_HAZARD',
    stageNumber: 4,
    title: 'Convective Storm Hazard Detected',
    subtitle: 'CELL-OMEGA obstructs standard left-turn route',
    description:
      'Severe thunderstorm CELL-OMEGA (80 km/h winds, FL450 tops) is active northwest of SKY 101. Standard left turn vector is vetoed by the weather safety analyzer.',
    triggerTimeSeconds: 32,
    highlightAircraftIds: ['AC_DEMO_1'],
  },
  {
    id: 'STAGE_5_AI_RECOMMENDATION',
    stageNumber: 5,
    title: 'AI Decision Engine Selects Optimal Vector',
    subtitle: 'TURN RIGHT 30° evaluated as optimal (94% Conf)',
    description:
      'Machine learning model evaluates alternative maneuver candidates. Left turn is vetoed due to weather; Right Turn 30° provides 100% safe separation with minimal fuel penalty.',
    triggerTimeSeconds: 38,
    highlightAircraftIds: ['AC_DEMO_1'],
    recommendedActionId: 'TURN_RIGHT',
    autoApplyAction: true,
  },
  {
    id: 'STAGE_6_MANEUVER_EXECUTION',
    stageNumber: 6,
    title: 'Tactical Avoidance Vector Clearance',
    subtitle: 'Aircraft alters trajectory away from conflict and storm',
    description:
      'ATC executes HDG 120° clearance for SKY 101. Aircraft smoothly establishes new trajectory, increasing predicted CPA distance beyond safety minima.',
    triggerTimeSeconds: 44,
    highlightAircraftIds: ['AC_DEMO_1'],
  },
  {
    id: 'STAGE_7_CONFLICT_RESOLVED',
    stageNumber: 7,
    title: 'Conflict Resolved & Incident Logged',
    subtitle: 'Airspace returns to Nominal Safe status',
    description:
      'Separation minima restored (> 100 px). STCA engine marks conflict as RESOLVED. Comprehensive telemetry audit entry is committed to the immutable event log.',
    triggerTimeSeconds: 54,
    highlightAircraftIds: ['AC_DEMO_1', 'AC_DEMO_2'],
  },
];

interface DemoControllerProps {
  currentStageIndex: number;
  autoPlay: boolean;
  simTimeSeconds: number;
  hasExecutedAvoidance: boolean;
  onSetStage: (index: number) => void;
  onToggleAutoPlay: () => void;
  onExecuteAvoidance: () => void;
  onRestartDemo: () => void;
  onExitDemo: () => void;
}

export const DemoController: React.FC<DemoControllerProps> = ({
  currentStageIndex,
  autoPlay,
  simTimeSeconds: _simTimeSeconds,
  hasExecutedAvoidance,
  onSetStage,
  onToggleAutoPlay,
  onExecuteAvoidance,
  onRestartDemo,
  onExitDemo,
}) => {
  const currentStage = DEMO_STAGES[currentStageIndex] || DEMO_STAGES[0];
  const isLastStage = currentStageIndex === DEMO_STAGES.length - 1;
  const isFirstStage = currentStageIndex === 0;

  return (
    <div className="liquid-glass rounded-3xl p-4 shadow-2xl border border-sky-400/30 font-sans select-none flex flex-col gap-3 animate-fade-in text-slate-200">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl liquid-glass-active flex items-center justify-center border border-sky-400/40 text-sky-400 shadow-md">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                SkyGuard AI • Interactive Demo Presentation
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30">
                STAGE {currentStage.stageNumber} OF {DEMO_STAGES.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Deterministic 11-Step Airspace Collision Avoidance & Weather Analysis Sequence
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRestartDemo}
            title="Restart Demo Sequence"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass-subtle text-slate-300 hover:text-white text-[10px] font-mono border border-white/10 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restart</span>
          </button>

          <button
            onClick={onToggleAutoPlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold cursor-pointer transition-all ${
              autoPlay
                ? 'liquid-glass-active text-sky-200 border border-sky-400/50 shadow-md'
                : 'liquid-glass-subtle text-slate-300 border border-white/10 hover:text-white'
            }`}
          >
            {autoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-sky-400" />}
            <span>{autoPlay ? 'Auto-Advancing' : 'Manual Stepping'}</span>
          </button>

          <button
            onClick={onExitDemo}
            title="Exit Demo Mode"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper Dots & Stage Titles Bar */}
      <div className="grid grid-cols-7 gap-1.5 font-mono text-[9px]">
        {DEMO_STAGES.map((stage, idx) => {
          const isCurrent = idx === currentStageIndex;
          const isPassed = idx < currentStageIndex;

          return (
            <button
              key={stage.id}
              onClick={() => onSetStage(idx)}
              className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                isCurrent
                  ? 'liquid-glass-active border-sky-400/60 text-white shadow-md'
                  : isPassed
                  ? 'liquid-glass-subtle border-emerald-500/30 text-emerald-300'
                  : 'liquid-glass-subtle border-white/5 text-slate-500 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-1">
                {isPassed ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20 text-[8px] flex items-center justify-center font-bold">
                    {stage.stageNumber}
                  </span>
                )}
                <span className="font-bold truncate max-w-[80px]">Step {stage.stageNumber}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Narrative Card */}
      <div className="liquid-glass-subtle p-3.5 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white font-mono">
              {currentStage.title}
            </span>
            <span className="text-[10.5px] text-sky-300 font-mono">
              • {currentStage.subtitle}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {currentStage.description}
          </p>
        </div>

        {/* Tactical Action Buttons for Stage 5/6 */}
        <div className="flex items-center gap-2 shrink-0">
          {(currentStageIndex === 4 || currentStageIndex === 5) && !hasExecutedAvoidance && (
            <button
              onClick={onExecuteAvoidance}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full liquid-glass-active text-white text-xs font-bold font-mono shadow-lg hover:brightness-110 active:scale-95 cursor-pointer border border-sky-400/50 animate-pulse"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Apply AI Vector (HDG 120°)</span>
            </button>
          )}

          {hasExecutedAvoidance && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Vector Applied
            </span>
          )}

          {/* Stepper controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetStage(Math.max(0, currentStageIndex - 1))}
              disabled={isFirstStage}
              className={`p-1.5 rounded-xl liquid-glass-subtle border border-white/10 transition-all ${
                isFirstStage ? 'opacity-30 cursor-not-allowed' : 'hover:text-white cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSetStage(Math.min(DEMO_STAGES.length - 1, currentStageIndex + 1))}
              disabled={isLastStage}
              className={`p-1.5 rounded-xl liquid-glass-subtle border border-white/10 transition-all ${
                isLastStage ? 'opacity-30 cursor-not-allowed' : 'hover:text-white cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};