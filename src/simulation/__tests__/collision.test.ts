import { describe, it, expect } from 'vitest';
import {
  predictPairwiseCollision,
  detectAirspaceCollisions,
  deriveAircraftStatusMap,
  DEFAULT_COLLISION_THRESHOLDS,
} from '../collision';
import { createAircraft } from '../aircraft';
import { SCENARIOS } from '../scenarios';
import { SimulationEngine } from '../simulationEngine';

describe('Deterministic Airspace Test Scenarios (1 to 5)', () => {
  it('Scenario 1: Safe Flight - verifies standard lateral separation with zero conflicts', () => {
    const scenario = SCENARIOS.scenario_safe;
    expect(scenario.aircraft.length).toBe(3);

    const summary = detectAirspaceCollisions(scenario.aircraft, DEFAULT_COLLISION_THRESHOLDS);

    expect(summary.totalPairsChecked).toBe(3);
    expect(summary.activeConflictsCount).toBe(0);
    expect(summary.criticalCount).toBe(0);
    expect(summary.highRiskCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.highestRiskLevel).toBe('SAFE');
    expect(summary.conflicts.length).toBe(0);

    const statusMap = deriveAircraftStatusMap(scenario.aircraft, summary.conflicts);
    scenario.aircraft.forEach((ac) => {
      expect(statusMap.get(ac.id)).toBe('NORMAL');
    });
  });

  it('Scenario 2: Predicted Conflict - detects converging 90-degree intercept at FL300', () => {
    const scenario = SCENARIOS.scenario_conflict;
    expect(scenario.aircraft.length).toBe(3);

    const summary = detectAirspaceCollisions(scenario.aircraft, DEFAULT_COLLISION_THRESHOLDS);

    expect(summary.totalPairsChecked).toBe(3);
    expect(summary.activeConflictsCount).toBe(1);
    expect(['CRITICAL', 'HIGH_RISK', 'WARNING']).toContain(summary.highestRiskLevel);

    const conflict = summary.conflicts[0];
    const callsigns = [conflict.aircraftA.callsign, conflict.aircraftB.callsign];
    expect(callsigns).toContain('SKY 101');
    expect(callsigns).toContain('UAL 452');
    expect(conflict.predictedClosestDistance).toBeCloseTo(0, 1);
    expect(conflict.altitudeDifference).toBe(0);

    const statusMap = deriveAircraftStatusMap(scenario.aircraft, summary.conflicts);
    expect(statusMap.get('AC001')).not.toBe('NORMAL');
    expect(statusMap.get('AC002')).not.toBe('NORMAL');
    // Third aircraft (BAW 214) is safe and unaffected
    expect(statusMap.get('AC003')).toBe('NORMAL');
  });

  it('Scenario 3: Altitude Separation - allows 2D track intersection with 6,000 ft vertical clearance', () => {
    const scenario = SCENARIOS.scenario_altitude;
    expect(scenario.aircraft.length).toBe(2);

    const summary = detectAirspaceCollisions(scenario.aircraft, DEFAULT_COLLISION_THRESHOLDS);

    expect(summary.totalPairsChecked).toBe(1);
    expect(summary.activeConflictsCount).toBe(0);
    expect(summary.highestRiskLevel).toBe('SAFE');

    const prediction = predictPairwiseCollision(
      scenario.aircraft[0],
      scenario.aircraft[1],
      DEFAULT_COLLISION_THRESHOLDS
    );

    // 2D tracks cross in proximity (< 20 px)
    expect(prediction.predictedClosestDistance).toBeCloseTo(17.7, 1);
    // 6,000 ft vertical separation ensures zero conflict
    expect(prediction.altitudeDifference).toBe(6000);
    expect(prediction.conflictDetected).toBe(false);
    expect(prediction.collisionRisk).toBe('SAFE');
  });

  it('Scenario 4: Multiple Aircraft Traffic - verifies isolation of single conflict pair in 5-aircraft sector', () => {
    const scenario = SCENARIOS.scenario_multi;
    expect(scenario.aircraft.length).toBe(5);

    const summary = detectAirspaceCollisions(scenario.aircraft, DEFAULT_COLLISION_THRESHOLDS);

    // 5 aircraft -> n*(n-1)/2 = 10 checked pairs
    expect(summary.totalPairsChecked).toBe(10);
    expect(summary.activeConflictsCount).toBe(1);

    const conflict = summary.conflicts[0];
    const conflictPairIds = [conflict.aircraftA.id, conflict.aircraftB.id];
    expect(conflictPairIds).toContain('AC001');
    expect(conflictPairIds).toContain('AC002');

    const statusMap = deriveAircraftStatusMap(scenario.aircraft, summary.conflicts);
    expect(statusMap.get('AC001')).not.toBe('NORMAL');
    expect(statusMap.get('AC002')).not.toBe('NORMAL');

    // The other 3 traffic aircraft have 0 false positive alerts
    expect(statusMap.get('AC003')).toBe('NORMAL');
    expect(statusMap.get('AC004')).toBe('NORMAL');
    expect(statusMap.get('AC005')).toBe('NORMAL');
  });

  it('Scenario 5: Head-On Approach - detects 180-degree high-closing-speed convergence', () => {
    const scenario = SCENARIOS.scenario_headon;
    expect(scenario.aircraft.length).toBe(2);

    const summary = detectAirspaceCollisions(scenario.aircraft, DEFAULT_COLLISION_THRESHOLDS);

    expect(summary.totalPairsChecked).toBe(1);
    expect(summary.activeConflictsCount).toBe(1);
    expect(summary.highestRiskLevel).toBe('CRITICAL');

    const conflict = summary.conflicts[0];
    // Closing speed is 540 + 540 = 1080 kts
    expect(conflict.relativeVelocity.relativeSpeed).toBe(1080);
    expect(conflict.predictedClosestDistance).toBeCloseTo(0, 1);
    expect(conflict.altitudeDifference).toBe(0);
    expect(conflict.timeToClosestApproach).toBeGreaterThan(0);
  });
});

