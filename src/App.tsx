import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from './simulation/simulationEngine';
import { SCENARIOS } from './simulation/scenarios';
import type { Aircraft, ScenarioDefinition, SimulationSettings } from './types/aircraft';
import type { AirspaceConflictSummary, CollisionEvent } from './types/collision';
import type { WeatherEvent, WeatherSummary, WeatherZone } from './types/weather';
import type { DynamicAirspaceSector, RestrictedZone, UnifiedAircraftSafety, AirspaceSectorData, AirspaceOverviewSummary } from './types/safety';
import { TopNav } from './components/TopNav';
import { Airspace } from './components/Airspace';
import { ControlPanel } from './components/ControlPanel';
import { AircraftInfo } from './components/AircraftInfo';
import { FlightStripBoard } from './components/FlightStripBoard';
import { AddAircraftModal } from './components/AddAircraftModal';
import { CollisionRiskMonitor } from './components/CollisionRiskMonitor';
import { WeatherAnalyzer } from './components/WeatherAnalyzer';
import { AIDecisionCenter } from './components/AIDecisionCenter';
import { AirspaceOverview } from './components/AirspaceOverview';
import { EventLog } from './components/EventLog';
import { generateAIDecision } from './ai/decisionEngine';
import { globalAIRiskModel } from './ai/model';
import {
  AlertTriangle,
  CheckCircle,
  Sliders,
  ShieldAlert,
  History,
  CloudLightning,
  Brain,
  Globe,
} from 'lucide-react';

