import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from './simulation/simulationEngine';
import { SCENARIOS } from './simulation/scenarios';
import type { Aircraft, ScenarioDefinition, SimulationSettings } from './types/aircraft';
import { TopNav } from './components/TopNav';
import { Airspace } from './components/Airspace';
import { ControlPanel } from './components/ControlPanel';
import { AircraftInfo } from './components/AircraftInfo';
import { FlightStripBoard } from './components/FlightStripBoard';
import { AddAircraftModal } from './components/AddAircraftModal';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const App: React.FC = () => {
  // Scenario 2: Potential Collision by default to demonstrate predictive trajectory crossing
  const defaultScenario = SCENARIOS.scenario_collision;
  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition>(defaultScenario);

  const engineRef = useRef<SimulationEngine | null>(null);

  const [aircraftList, setAircraftList] = useState<Aircraft[]>(defaultScenario.aircraft);
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(0);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

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

    const unsubscribe = engine.subscribe((newAircraft, time) => {
      setAircraftList(newAircraft);
      setSimTimeSeconds(time);
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
  }, []);

  const handleRemoveAircraft = useCallback((id: string) => {
    if (!engineRef.current) return;
    engineRef.current.removeAircraft(id);
    setSelectedAircraftId((prev) => (prev === id ? null : prev));
  }, []);

  const selectedAircraft = aircraftList.find((ac) => ac.id === selectedAircraftId) || null;

  const bounds = engineRef.current ? engineRef.current.getBounds() : {
    width: 1000,
    height: 750,
    minX: 0,
    maxX: 1000,
    minY: 0,
    maxY: 750,
  };

  const criticalCount = aircraftList.filter((a) => a.status === 'CRITICAL').length;
  const cautionCount = aircraftList.filter((a) => a.status === 'CAUTION' || a.status === 'HIGH_RISK').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-slate-200 overflow-hidden font-mono select-none">
      {/* Top Operations Header in Black & Green */}
      <TopNav
        isRunning={settings.isRunning}
        simSpeed={settings.simSpeed}
        simTimeSeconds={simTimeSeconds}
        aircraftCount={aircraftList.length}
        activeScenarioName={activeScenario.name}
        onTogglePlayPause={handleTogglePlayPause}
      />

      {/* Main Tactical Workstation Deck */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* Left Side: Master Console & Strip Rack */}
        <div className="w-80 flex flex-col gap-2 overflow-y-auto shrink-0 pr-0.5">
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
            onSelectAircraft={(ac) => setSelectedAircraftId(ac.id)}
          />
        </div>

        {/* Center: Primary Radar Airspace Scope */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <Airspace
            aircraft={aircraftList}
            selectedAircraftId={selectedAircraftId}
            settings={settings}
            bounds={bounds}
            onSelectAircraft={handleSelectAircraft}
          />

          {/* Bottom Tactical Separation Safety Bar */}
          <div className="mt-1.5 bg-[#040704] border border-[#14532d] px-3 py-1.5 rounded-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="text-green-500 font-bold text-[10px]">
                STCA SEPARATION SAFETY STATUS:
              </span>

              {criticalCount > 0 ? (
                <span className="flex items-center gap-1.5 text-red-300 font-bold bg-[#1a0505] px-2 py-0.5 rounded-xs border border-red-500 text-[11px] animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  STCA CONFLICT WARNING — LATERAL / VERTICAL LOSS OF SEPARATION
                </span>
              ) : cautionCount > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-300 font-semibold bg-[#1a1405] px-2 py-0.5 rounded-xs border border-amber-500 text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  CONVERGING FLIGHT VECTORS — MONITORING SEPARATION
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-green-400 font-semibold bg-[#051805] px-2 py-0.5 rounded-xs border border-green-600 text-[11px]">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  AIRWAYS NOMINAL — STANDARD 5 NM / 1,000 FT SEPARATION MAINTAINED
                </span>
              )}
            </div>

            {/* Tactical Status Legend (Green / Amber / Red / Blue) */}
            <div className="hidden xl:flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-[#22c55e] inline-block"></span>
                <span className="text-green-400">NOMINAL</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-amber-400 inline-block"></span>
                <span className="text-amber-400">CAUTION</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-red-500 inline-block"></span>
                <span className="text-red-400">STCA ALERT</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-[#38bdf8] inline-block"></span>
                <span className="text-blue-400">HOOKED TARGET</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Target Inspector & Vector Clearance Editor */}
        <div className="w-84 flex flex-col gap-2 overflow-y-auto shrink-0 pl-0.5">
          <AircraftInfo
            aircraft={selectedAircraft}
            onUpdateAircraft={handleUpdateAircraftDirect}
            onDeselect={() => setSelectedAircraftId(null)}
            onRemoveAircraft={handleRemoveAircraft}
          />
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