describe('False-Positive Prevention & Robustness Test Suite (Tests A to G)', () => {
  it('Test A: Parallel Flights on Parallel Airways - zero false positives', () => {
    const ac1 = createAircraft({
      id: 'A1',
      callsign: 'PAR1',
      x: 100,
      y: 200,
      altitude: 35000,
      speed: 480,
      heading: 90,
    });
    const ac2 = createAircraft({
      id: 'A2',
      callsign: 'PAR2',
      x: 100,
      y: 350,
      altitude: 35000,
      speed: 480,
      heading: 90,
    });

    const pred = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);
    expect(pred.conflictDetected).toBe(false);
    expect(pred.collisionRisk).toBe('SAFE');
    expect(pred.predictedClosestDistance).toBe(150);
  });

  it('Test B: Diverging Aircraft (Flying Apart) - zero false positives and isDiverging flag set', () => {
    const ac1 = createAircraft({
      id: 'A1',
      callsign: 'DIV1',
      x: 400,
      y: 300,
      altitude: 33000,
      speed: 500,
      heading: 270, // Flying West
    });
    const ac2 = createAircraft({
      id: 'A2',
      callsign: 'DIV2',
      x: 500,
      y: 300,
      altitude: 33000,
      speed: 500,
      heading: 90, // Flying East
    });

    const pred = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);
    expect(pred.isDiverging).toBe(true);
    expect(pred.timeToClosestApproach).toBe(0);
    expect(pred.conflictDetected).toBe(false);
    expect(pred.collisionRisk).toBe('SAFE');
  });

  it('Test C: Crossing Paths with Standard Vertical Clearance (≥ 1,000 ft) - zero false positives', () => {
    const ac1 = createAircraft({
      id: 'A1',
      callsign: 'VSEP1',
      x: 100,
      y: 300,
      altitude: 31000,
      speed: 500,
      heading: 90,
    });
    const ac2 = createAircraft({
      id: 'A2',
      callsign: 'VSEP2',
      x: 300,
      y: 500,
      altitude: 33000, // 2,000 ft vertical clearance
      speed: 500,
      heading: 0,
    });

    const pred = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);
    expect(pred.altitudeDifference).toBe(2000);
    expect(pred.conflictDetected).toBe(false);
    expect(pred.collisionRisk).toBe('SAFE');
  });

  it('Test D: In-Trail Sequential Flight on Same Airway - maintains constant safe separation', () => {
    // Both flying East at 480 kts, spaced 120px apart
    const ac1 = createAircraft({
      id: 'A1',
      callsign: 'TRAIL1',
      x: 300,
      y: 400,
      altitude: 34000,
      speed: 480,
      heading: 90,
    });
    const ac2 = createAircraft({
      id: 'A2',
      callsign: 'TRAIL2',
      x: 180,
      y: 400,
      altitude: 34000,
      speed: 480,
      heading: 90,
    });

    const pred = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);
    expect(pred.conflictDetected).toBe(false);
    expect(pred.collisionRisk).toBe('SAFE');
    expect(pred.predictedClosestDistance).toBe(120);
  });

  it('Test E: Staggered Intersection Arrival (Crossing tracks, but arrival spaced by minutes)', () => {
    // AC1 is 50px away from intersection (50 / 25 = 2s away)
    const ac1 = createAircraft({
      id: 'A1',
      callsign: 'STAG1',
      x: 250,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });
    // AC2 is 600px away from intersection (600 / 25 = 24s away)
    const ac2 = createAircraft({
      id: 'A2',
      callsign: 'STAG2',
      x: 300,
      y: 900,
      altitude: 30000,
      speed: 500,
      heading: 0,
    });

    const pred = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);
    // Because AC1 crosses long before AC2 arrives, closest distance at CPA exceeds warning threshold
    expect(pred.predictedClosestDistance).toBeGreaterThan(DEFAULT_COLLISION_THRESHOLDS.warningDistanceThreshold);
    expect(pred.conflictDetected).toBe(false);
    expect(pred.collisionRisk).toBe('SAFE');
  });

  it('Test F: Stationary or Slow Orbit Outside Proximity Thresholds', () => {
    const ac1 = createAircraft({
      id: 'A1',
      callsign: 'HOLD1',
      x: 100,
      y: 100,
      altitude: 15000,
      speed: 200,
      heading: 0,
    });
    const ac2 = createAircraft({
      id: 'A2',
      callsign: 'CRZ1',
      x: 800,
      y: 700,
      altitude: 38000,
      speed: 520,
      heading: 270,
    });

    const pred = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);
    expect(pred.conflictDetected).toBe(false);
    expect(pred.collisionRisk).toBe('SAFE');
  });

  it('Test G: Divergent Climb / Safe Vertical Clearance Transition', () => {
    // Aircraft A cruising at FL300
    const ac1 = createAircraft({
      id: 'A1',
      callsign: 'CLB1',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });
    // Aircraft B cruising towards same point, but climbing to FL350 (target 35000 ft, current 32000 ft)
    const ac2 = createAircraft({
      id: 'A2',
      callsign: 'CLB2',
      x: 300,
      y: 500,
      altitude: 32000,
      targetAltitude: 35000,
      speed: 500,
      heading: 0,
    });

    // Time to intersection is 8s. Projected alt of ac2 = 32000 + (1500/60)*8 = 32200 ft.
    // Difference is 2,200 ft (> 1,000 ft minima)
    const pred = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);
    expect(pred.altitudeDifference).toBeGreaterThanOrEqual(1000);
    expect(pred.conflictDetected).toBe(false);
    expect(pred.collisionRisk).toBe('SAFE');
  });
});

