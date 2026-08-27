import { describe, it, expect } from 'vitest';
import { calculateVelocity, normalizeHeading, updateAircraftPosition, SPEED_SCALE_FACTOR } from '../movement';
import { calculatePredictedTrajectory, calculateClosestPointOfApproach } from '../trajectory';
import { createAircraft, updateRouteHistory, evaluateAirspaceRiskStatuses } from '../aircraft';

describe('Movement & Trigonometry Kinematics', () => {
  it('calculates velocity components according to aviation heading standards', () => {
    // Heading 000° (North/Up): vx = 0, vy = -speed (moving towards -Y)
    const north = calculateVelocity(500, 0);
    expect(north.vx).toBeCloseTo(0, 4);
    expect(north.vy).toBeCloseTo(-500, 4);

    // Heading 090° (East/Right): vx = 500, vy = 0
    const east = calculateVelocity(500, 90);
    expect(east.vx).toBeCloseTo(500, 4);
    expect(east.vy).toBeCloseTo(0, 4);

    // Heading 180° (South/Down): vx = 0, vy = 500
    const south = calculateVelocity(500, 180);
    expect(south.vx).toBeCloseTo(0, 4);
    expect(south.vy).toBeCloseTo(500, 4);

    // Heading 270° (West/Left): vx = -500, vy = 0
    const west = calculateVelocity(500, 270);
    expect(west.vx).toBeCloseTo(-500, 4);
    expect(west.vy).toBeCloseTo(0, 4);
  });

  it('normalizes headings to [0, 360) range', () => {
    expect(normalizeHeading(360)).toBe(0);
    expect(normalizeHeading(450)).toBe(90);
    expect(normalizeHeading(-90)).toBe(270);
    expect(normalizeHeading(-370)).toBe(350);
  });

  it('updates aircraft position based on delta time and simulation speed multiplier', () => {
    const ac = createAircraft({
      id: 'AC01',
      callsign: 'TEST 1',
      x: 200,
      y: 200,
      altitude: 30000,
      speed: 600,
      heading: 90, // East: vx = 600, vy = 0
    });

    const bounds = { width: 1000, height: 750, minX: 0, maxX: 1000, minY: 0, maxY: 750 };
    const deltaSeconds = 1.0;
    const simSpeed = 2; // 2x speed

    const updated = updateAircraftPosition(ac, deltaSeconds, simSpeed, bounds);

    // Expected displacement: dx = speed * sin(90) * dt * simSpeed * SPEED_SCALE_FACTOR
    // dx = 600 * 1 * 1.0 * 2 * 0.05 = 60
    expect(updated.x).toBeCloseTo(200 + 60, 2);
    expect(updated.y).toBeCloseTo(200, 2);
  });
});

describe('Trajectory Prediction & CPA Risk Assessment', () => {
  it('calculates multi-step projected trajectory waypoints accurately', () => {
    const ac = createAircraft({
      id: 'AC01',
      callsign: 'TEST 1',
      x: 100,
      y: 100,
      altitude: 32000,
      speed: 500,
      heading: 90,
    });

    const trajectory = calculatePredictedTrajectory(ac, 60, 15);
    // 60s / 15s = 4 waypoints (+15s, +30s, +45s, +60s)
    expect(trajectory.length).toBe(4);
    expect(trajectory[0].timeOffsetSeconds).toBe(15);
    expect(trajectory[3].timeOffsetSeconds).toBe(60);

    // Check endpoint position: dx = 500 * 60 * 0.05 = 1500
    const expectedEndX = 100 + 500 * 60 * SPEED_SCALE_FACTOR;
    expect(trajectory[3].x).toBeCloseTo(expectedEndX, 2);
    expect(trajectory[3].y).toBeCloseTo(100, 2);
  });

  it('calculates Closest Point of Approach for converging flight paths', () => {
    // Aircraft A: at (100, 300) flying East (heading 90) at 500 kts
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'A1',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });

    // Aircraft B: at (300, 500) flying North (heading 0) at 500 kts
    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'B2',
      x: 300,
      y: 500,
      altitude: 30000,
      speed: 500,
      heading: 0,
    });

    const cpa = calculateClosestPointOfApproach(ac1, ac2, 60);

    // Both reach (300, 300) in 200 / (500 * 0.05) = 8 seconds!
    expect(cpa.timeToCpaSeconds).toBe(8);
    expect(cpa.minDistance).toBeCloseTo(0, 1);
    expect(cpa.altDiffAtCpa).toBe(0);
  });

  it('evaluates dynamic risk statuses accurately for collision scenarios', () => {
    const ac1 = createAircraft({
      id: 'AC01',
      callsign: 'A1',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });

    const ac2 = createAircraft({
      id: 'AC02',
      callsign: 'B2',
      x: 300,
      y: 500,
      altitude: 30000,
      speed: 500,
      heading: 0,
    });

    const riskMap = evaluateAirspaceRiskStatuses([ac1, ac2]);
    expect(['CAUTION', 'HIGH_RISK', 'CRITICAL']).toContain(riskMap.get('AC01'));
    expect(['CAUTION', 'HIGH_RISK', 'CRITICAL']).toContain(riskMap.get('AC02'));
  });
});

describe('Route History Trail Buffering', () => {
  it('drops breadcrumbs with distance throttling and caps maximum points', () => {
    let history: any[] = [];
    const maxPoints = 5;

    // Small movements (< 8px) shouldn't pollute buffer
    history = updateRouteHistory(history, 100, 100, 30000, 500, maxPoints);
    expect(history.length).toBe(1);

    history = updateRouteHistory(history, 102, 102, 30000, 500, maxPoints);
    expect(history.length).toBe(1); // not moved enough

    // Significant movements
    for (let i = 1; i <= 10; i++) {
      history = updateRouteHistory(history, 100 + i * 20, 100, 30000, 500, maxPoints);
    }

    // Memory bounded to maxPoints
    expect(history.length).toBe(maxPoints);
  });
});
