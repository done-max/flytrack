import React, { useState } from 'react';
import type { Aircraft } from '../types/aircraft';
import type { AirspaceConflictSummary } from '../types/collision';
import type { WeatherSummary, WeatherZone } from '../types/weather';
import type { AIDecision } from '../types/ai';
import {
  Terminal,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';

interface DebugPanelProps {
  aircraftList: Aircraft[];
  conflictSummary: AirspaceConflictSummary;
  weatherSummary: WeatherSummary;
  weatherZones: WeatherZone[];
  selectedAIDecision: AIDecision | null;
  selectedAircraft: Aircraft | null;
  overallAirspaceRiskScore: number;
  simTimeSeconds: number;
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  aircraftList,
  conflictSummary,
  weatherSummary,
  selectedAIDecision,
  selectedAircraft: _selectedAircraft,
  overallAirspaceRiskScore,
  simTimeSeconds,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'kinematics' | 'stca' | 'weather' | 'ai_features'>('kinematics');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    const debugDump = {
      simTimeSeconds,
      overallAirspaceRiskScore,
      aircraftCount: aircraftList.length,
      aircraft: aircraftList.map((a) => ({
        id: a.id,
        callsign: a.callsign,
        x: Number(a.x.toFixed(2)),
        y: Number(a.y.toFixed(2)),
        vx: Number(a.velocity.vx.toFixed(2)),
        vy: Number(a.velocity.vy.toFixed(2)),
        altitude: a.altitude,
        speed: a.speed,
        heading: a.heading,
        status: a.status,
      })),
      conflicts: conflictSummary.conflicts.map((c) => ({
        pair: `${c.aircraftA.callsign}-${c.aircraftB.callsign}`,
        currentDist: c.currentDistance,
        cpaDist: c.predictedClosestDistance,
        timeToCpa: c.timeToClosestApproach,
        altDiff: c.altitudeDifference,
        risk: c.collisionRisk,
      })),
      weather: weatherSummary.zoneInteractions.map((w) => ({
        aircraft: w.aircraftCallsign,
        zone: w.zoneName,
        dist: w.distanceToZone,
        timeToEntry: w.timeToEntry,
        risk: w.weatherRisk,
      })),
      aiDecision: selectedAIDecision,
    };

    navigator.clipboard.writeText(JSON.stringify(debugDump, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-12 right-4 w-[620px] max-h-[480px] liquid-glass rounded-3xl p-4 shadow-2xl border border-sky-400/40 z-50 font-mono text-xs flex flex-col gap-3 animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Developer HUD & Numerical State Inspector
          </h3>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            LIVE T+{Math.round(simTimeSeconds)}s
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyJson}
            title="Copy Full Telemetry State JSON"
            className="flex items-center gap-1 px-2 py-1 rounded-xl liquid-glass-subtle text-slate-300 hover:text-white text-[10px] cursor-pointer border border-white/10 transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Dump JSON'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="liquid-glass-subtle p-1 rounded-full grid grid-cols-4 gap-1 text-[10px] border border-white/10">
        <button
          onClick={() => setActiveTab('kinematics')}
          className={`py-1 rounded-full font-bold cursor-pointer transition-all ${
            activeTab === 'kinematics' ? 'liquid-glass-active text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Kinematics ({aircraftList.length})
        </button>
        <button
          onClick={() => setActiveTab('stca')}
          className={`py-1 rounded-full font-bold cursor-pointer transition-all ${
            activeTab === 'stca' ? 'liquid-glass-active text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          STCA CPA ({conflictSummary.conflicts.length})
        </button>
        <button
          onClick={() => setActiveTab('weather')}
          className={`py-1 rounded-full font-bold cursor-pointer transition-all ${
            activeTab === 'weather' ? 'liquid-glass-active text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Weather WX ({weatherSummary.zoneInteractions.length})
        </button>
        <button
          onClick={() => setActiveTab('ai_features')}
          className={`py-1 rounded-full font-bold cursor-pointer transition-all ${
            activeTab === 'ai_features' ? 'liquid-glass-active text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          AI Vector ML
        </button>
      </div>

      {/* Tab 1: Aircraft Kinematics Table */}
      {activeTab === 'kinematics' && (
        <div className="overflow-y-auto max-h-[280px] custom-scrollbar pr-1 border border-white/10 rounded-2xl liquid-glass-subtle">
          <table className="w-full text-left text-[9.5px]">
            <thead className="bg-white/10 text-slate-300 font-bold sticky top-0">
              <tr>
                <th className="p-2">CALLSIGN</th>
                <th className="p-2">POS (X, Y)</th>
                <th className="p-2">VEL (Vx, Vy)</th>
                <th className="p-2">HDG</th>
                <th className="p-2">ALT (FL)</th>
                <th className="p-2">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {aircraftList.map((ac) => (
                <tr key={ac.id} className="hover:bg-white/5">
                  <td className="p-2 font-bold text-white">{ac.callsign}</td>
                  <td className="p-2 text-sky-300">{ac.x.toFixed(1)}, {ac.y.toFixed(1)}</td>
                  <td className="p-2 text-slate-300">{ac.velocity.vx.toFixed(1)}, {ac.velocity.vy.toFixed(1)}</td>
                  <td className="p-2 text-slate-300">{Math.round(ac.heading)}°</td>
                  <td className="p-2 text-slate-300">FL{Math.round(ac.altitude / 100)}</td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8.5px] ${
                        ac.status === 'CRITICAL'
                          ? 'bg-red-500/30 text-red-200'
                          : ac.status === 'HIGH_RISK'
                          ? 'bg-amber-500/30 text-amber-200'
                          : ac.status === 'CAUTION'
                          ? 'bg-yellow-500/20 text-yellow-200'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {ac.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: STCA CPA Conflict Table */}
      {activeTab === 'stca' && (
        <div className="overflow-y-auto max-h-[280px] custom-scrollbar pr-1 border border-white/10 rounded-2xl liquid-glass-subtle">
          {conflictSummary.conflicts.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-[10.5px]">
              No active STCA pairwise conflicts detected. Airspace is nominal.
            </div>
          ) : (
            <table className="w-full text-left text-[9.5px]">
              <thead className="bg-white/10 text-slate-300 font-bold sticky top-0">
                <tr>
                  <th className="p-2">PAIR</th>
                  <th className="p-2">CUR DIST</th>
                  <th className="p-2">PRED CPA</th>
                  <th className="p-2">T-CPA</th>
                  <th className="p-2">ALT Δ</th>
                  <th className="p-2">RISK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {conflictSummary.conflicts.map((c, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="p-2 font-bold text-white">
                      {c.aircraftA.callsign} ⚡ {c.aircraftB.callsign}
                    </td>
                    <td className="p-2 text-slate-300">{c.currentDistance.toFixed(1)} px</td>
                    <td className="p-2 text-red-300 font-bold">{c.predictedClosestDistance.toFixed(1)} px</td>
                    <td className="p-2 text-red-300 font-bold">{c.timeToClosestApproach}s</td>
                    <td className="p-2 text-slate-300">{c.altitudeDifference} ft</td>
                    <td className="p-2 font-bold text-red-400">{c.collisionRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Weather Telemetry Table */}
      {activeTab === 'weather' && (
        <div className="overflow-y-auto max-h-[280px] custom-scrollbar pr-1 border border-white/10 rounded-2xl liquid-glass-subtle">
          {weatherSummary.zoneInteractions.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-[10.5px]">
              No active aircraft exposure inside or approaching weather hazard cells.
            </div>
          ) : (
            <table className="w-full text-left text-[9.5px]">
              <thead className="bg-white/10 text-slate-300 font-bold sticky top-0">
                <tr>
                  <th className="p-2">TARGET</th>
                  <th className="p-2">CELL</th>
                  <th className="p-2">TYPE</th>
                  <th className="p-2">DIST</th>
                  <th className="p-2">T-ENTRY</th>
                  <th className="p-2">RISK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {weatherSummary.zoneInteractions.map((w, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="p-2 font-bold text-white">{w.aircraftCallsign}</td>
                    <td className="p-2 text-slate-300">{w.zoneName}</td>
                    <td className="p-2 text-slate-400">{w.zoneType}</td>
                    <td className="p-2 text-slate-300">{w.distanceToZone} px</td>
                    <td className="p-2 text-amber-300 font-bold">
                      {w.currentExposure ? 'INSIDE' : `${w.timeToEntry}s`}
                    </td>
                    <td className="p-2 font-bold text-amber-400">{w.weatherRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: AI Feature Vector & Output */}
      {activeTab === 'ai_features' && (
        <div className="overflow-y-auto max-h-[280px] custom-scrollbar pr-1 flex flex-col gap-2">
          {selectedAIDecision ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="liquid-glass-subtle p-2 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[8.5px] uppercase">AI Risk Score</span>
                  <strong className="text-sm font-bold text-sky-300">{selectedAIDecision.aiRiskScore}/100</strong>
                </div>
                <div className="liquid-glass-subtle p-2 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[8.5px] uppercase">Category</span>
                  <strong className="text-sm font-bold text-amber-300">{selectedAIDecision.aiRiskCategory}</strong>
                </div>
                <div className="liquid-glass-subtle p-2 rounded-xl border border-white/10">
                  <span className="text-slate-400 block text-[8.5px] uppercase">Recommendation</span>
                  <strong className="text-sm font-bold text-emerald-300">{selectedAIDecision.actionLabel}</strong>
                </div>
              </div>

              {selectedAIDecision.featureVector && (
                <div className="liquid-glass-subtle p-2.5 rounded-xl border border-white/10 text-[9px] flex flex-col gap-1">
                  <span className="font-bold text-slate-400 uppercase text-[8.5px]">Input Features to Random Forest:</span>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                    <div>• Current Separation: <strong className="text-white">{selectedAIDecision.featureVector.currentSeparationDistance.toFixed(1)} px</strong></div>
                    <div>• Predicted CPA: <strong className="text-white">{selectedAIDecision.featureVector.predictedClosestSeparation.toFixed(1)} px</strong></div>
                    <div>• Time to CPA: <strong className="text-white">{selectedAIDecision.featureVector.timeToClosestApproach}s</strong></div>
                    <div>• Altitude Diff: <strong className="text-white">{selectedAIDecision.featureVector.altitudeDifference} ft</strong></div>
                    <div>• Relative Speed: <strong className="text-white">{selectedAIDecision.featureVector.relativeSpeed.toFixed(1)} kts</strong></div>
                    <div>• Heading Diff: <strong className="text-white">{selectedAIDecision.featureVector.headingDifference.toFixed(1)}°</strong></div>
                    <div>• Weather Severity: <strong className="text-white">{selectedAIDecision.featureVector.weatherSeverity}</strong></div>
                    <div>• Dist to Weather: <strong className="text-white">{selectedAIDecision.featureVector.distanceToWeather} px</strong></div>
                    <div>• Traffic Density: <strong className="text-white">{selectedAIDecision.featureVector.trafficDensity} ac</strong></div>
                    <div>• Restricted Dist: <strong className="text-white">{selectedAIDecision.featureVector.restrictedProximity} px</strong></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-[10.5px]">
              Hook an aircraft target on the radar scope to view its real-time ML feature vector and inference outputs.
            </div>
          )}
        </div>
      )}
    </div>
  );
};