describe('Simulation Engine Conflict Event Lifecycle & Telemetry Audit', () => {
  it('records CONFLICT_DETECTED, updates dynamically, and logs CONFLICT_RESOLVED upon clearance change', () => {
    // Initialize with Scenario 2: Predicted Conflict
    const engine = new SimulationEngine(SCENARIOS.scenario_conflict.aircraft);

    // Initial manual step to evaluate conflicts
    engine.stepManual(0.1);

    const initialEvents = engine.getEvents();
    expect(initialEvents.length).toBeGreaterThan(0);
    expect(initialEvents[0].type).toBe('CONFLICT_DETECTED');
    expect(initialEvents[0].aircraftA.callsign).toBe('SKY 101');
    expect(initialEvents[0].aircraftB.callsign).toBe('UAL 452');

    // Simulate ATC controller issuing a turn command to SKY 101 (turn heading to 0 degrees North)
    engine.updateAircraftDirect('AC001', { heading: 0 });

    const updatedEvents = engine.getEvents();
    const resolvedEvent = updatedEvents.find((e) => e.type === 'CONFLICT_RESOLVED');
    expect(resolvedEvent).toBeDefined();
    expect(resolvedEvent?.riskLevel).toBe('SAFE');

    const summary = engine.getConflictSummary();
    expect(summary.activeConflictsCount).toBe(0);

    engine.destroy();
  });
});
