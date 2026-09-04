import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../simulationEngine';
import { SCENARIOS } from '../scenarios';
import { predictPairwiseCollision, detectAirspaceCollisions } from '../collision';
import { createAircraft } from '../aircraft';
import { generateAIDecision } from '../../ai/decisionEngine';
import { DEMO_STAGES } from '../../components/DemoController';

describe('Phase 6 — Full System Pipeline, Polish, and Demo Mode', () => {
  it('should successfully execute the complete end-to-end safety avoidance pipeline in Demo Mode', () => {
    const demoScenario = SCENARIOS.scenario_phase6_demo;
    expect(demoScenario).toBeDefined();
    expect(demoScenario.aircraft.length).toBe(10);
    expect(demoScenario.weatherZones?.length).toBe(2);

    const engine = new SimulationEngine(
      demoScenario.aircraft,
      demoScenario.weatherZones || [],
      demoScenario.restrictedZones || []
    );

    // 1. Initial State (Nominal)
    const initialAircraft = engine.getAircraft();
    expect(initialAircraft.length).toBe(10);

    const ac1 = initialAircraft.find((a) => a.id === 'AC_DEMO_1')!;
    const ac2 = initialAircraft.find((a) => a.id === 'AC_DEMO_2')!;
    expect(ac1.callsign).toBe('SKY 101');
    expect(ac2.callsign).toBe('AAL 452');

    // 2. Advance simulation towards conflict convergence (step 6 seconds at 1x)
    for (let i = 0; i < 12; i++) {
      engine.stepManual(0.5);
    }

    const midAircraft = engine.getAircraft();
    const midAc1 = midAircraft.find((a) => a.id === 'AC_DEMO_1')!;
    const midAc2 = midAircraft.find((a) => a.id === 'AC_DEMO_2')!;

    // 3. Collision Prediction verifies conflict
    const pairPrediction = predictPairwiseCollision(midAc1, midAc2);
    expect(pairPrediction.conflictDetected).toBe(true);
    expect(['HIGH_RISK', 'CRITICAL']).toContain(pairPrediction.collisionRisk);
    expect(pairPrediction.timeToClosestApproach).toBeGreaterThan(0);

    // 4. AI Decision Engine Evaluates Safe Avoidance Vector
    const decision = generateAIDecision(
      midAc1,
      midAircraft,
      [pairPrediction],
      [],
      demoScenario.weatherZones || [],
      demoScenario.restrictedZones || []
    );

    expect(decision).toBeDefined();
    expect(['HIGH', 'CRITICAL']).toContain(decision.aiRiskCategory);
    expect(decision.candidates.length).toBeGreaterThan(3);

    // Verify right turn / climb is viable and recommended
    expect(['TURN_RIGHT', 'CLIMB', 'SPEED_DOWN']).toContain(decision.recommendedAction);
    expect(decision.confidence).toBeGreaterThanOrEqual(70);

    // 5. Execute avoidance clearance (HDG 120°)
    engine.updateAircraftDirect('AC_DEMO_1', { heading: 120 });

    // 6. Advance simulation another 20 seconds to verify conflict resolution
    for (let i = 0; i < 40; i++) {
      engine.stepManual(0.5);
    }

    const postAircraft = engine.getAircraft();
    const postAc1 = postAircraft.find((a) => a.id === 'AC_DEMO_1')!;
    const postAc2 = postAircraft.find((a) => a.id === 'AC_DEMO_2')!;

    const resolvedPrediction = predictPairwiseCollision(postAc1, postAc2);
    // After turning to HDG 120, minimum separation is restored
    expect(resolvedPrediction.collisionRisk).toBe('SAFE');

    engine.destroy();
  });

  it('should defensively sanitize invalid and malformed telemetry inputs without throwing', () => {
    // NaN Coordinates
    const corruptedAcA = createAircraft({
      id: 'CORRUPT_A',
      callsign: 'TEST 1',
      x: NaN,
      y: NaN,
      altitude: 33000,
      speed: -500, // Negative speed
      heading: 999, // Out of range heading
    });

    const corruptedAcB = createAircraft({
      id: 'CORRUPT_B',
      callsign: 'TEST 2',
      x: Infinity,
      y: 0,
      altitude: 33000,
      speed: 500,
      heading: 0,
    });

    // Should not throw or crash
    expect(() => {
      const pred = predictPairwiseCollision(corruptedAcA, corruptedAcB);
      expect(pred).toBeDefined();
      expect(Number.isFinite(pred.currentDistance)).toBe(true);
    }).not.toThrow();

    // Empty fleet should return clean safe summary
    const emptySummary = detectAirspaceCollisions([]);
    expect(emptySummary.totalPairsChecked).toBe(0);
    expect(emptySummary.activeConflictsCount).toBe(0);
    expect(emptySummary.highestRiskLevel).toBe('SAFE');
  });

  it('should maintain a valid 7-stage sequential structure for Demo Mode', () => {
    expect(DEMO_STAGES.length).toBe(7);

    DEMO_STAGES.forEach((stage, idx) => {
      expect(stage.stageNumber).toBe(idx + 1);
      expect(stage.title).toBeTruthy();
      expect(stage.description).toBeTruthy();
      expect(stage.triggerTimeSeconds).toBeGreaterThanOrEqual(0);
      if (idx > 0) {
        expect(stage.triggerTimeSeconds).toBeGreaterThan(DEMO_STAGES[idx - 1].triggerTimeSeconds);
      }
    });
  });

  it('should compute overall airspace status dynamically based on conflict and weather hazards', () => {
    const safeFleet = SCENARIOS.scenario_safe.aircraft;
    const safeSummary = detectAirspaceCollisions(safeFleet);
    expect(safeSummary.highestRiskLevel).toBe('SAFE');

    const conflictFleet = SCENARIOS.scenario_conflict.aircraft;
    const conflictSummary = detectAirspaceCollisions(conflictFleet);
    expect(conflictSummary.highestRiskLevel).toBe('CRITICAL');
  });
});