export const App: React.FC = () => {
  // Phase 5 Dense Airspace Fleet by default
  const defaultScenario =
    SCENARIOS.scenario_phase5_dense_airspace ||
    SCENARIOS.scenario_weather_storm_ahead ||
    SCENARIOS.scenario_safe;
  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition>(defaultScenario);

  const engineRef = useRef<SimulationEngine | null>(null);

  const [aircraftList, setAircraftList] = useState<Aircraft[]>(defaultScenario.aircraft);
  const [weatherZones, setWeatherZones] = useState<WeatherZone[]>(defaultScenario.weatherZones || []);
  const [restrictedZones, setRestrictedZones] = useState<RestrictedZone[]>(defaultScenario.restrictedZones || []);
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

  const [weatherSummary, setWeatherSummary] = useState<WeatherSummary>({
    totalZones: 0,
    activeZones: 0,
    stormCount: 0,
    highRiskZonesCount: 0,
    affectedAircraftCount: 0,
    highestWeatherRisk: 'SAFE',
    zoneInteractions: [],
  });

  const [unifiedSafetyMap, setUnifiedSafetyMap] = useState<Map<string, UnifiedAircraftSafety>>(
    new Map()
  );
  const [dynamicAirspaceSectors, setDynamicAirspaceSectors] = useState<DynamicAirspaceSector[]>([]);
  const [airspaceSectors, setAirspaceSectors] = useState<AirspaceSectorData[]>([]);
  const [airspaceOverview, setAirspaceOverview] = useState<AirspaceOverviewSummary>({
    activeAircraftCount: 0,
    activeConflictsCount: 0,
    weatherWarningsCount: 0,
    restrictedZonesCount: 0,
    overallAirspaceRiskScore: 0,
    overallAirspaceRiskLevel: 'SAFE',
    trafficDensityRating: 'LOW',
    sectors: [],
  });
  const [collisionEvents, setCollisionEvents] = useState<CollisionEvent[]>([]);
  const [weatherEvents, setWeatherEvents] = useState<WeatherEvent[]>([]);

  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [rightPanelTab, setRightPanelTab] = useState<
    'overview' | 'ai_decision' | 'weather' | 'risk_monitor' | 'inspector' | 'event_log'
  >('overview');

  const [settings, setSettings] = useState<SimulationSettings>({
    isRunning: true,
    simSpeed: 1,
    simTimeSeconds: 0,
    showTrails: true,
    showTrajectories: true,
    showLabels: true,
    showRangeRings: true,
    showSectorGrid: true,
    showWeatherOverlay: true,
    showAirspaceSafetyGrid: false,
    showWaypoints: true,
    radarSweep: true,
    trajectoryPredictionSeconds: 60,
    maxTrailPoints: 40,
  });

  useEffect(() => {
    const engine = new SimulationEngine(
      defaultScenario.aircraft,
      defaultScenario.weatherZones || [],
      defaultScenario.restrictedZones || []
    );
    engineRef.current = engine;

    const unsubscribe = engine.subscribe(
      (
        newAircraft,
        time,
        summary,
        cEvents,
        wSummary,
        uSafetyMap,
        sectors,
        wEvents,
        atcSectors,
        overview
      ) => {
        setAircraftList(newAircraft);
        setSimTimeSeconds(time);
        setConflictSummary(summary);
        setCollisionEvents(cEvents);
        setWeatherSummary(wSummary);
        setUnifiedSafetyMap(uSafetyMap);
        setDynamicAirspaceSectors(sectors);
        setWeatherEvents(wEvents);
        if (atcSectors) setAirspaceSectors(atcSectors);
        if (overview) setAirspaceOverview(overview);
        setWeatherZones(engine.getWeatherZones());
        setRestrictedZones(engine.getRestrictedZones());
        setSettings(engine.getSettings());
      }
    );

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
    engineRef.current.reset(
      activeScenario.aircraft,
      activeScenario.weatherZones || [],
      activeScenario.restrictedZones || []
    );
    setSelectedAircraftId(null);
    setSelectedZoneId(null);
  }, [activeScenario]);

  const handleSetSpeed = useCallback((speed: number) => {
    if (!engineRef.current) return;
    engineRef.current.setSpeed(speed);
    setSettings((prev) => ({ ...prev, simSpeed: speed }));
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<SimulationSettings>) => {
    if (!engineRef.current) return;
    engineRef.current.updateSettings(newSettings);
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const handleSelectScenario = useCallback((scenario: ScenarioDefinition) => {
    setActiveScenario(scenario);
    if (engineRef.current) {
      engineRef.current.reset(
        scenario.aircraft,
        scenario.weatherZones || [],
        scenario.restrictedZones || []
      );
    }
    setSelectedAircraftId(null);
    setSelectedZoneId(null);
    if (scenario.weatherZones && scenario.weatherZones.length > 0) {
      setRightPanelTab('weather');
    } else {
      setRightPanelTab('risk_monitor');
    }
  }, []);

  const handleSelectAircraft = useCallback((aircraft: Aircraft | null) => {
    setSelectedAircraftId(aircraft ? aircraft.id : null);
    if (aircraft) {
      setRightPanelTab('inspector');
    }
  }, []);

  const handleSelectZone = useCallback((zone: WeatherZone) => {
    setSelectedZoneId(zone.id);
    setRightPanelTab('weather');
  }, []);

  const handleToggleZone = useCallback((zoneId: string, isActive?: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.toggleWeatherZone(zoneId, isActive);
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

  const handleApplyAIAction = useCallback(
    (aircraftId: string, headingDelta: number, altDelta: number, speedDelta: number) => {
      if (!engineRef.current) return;
      const target = aircraftList.find((a) => a.id === aircraftId);
      if (!target) return;

      let newHeading = (target.heading + headingDelta) % 360;
      if (newHeading < 0) newHeading += 360;

      const newAltitude = Math.max(10000, Math.min(45000, target.altitude + altDelta));
      const newSpeed = Math.max(250, Math.min(850, target.speed + speedDelta));

      engineRef.current.updateAircraftDirect(aircraftId, {
        heading: newHeading,
        altitude: newAltitude,
        targetAltitude: newAltitude,
        speed: newSpeed,
      });
    },
    [aircraftList]
  );

  const selectedAircraft = aircraftList.find((ac) => ac.id === selectedAircraftId) || null;
  const activeConflictForSelected = selectedAircraft
    ? conflictSummary.conflicts.find(
        (c) => c.aircraftA.id === selectedAircraft.id || c.aircraftB.id === selectedAircraft.id
      ) || null
    : null;
  const unifiedSafetyForSelected = selectedAircraft
    ? unifiedSafetyMap.get(selectedAircraft.id) || null
    : null;

  const selectedAIDecision = selectedAircraft
    ? generateAIDecision(
        selectedAircraft,
        aircraftList,
        conflictSummary.conflicts,
        weatherSummary.zoneInteractions,
        weatherZones,
        restrictedZones
      )
    : null;

  const mlMetrics = globalAIRiskModel.getMetrics();

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

  const criticalWeather = weatherSummary.zoneInteractions.filter(
    (i) => i.weatherRisk === 'CRITICAL' || i.weatherRisk === 'HIGH'
  );

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#050811] text-slate-100 overflow-hidden font-sans select-none">
      {/* Soft Apple Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/5 w-[30rem] h-[30rem] rounded-full bg-sky-600/10 blur-[150px] pointer-events-none liquid-orb-1" />
      <div className="absolute bottom-1/4 right-1/4 w-[34rem] h-[34rem] rounded-full bg-indigo-600/8 blur-[170px] pointer-events-none liquid-orb-2" />
      <div className="absolute top-2/3 left-1/3 w-80 h-80 rounded-full bg-cyan-500/6 blur-[140px] pointer-events-none" />

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
      <div className="flex-1 flex overflow-hidden px-3 pb-3 pt-1 gap-3">
        {/* Left Side: Master Console & Strip Rack */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto shrink-0 pr-0.5 z-10 custom-scrollbar">
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
            weatherZones={weatherZones}
            weatherInteractions={weatherSummary.zoneInteractions}
            dynamicAirspaceSectors={dynamicAirspaceSectors}
            restrictedZones={restrictedZones}
            selectedAircraftId={selectedAircraftId}
            selectedZoneId={selectedZoneId}
            settings={settings}
            bounds={bounds}
            onSelectAircraft={handleSelectAircraft}
            onSelectZone={handleSelectZone}
          />

          {/* Bottom Tactical Separation & Atmospheric Safety Bar (Floating Glass Pill) */}
          <div className="mt-2 liquid-glass px-4 py-2 rounded-full flex items-center justify-between text-xs shadow-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold text-[9.5px] font-mono tracking-wider">
                SAFETY STATUS:
              </span>

              {criticalConflicts.length > 0 ? (
                <span className="flex items-center gap-1.5 text-red-100 font-bold liquid-glass-red px-3.5 py-1 rounded-full text-[11px] font-mono animate-pulse shadow-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  STCA ALERT: {criticalConflicts[0].aircraftA.callsign} ⚡{' '}
                  {criticalConflicts[0].aircraftB.callsign} — LOSS OF SEPARATION IN{' '}
                  {criticalConflicts[0].timeToClosestApproach}s
                </span>
              ) : criticalWeather.length > 0 ? (
                <span className="flex items-center gap-1.5 text-red-100 font-bold liquid-glass-red px-3.5 py-1 rounded-full text-[11px] font-mono animate-pulse shadow-lg">
                  <CloudLightning className="w-3.5 h-3.5 text-red-400" />
                  WEATHER HAZARD: {criticalWeather[0].aircraftCallsign} ⚡{' '}
                  {criticalWeather[0].zoneName} (
                  {criticalWeather[0].currentExposure
                    ? 'INSIDE CELL'
                    : `ENTRY IN ${criticalWeather[0].timeToEntry}s`}
                  )
                </span>
              ) : warningConflicts.length > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-100 font-semibold liquid-glass-amber px-3.5 py-1 rounded-full text-[11px] font-mono shadow-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  CONVERGING TRAFFIC: {warningConflicts[0].aircraftA.callsign} &{' '}
                  {warningConflicts[0].aircraftB.callsign} — CPA {warningConflicts[0].predictedClosestDistance}PX IN{' '}
                  {warningConflicts[0].timeToClosestApproach}s
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-200 font-semibold liquid-glass-subtle px-3.5 py-1 rounded-full text-[11px] font-mono shadow-sm border border-white/10">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  AIRWAYS & METEOROLOGY NOMINAL — {conflictSummary.totalPairsChecked} PAIRS & {weatherZones.length} HAZARDS MONITORED
                </span>
              )}
            </div>

            {/* Tactical Status Legend */}
            <div className="hidden xl:flex items-center gap-3.5 text-[10px] text-slate-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] inline-block"></span>
                <span className="text-slate-300 font-medium">SAFE</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] inline-block"></span>
                <span className="text-amber-300 font-medium">CAUTION</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] inline-block"></span>
                <span className="text-orange-300 font-medium">HIGH RISK</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] inline-block"></span>
                <span className="text-red-300 font-medium">DANGER</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Multi-Panel Tactical Deck (Overview / AI / Weather / STCA / Inspector / Audit) */}
        <div className="w-96 flex flex-col gap-2.5 overflow-y-auto shrink-0 pl-0.5 z-10 custom-scrollbar">
          {/* iOS Liquid Glass Segmented 6-Tab Switcher (Pill Capsule) */}
          <div className="liquid-glass-subtle p-1 rounded-full grid grid-cols-6 gap-1 border border-white/10 shadow-lg">
            <button
              onClick={() => setRightPanelTab('overview')}
              className={`flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-full text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'overview'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Sectors</span>
            </button>

            <button
              onClick={() => setRightPanelTab('ai_decision')}
              className={`flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-full text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'ai_decision'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-sky-400" />
              <span>AI</span>
              {selectedAIDecision && selectedAIDecision.aiRiskCategory === 'CRITICAL' && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setRightPanelTab('weather')}
              className={`flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-full text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'weather'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5 text-indigo-400" />
              <span>WX</span>
              {weatherSummary.stormCount > 0 && (
                <span className="px-1 py-0.2 rounded-full bg-red-500 text-white font-mono text-[8px] font-bold">
                  {weatherSummary.stormCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setRightPanelTab('risk_monitor')}
              className={`flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-full text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'risk_monitor'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>STCA</span>
              {conflictSummary.conflicts.length > 0 && (
                <span className="px-1 py-0.2 rounded-full bg-red-500 text-white font-mono text-[8px] font-bold animate-pulse">
                  {conflictSummary.conflicts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setRightPanelTab('inspector')}
              className={`flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-full text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'inspector'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Unit</span>
            </button>

            <button
              onClick={() => setRightPanelTab('event_log')}
              className={`flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-full text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                rightPanelTab === 'event_log'
                  ? 'liquid-glass-active text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audit</span>
              {collisionEvents.length + weatherEvents.length > 0 && (
                <span className="px-1 py-0.2 rounded-full bg-white/15 text-white font-mono text-[8px]">
                  {collisionEvents.length + weatherEvents.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content Display */}
          {rightPanelTab === 'overview' && (
            <AirspaceOverview
              overview={airspaceOverview}
              sectors={airspaceSectors}
              aircraft={aircraftList}
              conflicts={conflictSummary.conflicts}
              weatherSummary={weatherSummary}
              weatherZones={weatherZones}
              restrictedZones={restrictedZones}
              selectedAircraftId={selectedAircraftId}
              onSelectAircraft={(ac) => handleSelectAircraft(ac)}
            />
          )}

          {rightPanelTab === 'ai_decision' && (
            <AIDecisionCenter
              aircraft={selectedAircraft}
              decision={selectedAIDecision}
              metrics={mlMetrics}
              onApplyAction={handleApplyAIAction}
              onSelectAircraft={(ac) => handleSelectAircraft(ac)}
              allAircraft={aircraftList}
            />
          )}

          {rightPanelTab === 'weather' && (
            <WeatherAnalyzer
              weatherSummary={weatherSummary}
              weatherZones={weatherZones}
              aircraftList={aircraftList}
              onToggleZone={handleToggleZone}
              onSelectAircraft={(ac) => handleSelectAircraft(ac)}
            />
          )}

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
              unifiedSafety={unifiedSafetyForSelected}
              onUpdateAircraft={handleUpdateAircraftDirect}
              onDeselect={() => setSelectedAircraftId(null)}
              onRemoveAircraft={handleRemoveAircraft}
            />
          )}

          {rightPanelTab === 'event_log' && (
            <EventLog
              collisionEvents={collisionEvents}
              weatherEvents={weatherEvents}
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
