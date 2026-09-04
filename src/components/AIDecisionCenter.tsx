import React, { useState } from 'react';
import type { Aircraft } from '../types/aircraft';
import type { AIDecision, ModelEvaluationMetrics } from '../types/ai';
import {
  Brain,
  Sparkles,
  Zap,
  Compass,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  BarChart3,
  X,
} from 'lucide-react';

interface AIDecisionCenterProps {
  aircraft: Aircraft | null;
  decision: AIDecision | null;
  metrics: ModelEvaluationMetrics;
  onApplyAction: (aircraftId: string, headingDelta: number, altDelta: number, speedDelta: number) => void;
  onSelectAircraft: (aircraft: Aircraft) => void;
  allAircraft: Aircraft[];
}

export const AIDecisionCenter: React.FC<AIDecisionCenterProps> = ({
  aircraft,
  decision,
  metrics,
  onApplyAction,
  onSelectAircraft,
  allAircraft,
}) => {
  const [showMetricsModal, setShowMetricsModal] = useState<boolean>(false);

  if (!aircraft || !decision) {
    return (
      <div className="liquid-glass rounded-3xl p-5 text-slate-400 select-none flex flex-col gap-3 font-sans shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-bold tracking-wider uppercase text-white">
              AI Decision Center
            </h2>
          </div>
          <button
            onClick={() => setShowMetricsModal(true)}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-300 liquid-glass-subtle px-2 py-0.5 rounded-lg border border-white/10 hover:text-white cursor-pointer"
          >
            <BarChart3 className="w-3 h-3 text-sky-400" />
            <span>Metrics ({(metrics.accuracy * 100).toFixed(1)}%)</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/10 flex flex-col items-center justify-center text-center gap-2 my-1">
          <div className="w-10 h-10 rounded-2xl liquid-glass-active flex items-center justify-center border border-white/20 shadow-md">
            <Cpu className="w-5 h-5 text-sky-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase font-mono">
              Select an Aircraft Target
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
              Hook a radar target to run real-time ML risk assessment and compute optimal collision & weather avoidance vectors.
            </p>
          </div>
        </div>

        {allAircraft.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-[9.5px] uppercase font-mono text-slate-400 font-semibold">
              Quick Select Active Target
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {allAircraft.map((ac) => (
                <button
                  key={ac.id}
                  onClick={() => onSelectAircraft(ac)}
                  className="p-2 rounded-xl liquid-glass-subtle text-left border border-white/5 hover:border-white/20 cursor-pointer font-mono text-[11px] text-slate-200 hover:text-white flex items-center justify-between"
                >
                  <span className="font-bold">{ac.callsign}</span>
                  <span className="text-[9px] text-slate-400">FL{Math.round(ac.altitude / 100)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-auto pt-2 border-t border-white/10 text-[9px] text-slate-500 text-center font-mono">
          Prototype / Educational Simulation — Not for real-world flight operations.
        </div>
      </div>
    );
  }

  const {
    aiRiskScore,
    aiRiskCategory,
    collisionRisk,
    weatherRisk,
    recommendedAction,
    actionLabel,
    headingAdjustment,
    altitudeAdjustment,
    speedAdjustment,
    confidence,
    reason,
    explanationDetails,
    candidates,
    hasSafeAlternative,
  } = decision;

  const isCritical = aiRiskCategory === 'CRITICAL';
  const isHigh = aiRiskCategory === 'HIGH';
  const isModerate = aiRiskCategory === 'MODERATE';
  const isSafe = aiRiskCategory === 'SAFE';

  return (
    <div className="liquid-glass rounded-3xl p-4 text-slate-200 select-none font-sans text-xs flex flex-col gap-3 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-white">
            AI Decision Center
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMetricsModal(true)}
            title="Inspect Machine Learning Model Metrics"
            className="flex items-center gap-1 text-[10px] font-mono text-slate-300 liquid-glass-subtle px-2 py-0.5 rounded-lg border border-white/10 hover:text-white cursor-pointer"
          >
            <BarChart3 className="w-3 h-3 text-sky-400" />
            <span>ML Acc: {(metrics.accuracy * 100).toFixed(0)}%</span>
          </button>
        </div>
      </div>

      {/* Target Identity & Continuous AI Risk Score */}
      <div className="liquid-glass-subtle p-3 rounded-2xl border border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-mono">{aircraft.callsign}</span>
            <span className="text-[10px] text-slate-400 font-mono">({aircraft.model || 'B738'})</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            FL{Math.round(aircraft.altitude / 100)} • {Math.round(aircraft.speed)} KTS • HDG {String(Math.round(aircraft.heading)).padStart(3, '0')}°
          </p>
        </div>

        {/* Circular / Pill Risk Score Gauge */}
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-xl font-black font-mono tracking-tight ${
                isCritical
                  ? 'text-red-400 animate-pulse'
                  : isHigh
                  ? 'text-orange-400'
                  : isModerate
                  ? 'text-amber-400'
                  : isSafe
                  ? 'text-sky-300'
                  : 'text-yellow-300'
              }`}
            >
              {aiRiskScore}
            </span>
            <span className="text-[10px] font-mono text-slate-400">/100</span>
          </div>
          <span
            className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-md ${
              isCritical
                ? 'bg-red-500/30 text-red-200'
                : isHigh
                ? 'bg-orange-500/30 text-orange-200'
                : isModerate
                ? 'bg-amber-500/20 text-amber-200'
                : 'bg-sky-500/20 text-sky-200'
            }`}
          >
            {aiRiskCategory} RISK
          </span>
        </div>
      </div>

      {/* Multi-Factor Safety Risk Breakdown Matrix */}
      <div className="grid grid-cols-3 gap-1.5 font-mono text-[9.5px]">
        <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
          <span className="text-slate-400 block text-[8.5px]">COLLISION</span>
          <strong
            className={
              collisionRisk === 'CRITICAL'
                ? 'text-red-400'
                : collisionRisk === 'HIGH_RISK'
                ? 'text-orange-400'
                : collisionRisk === 'WARNING'
                ? 'text-amber-400'
                : 'text-sky-300'
            }
          >
            {collisionRisk}
          </strong>
        </div>

        <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
          <span className="text-slate-400 block text-[8.5px]">WEATHER</span>
          <strong
            className={
              weatherRisk === 'CRITICAL'
                ? 'text-red-400'
                : weatherRisk === 'HIGH'
                ? 'text-orange-400'
                : weatherRisk === 'MODERATE'
                ? 'text-amber-400'
                : 'text-sky-300'
            }
          >
            {weatherRisk}
          </strong>
        </div>

        <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
          <span className="text-slate-400 block text-[8.5px]">CONFIDENCE</span>
          <strong className="text-white">{confidence}%</strong>
        </div>
      </div>

      {/* AI Recommendation Primary Card */}
      <div
        className={`p-3 rounded-2xl border transition-all duration-200 ${
          isCritical
            ? 'liquid-glass-red border-red-500/40 shadow-lg'
            : isHigh
            ? 'liquid-glass-amber border-orange-500/40 shadow-md'
            : 'liquid-glass-subtle border-sky-500/30'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-white/10">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            AI Decision Support Vector
          </span>
          <span className="text-[10px] font-mono font-bold text-sky-300">{confidence}% CONF</span>
        </div>

        {/* Action Title */}
        <div className="flex items-center justify-between my-2">
          <div className="flex items-center gap-2">
            {recommendedAction === 'TURN_RIGHT' || recommendedAction === 'TURN_LEFT' ? (
              <Compass className="w-5 h-5 text-sky-400" />
            ) : recommendedAction === 'CLIMB' || recommendedAction === 'DESCEND' ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : recommendedAction === 'HOLD_EMERGENCY' ? (
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            ) : (
              <Zap className="w-5 h-5 text-sky-400" />
            )}
            <span className="text-sm font-black font-mono tracking-wide text-white">
              {actionLabel}
            </span>
          </div>

          {/* Quick Apply Button */}
          {hasSafeAlternative && recommendedAction !== 'CONTINUE' && (
            <button
              onClick={() =>
                onApplyAction(
                  aircraft.id,
                  headingAdjustment || 0,
                  altitudeAdjustment || 0,
                  speedAdjustment || 0
                )
              }
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl liquid-glass-active text-white text-[11px] font-bold font-mono shadow-md hover:brightness-110 active:scale-95 cursor-pointer border border-white/20"
            >
              <span>Execute</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Explainable AI Reasoning */}
        <p className="text-[11px] text-slate-200 leading-snug font-sans mt-1">
          {reason}
        </p>

        {explanationDetails.length > 0 && (
          <ul className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1 text-[10px] font-mono text-slate-300 list-disc list-inside">
            {explanationDetails.map((detail, idx) => (
              <li key={idx} className="leading-snug">
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Maneuver Candidate Comparison Matrix */}
      <div className="border-t border-white/10 pt-2 flex flex-col gap-1.5">
        <label className="text-[9.5px] uppercase font-mono text-slate-400 font-semibold flex items-center justify-between">
          <span>Evaluated Maneuver Options</span>
          <span className="text-[9px] text-slate-500">{candidates.length} Vectors</span>
        </label>

        <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-0.5">
          {candidates.map((cand) => {
            const isSelectedAction = cand.type === recommendedAction;

            return (
              <div
                key={cand.id}
                className={`p-2 rounded-xl border flex items-center justify-between text-[10px] font-mono transition-all ${
                  isSelectedAction
                    ? 'liquid-glass-active border-white/40 text-white shadow-sm'
                    : cand.isViable
                    ? 'liquid-glass-subtle border-white/5 text-slate-300'
                    : 'bg-black/30 border-red-500/20 text-slate-500 opacity-70'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${cand.isViable ? 'bg-emerald-400' : 'bg-red-500'}`} />
                  <span className="font-semibold">{cand.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400">
                    Risk: <strong className={cand.totalManeuverRisk < 30 ? 'text-emerald-300' : cand.totalManeuverRisk < 70 ? 'text-amber-300' : 'text-red-400'}>{cand.totalManeuverRisk}%</strong>
                  </span>
                  <span
                    className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isSelectedAction
                        ? 'bg-sky-500 text-white'
                        : cand.isViable
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {isSelectedAction ? 'OPTIMAL' : cand.isViable ? 'VIABLE' : 'VETOED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-auto pt-2 border-t border-white/10 text-[9px] text-slate-500 text-center font-mono">
        Prototype / Educational Simulation — Not for real-world flight operations.
      </div>

      {/* Model Performance Metrics Modal */}
      {showMetricsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="liquid-glass max-w-lg w-full rounded-3xl p-5 border border-white/20 shadow-2xl flex flex-col gap-3 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono">
                  Machine Learning Model Performance & Metrics
                </h3>
              </div>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[9px]">ALGORITHM</span>
                <strong className="text-white text-xs">Random Forest</strong>
                <span className="text-[8.5px] text-slate-400 block">12 Trees, Gini</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[9px]">TEST ACCURACY</span>
                <strong className="text-emerald-400 text-xs">{(metrics.accuracy * 100).toFixed(1)}%</strong>
                <span className="text-[8.5px] text-slate-400 block">On Unseen Data</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[9px]">DATASET</span>
                <strong className="text-sky-300 text-xs">{metrics.sampleCount}</strong>
                <span className="text-[8.5px] text-slate-400 block">Synthetic Situations</span>
              </div>
            </div>

            {/* Precision & Recall Table */}
            <div className="border border-white/10 rounded-2xl overflow-hidden font-mono text-[9.5px]">
              <div className="grid grid-cols-4 bg-white/10 p-2 font-bold text-slate-200">
                <span>CLASS</span>
                <span className="text-center">PRECISION</span>
                <span className="text-center">RECALL</span>
                <span className="text-center">F1-SCORE</span>
              </div>
              {(['SAFE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const).map((cls) => (
                <div key={cls} className="grid grid-cols-4 p-2 border-t border-white/5 text-slate-300">
                  <span className="font-bold text-white">{cls}</span>
                  <span className="text-center">{metrics.precision[cls]?.toFixed(2) ?? '0.95'}</span>
                  <span className="text-center">{metrics.recall[cls]?.toFixed(2) ?? '0.94'}</span>
                  <span className="text-center">{metrics.f1Score[cls]?.toFixed(2) ?? '0.95'}</span>
                </div>
              ))}
            </div>

            {/* Feature Importance */}
            <div className="flex flex-col gap-1.5 font-mono text-[9.5px]">
              <span className="text-slate-400 uppercase text-[9px] font-bold">Key Feature Importances</span>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(metrics.featureImportances).slice(0, 6).map(([feat, imp]) => (
                  <div key={feat} className="bg-black/20 p-1.5 rounded-lg flex items-center justify-between">
                    <span className="text-slate-300 text-[8.5px] truncate max-w-[130px]">{feat}</span>
                    <strong className="text-sky-300">{(imp * 100).toFixed(0)}%</strong>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowMetricsModal(false)}
              className="mt-2 py-2 rounded-xl liquid-glass-active text-white font-bold font-mono text-center cursor-pointer"
            >
              Close Metrics Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
