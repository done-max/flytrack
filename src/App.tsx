import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from './simulation/simulationEngine';
import { SCENARIOS } from './simulation/scenarios';
import type { Aircraft, ScenarioDefinition, SimulationSettings } from './types/aircraft';
import type { AirspaceConflictSummary, CollisionEvent } from './types/collision';
import { TopNav } from './components/TopNav';
import { Airspace } from './components/Airspace';
import { ControlPanel } from './components/ControlPanel';
import { AircraftInfo } from './components/AircraftInfo';
import { FlightStripBoard } from './components/FlightStripBoard';
import { AddAircraftModal } from './components/AddAircraftModal';
import { CollisionRiskMonitor } from './components/CollisionRiskMonitor';
import { EventLog } from './components/EventLog';
import {
  AlertTriangle,
  CheckCircle,
  Sliders,
  ShieldAlert,
  History,
} from 'lucide-react';

export const App: React.FC = () => {
  // Scenario 2: Predicted Conflict by default to demonstrate real-time predictive trajectory crossing
  const defaultScenario = SCENARIOS.scenario_conflict || SCENARIOS.scenario_safe;
  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition>(defaultScenario);

  const engineRef = useRef<SimulationEngine | null>(null);

  const [aircraftList, setAircraftList] = useState<Aircraft[]>(defaultScenario.aircraft);
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(0);
  const [conflictSummary, setConflictSummary] = useState<AirspaceConflictSummary>({
    totalPairsChecked: 0,
    activeConflictsCount: 0,
    criticalCount: 0,
    highRiskCount: 0,
    warningCount: 0,
    highestRiskLevel: 'SAFE',
    conflicts: [],
  });

  const [events, setEvents] = useState<CollisionEvent[]>([]);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'risk_monitor' | 'event_log'>('risk_monitor');

  const [settings, setSettings] = useState<SimulationSettings>({
    isRunning: true,
    simSpeed: 1,
    simTimeSeconds: 0,
    showTrails: true,
    showTrajectories: true,
    showLabels: true,
    showRangeRings: true,
    showSectorGrid: true,
    radarSweep: true,
    trajectoryPredictionSeconds: 60,
    maxTrailPoints: 40,
  });

  useEffect(() => {
    const engine = new SimulationEngine(defaultScenario.aircraft);
    engineRef.current = engine;

    const unsubscribe = engine.subscribe((newAircraft, time, summary, newEvents) => {
      setAircraftList(newAircraft);
      setSimTimeSeconds(time);
      setConflictSummary(summary);
      setEvents(newEvents);
      setSettings(engine.getSettings());
    });

    engine.start();

    return () => {
      unsubscribe();
      engine.destroy();
    };
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    if (!engineRef.current) return;
    const running = engineRef.current.togglePlayPause();
    setSettings((prev) => ({ ...prev, isRunning: running }));
  }, []);

  const handleStepManual = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stepManual(0.5);
  }, []);

  const handleReset = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset(activeScenario.aircraft);
    setSelectedAircraftId(null);
  }, [activeScenario]);

  const handleSetSpeed = useCallback((speed: number) => {
    if (!engineRef.current) return;
    engineRef.current.setSpeed(speed);
    setSettings((prev) => ({ ...prev, simSpeed: speed }));
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<SimulationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const handleSelectScenario = useCallback((scenario: ScenarioDefinition) => {
    setActiveScenario(scenario);
    if (engineRef.current) {
      engineRef.current.reset(scenario.aircraft);
    }
    setSelectedAircraftId(null);
  }, []);

  const handleSelectAircraft = useCallback((aircraft: Aircraft | null) => {
    setSelectedAircraftId(aircraft ? aircraft.id : null);
    if (aircraft) {
      setRightPanelTab('inspector');
    }
  }, []);

  const handleUpdateAircraftDirect = useCallback(
    (id: string, updates: Partial<Aircraft>) => {
      if (!engineRef.current) return;
      engineRef.current.updateAircraftDirect(id, updates);
    },
    []
  );

  const handleAddAircraft = useCallback((newAircraft: Aircraft) => {
    if (!engineRef.current) return;
    engineRef.current.addAircraft(newAircraft);
    setSelectedAircraftId(newAircraft.id);
    setRightPanelTab('inspector');
  }, []);

  const handleRemoveAircraft = useCallback((id: string) => {
    if (!engineRef.current) return;
    engineRef.current.removeAircraft(id);
    setSelectedAircraftId((prev) => (prev === id ? null : prev));
  }, []);

  const handleClearEvents = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.clearEvents();
  }, []);

  const selectedAircraft = aircraftList.find((ac) => ac.id === selectedAircraftId) || null;
  const activeConflictForSelected = selectedAircraft
    ? conflictSummary.conflicts.find(
        (c) => c.aircraftA.id === selectedAircraft.id || c.aircraftB.id === selectedAircraft.id
      ) || null
    : null;

  const bounds = engineRef.current
    ? engineRef.current.getBounds()
    : {
        width: 1000,
        height: 750,
        minX: 0,
        maxX: 1000,
        minY: 0,
        maxY: 750,
      };

  const criticalConflicts = conflictSummary.conflicts.filter((c) => c.collisionRisk === 'CRITICAL');
  const warningConflicts = conflictSummary.conflicts.filter(
    (c) => c.collisionRisk === 'HIGH_RISK' || c.collisionRisk === 'WARNING'
  );

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#07090e] text-slate-200 overflow-hidden font-sans select-none">
      {/* Background Liquid Ambient Light Orbs (Deep Sapphire, Ice Frost & Violet) */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 rounded-full bg-sky-600/12 blur-[140px] pointer-events-none liquid-orb-1" />
      <div className="absolute bottom-1/4 right-1/5 w-[32rem] h-[32rem] rounded-full bg-indigo-600/10 blur-[160px] pointer-events-none liquid-orb-2" />
      <div className="absolute top-2/3 left-1/3 w-80 h-80 rounded-full bg-cyan-500/8 blur-[130px] pointer-events-none" />

      {/* Top Operations Header Floating Glass Pill */}
      <TopNav
        isRunning={settings.isRunning}
        simSpeed={settings.simSpeed}
        simTimeSeconds={simTimeSeconds}
        aircraftCount={aircraftList.length}
        activeScenarioName={activeScenario.name}
        onTogglePlayPause={handleTogglePlayPause}
      />

      {/* Main Tactical Workstation Deck */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Left Side: Master Console & Strip Rack */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto shrink-0 pr-0.5 z-10">
          <ControlPanel
            settings={settings}
            activeScenarioId={activeScenario.id}
            onTogglePlayPause={handleTogglePlayPause}
            onStepManual={handleStepManual}
            onReset={handleReset}
            onSetSpeed={handleSetSpeed}
            onUpdateSettings={handleUpdateSettings}
            onSelectScenario={handleSelectScenario}
            onOpenAddAircraftModal={() => setIsAddModalOpen(true)}
          />

          <FlightStripBoard
            aircraft={aircraftList}
            selectedAircraftId={selectedAircraftId}
            onSelectAircraft={(ac) => handleSelectAircraft(ac)}
          />
        </div>

        {/* Center: Primary Radar Airspace Scope */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
          <Airspace
            aircraft={aircraftList}
            conflicts={conflictSummary.conflicts}
            selectedAircraftId={selectedAircraftId}
            settings={settings}
            bounds={bounds}
            onSelectAircraft={handleSelectAircraft}
          />

          {/* Bottom Tactical Separation Safety Bar (Floating Liquid Glass Pill) */}
          <div className="mt-2 liquid-glass px-4 py-2 rounded-2xl flex items-center justify-between text-xs shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold text-[10px] font-mono tracking-wider">
                STCA SEPARATION SAFETY STATUS:
              </span>

              {criticalConflicts.length > 0 ? (
                <span className="flex items-center gap-1.5 text-red-100 font-bold liquid-glass-red px-3 py-1 rounded-xl text-[11px] font-mono animate-pulse shadow-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  STCA ALERT: {criticalConflicts[0].aircraftA.callsign} ⚡{' '}
                  {criticalConflicts[0].aircraftB.callsign} — LOSS OF SEPARATION IN{' '}
                  {criticalConflicts[0].timeToClosestApproach}s
                </span>
              ) : warningConflicts.length > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-100 font-semibold liquid-glass-amber px-3 py-1 rounded-xl text-[11px] font-mono shadow-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  CONVERGING TRAFFIC: {warningConflicts[0].aircraftA.callsign} &{' '}
                  {warningConflicts[0].aircraftB.callsign} — CPA {warningConflicts[0].predictedClosestDistance}PX IN{' '}
                  {warningConflicts[0].timeToClosestApproach}s
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-200 font-semibold liquid-glass-subtle px-3 py-1 rounded-xl text-[11px] font-mono shadow-sm border border-white/10">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  AIRWAYS NOMINAL — STANDARD 5 NM / 1,000 FT SEPARATION MAINTAINED ({conflictSummary.totalPairsChecked} PAIRS MONITORED)
                </span>
              )}
            </div>

            {/* Tactical Status Legend (Translucent Glass Indicators) */}
            <div className="hidden xl:flex items-center gap-3.5 text-[10px] text-slate-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] inline-block"></span>
                <span className="text-slate-300 font-medium">NOMINAL</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] inline-block"></span>
                <span className="text-amber-300 font-medium">CAUTION</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] inline-block"></span>
                <span className="text-red-300 font-medium">STCA ALERT</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] inline-block"></span>
                <span className="text-white font-medium">HOOKED</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Multi-Panel Tactical Deck (Inspector / Collision Risk Monitor / Event Log) */}
        <div className="w-88 flex flex-col gap-2.5 overflow-y-auto shrink-0 pl-0.5 z-10">
          {/* iOS Liquid Glass Segmented Tab Switcher */}
          <div className="liquid-glass-subtle p-1 rounded-2xl grid grid-cols-3 gap-1 border border-white/10 shadow-lg">
            <button
              onClick={() => setRightPanelTab('risk_monitor')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'risk_monitor'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Risk Matrix</span>
              {conflictSummary.conflicts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[9px] font-bold animate-pulse">
                  {conflictSummary.conflicts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setRightPanelTab('inspector')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'inspector'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Inspector</span>
            </button>

            <button
              onClick={() => setRightPanelTab('event_log')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'event_log'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audit Log</span>
              {events.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/15 text-white font-mono text-[9px]">
                  {events.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content Display */}
          {rightPanelTab === 'risk_monitor' && (
            <CollisionRiskMonitor
              conflictSummary={conflictSummary}
              aircraftList={aircraftList}
              selectedAircraftId={selectedAircraftId}
              onSelectAircraft={(ac) => handleSelectAircraft(ac)}
            />
          )}

          {rightPanelTab === 'inspector' && (
            <AircraftInfo
              aircraft={selectedAircraft}
              activeConflict={activeConflictForSelected}
              onUpdateAircraft={handleUpdateAircraftDirect}
              onDeselect={() => setSelectedAircraftId(null)}
              onRemoveAircraft={handleRemoveAircraft}
            />
          )}

          {rightPanelTab === 'event_log' && (
            <EventLog
              events={events}
              onClearEvents={handleClearEvents}
            />
          )}
        </div>
      </div>

      {/* Target Injection Modal */}
      <AddAircraftModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddAircraft={handleAddAircraft}
      />
    </div>
  );
};

export default App;
