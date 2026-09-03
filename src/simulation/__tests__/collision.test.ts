import { describe, it, expect } from 'vitest';
import {
  predictPairwiseCollision,
  detectAirspaceCollisions,
  DEFAULT_COLLISION_THRESHOLDS,
  projectAltitude,
} from '../collision';
import { createAircraft } from '../aircraft';
import type { CollisionThresholds } from '../../types/collision';

describe('Collision Prediction Engine - Exact Pairwise Kinematics', () => {
  it('detects imminent orthogonal (90-degree) collision course accurately', () => {
    // Aircraft A: at (100, 300) flying East (heading 90) at 500 kts
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'SKY 101',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90, // East: vx = 500, vy = 0
    });

    // Aircraft B: at (300, 500) flying North (heading 0) at 500 kts
    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'UAL 452',
      x: 300,
      y: 500,
      altitude: 30000,
      speed: 500,
      heading: 0, // North: vx = 0, vy = -500
    });

    // Speed in pixels/s = 500 * 0.05 = 25 px/s
    // Distance to intersection (300, 300) is 200 px for both aircraft
    // Expected time to intersection = 200 / 25 = 8 seconds!
    const prediction = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);

    expect(prediction.timeToClosestApproach).toBe(8);
    expect(prediction.predictedClosestDistance).toBeCloseTo(0, 1);
    expect(prediction.cpaPointA.x).toBeCloseTo(300, 1);
    expect(prediction.cpaPointA.y).toBeCloseTo(300, 1);
    expect(prediction.cpaPointB.x).toBeCloseTo(300, 1);
    expect(prediction.cpaPointB.y).toBeCloseTo(300, 1);
    expect(prediction.altitudeDifference).toBe(0);
    expect(prediction.collisionRisk).toBe('CRITICAL');
    expect(prediction.conflictDetected).toBe(true);
    expect(prediction.isDiverging).toBe(false);
  });

  it('detects head-on (180-degree) collision convergence', () => {
    // Aircraft A at (100, 300) flying East at 600 kts
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'AAL 100',
      x: 100,
      y: 300,
      altitude: 32000,
      speed: 600,
      heading: 90,
    });

    // Aircraft B at (400, 300) flying West at 600 kts
    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'DAL 200',
      x: 400,
      y: 300,
      altitude: 32000,
      speed: 600,
      heading: 270,
    });

    // Relative closing speed = (600 + 600) * 0.05 = 60 px/s
    // Initial distance = 300 px
    // Expected time to collision = 300 / 60 = 5 seconds!
    const prediction = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);

    expect(prediction.timeToClosestApproach).toBe(5);
    expect(prediction.predictedClosestDistance).toBeCloseTo(0, 1);
    expect(prediction.cpaPointA.x).toBeCloseTo(250, 1);
    expect(prediction.cpaPointB.x).toBeCloseTo(250, 1);
    expect(prediction.collisionRisk).toBe('CRITICAL');
  });

  it('correctly marks diverging aircraft as SAFE with isDiverging = true', () => {
    // Aircraft A at (300, 300) flying West (heading 270)
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'AFR 01',
      x: 300,
      y: 300,
      altitude: 34000,
      speed: 500,
      heading: 270,
    });

    // Aircraft B at (350, 300) flying East (heading 90)
    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'BAW 02',
      x: 350,
      y: 300,
      altitude: 34000,
      speed: 500,
      heading: 90,
    });

    const prediction = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);

    expect(prediction.isDiverging).toBe(true);
    expect(prediction.timeToClosestApproach).toBe(0);
    expect(prediction.collisionRisk).toBe('SAFE');
    expect(prediction.conflictDetected).toBe(false);
  });

  it('marks safe parallel flights on established airways as SAFE', () => {
    // Aircraft A at (100, 200) flying East on Airway 1
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'SWA 01',
      x: 100,
      y: 200,
      altitude: 33000,
      speed: 500,
      heading: 90,
    });

    // Aircraft B at (100, 300) flying East on Airway 2 (100 px lateral separation = ~25 NM)
    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'SWA 02',
      x: 100,
      y: 300,
      altitude: 33000,
      speed: 500,
      heading: 90,
    });

    const prediction = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);

    expect(prediction.predictedClosestDistance).toBe(100);
    expect(prediction.collisionRisk).toBe('SAFE');
    expect(prediction.conflictDetected).toBe(false);
  });

  it('evaluates safe vertical separation (crossing flight paths at different altitudes)', () => {
    // Aircraft A flying East at FL300 (30,000 ft)
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'KLM 01',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });

    // Aircraft B flying North at FL360 (36,000 ft, 6000 ft vertical clearance)
    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'UAE 02',
      x: 300,
      y: 500,
      altitude: 36000,
      speed: 500,
      heading: 0,
    });

    const prediction = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);

    expect(prediction.predictedClosestDistance).toBeCloseTo(0, 1);
    expect(prediction.altitudeDifference).toBe(6000);
    // Despite 2D lateral intersection, 6000 ft altitude separation ensures SAFE status
    expect(prediction.collisionRisk).toBe('SAFE');
    expect(prediction.conflictDetected).toBe(false);
  });

  it('detects conflict when an aircraft is actively climbing into conflicting flight level', () => {
    // Aircraft A flying East at FL300
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'EVA 01',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });

    // Aircraft B flying North, starting at 29,800 ft, climbing to 30,000 ft
    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'QFA 02',
      x: 300,
      y: 500,
      altitude: 29800,
      targetAltitude: 30000,
      speed: 500,
      heading: 0,
    });

    // CPA in 8s: projected altitude for ac2 = 29800 + (1500/60)*8 = 30000 ft!
    const projectedAlt = projectAltitude(ac2, 8);
    expect(projectedAlt).toBe(30000);

    const prediction = predictPairwiseCollision(ac1, ac2, DEFAULT_COLLISION_THRESHOLDS);

    expect(prediction.altitudeDifference).toBe(0);
    expect(prediction.collisionRisk).toBe('CRITICAL');
    expect(prediction.conflictDetected).toBe(true);
  });

  it('respects custom configurable safety thresholds', () => {
    const customThresholds: CollisionThresholds = {
      lookaheadTimeSeconds: 60,
      criticalDistanceThreshold: 10,
      highRiskDistanceThreshold: 20,
      warningDistanceThreshold: 40,
      criticalTimeThresholdSeconds: 15,
      highRiskTimeThresholdSeconds: 30,
      warningTimeThresholdSeconds: 60,
      verticalSeparationMinimaFt: 1000,
      criticalVerticalSeparationFt: 500,
    };

    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'TEST1',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });

    // Aircraft B converging with 30px predicted CPA in 40s
    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'TEST2',
      x: 200,
      y: 430,
      altitude: 30000,
      speed: 500,
      heading: 0,
    });

    const prediction = predictPairwiseCollision(ac1, ac2, customThresholds);
    expect(['WARNING', 'HIGH_RISK']).toContain(prediction.collisionRisk);
  });
});

describe('Airspace Fleet Conflict Detection (Multi-Aircraft)', () => {
  it('evaluates all pairwise combinations and produces a ranked conflict summary', () => {
    // AC01 & AC02 converging on intersection at (300, 300) in 8s at FL300
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'SKY 101',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });

    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'UAL 452',
      x: 300,
      y: 500,
      altitude: 30000,
      speed: 500,
      heading: 0,
    });

    const ac3 = createAircraft({
      id: 'AC03',
      callsign: 'BAW 214',
      x: 750,
      y: 180,
      altitude: 38000,
      speed: 490,
      heading: 260,
    });

    const summary = detectAirspaceCollisions([ac1, ac2, ac3], DEFAULT_COLLISION_THRESHOLDS);

    expect(summary.totalPairsChecked).toBe(3);
    expect(summary.activeConflictsCount).toBe(1);
    expect(summary.conflicts[0].aircraftA.id).toBe('AC01');
    expect(summary.conflicts[0].aircraftB.id).toBe('AC02');
    expect(summary.highestRiskLevel).toBe('CRITICAL');
  });
});
