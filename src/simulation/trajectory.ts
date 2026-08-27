import type { Aircraft, TrajectoryPoint } from '../types/aircraft';
import { calculateVelocity, SPEED_SCALE_FACTOR } from './movement';

/**
 * Computes predicted future positions for an aircraft based on its current speed, heading, and altitude.
 * 
 * @param aircraft The aircraft to predict trajectory for
 * @param lookaheadSeconds Total future projection window in seconds (e.g. 60s)
 * @param stepIntervalSeconds Interval between prediction waypoints (e.g. 15s)
 */
export function calculatePredictedTrajectory(
  aircraft: Aircraft,
  lookaheadSeconds: number = 60,
  stepIntervalSeconds: number = 15
): TrajectoryPoint[] {
  const trajectory: TrajectoryPoint[] = [];
  const velocity = calculateVelocity(aircraft.speed, aircraft.heading);

  const numSteps = Math.floor(lookaheadSeconds / stepIntervalSeconds);

  for (let i = 1; i <= numSteps; i++) {
    const timeOffset = i * stepIntervalSeconds;
    
    // Future projection formula: Pos(t) = Pos(0) + Vel * t * scale
    const projectedX = aircraft.x + velocity.vx * timeOffset * SPEED_SCALE_FACTOR;
    const projectedY = aircraft.y + velocity.vy * timeOffset * SPEED_SCALE_FACTOR;

    // Altitude projection (factoring in target altitude if climbing/descending)
    let projectedAltitude = aircraft.altitude;
    if (aircraft.targetAltitude !== undefined && aircraft.targetAltitude !== aircraft.altitude) {
      const diff = aircraft.targetAltitude - aircraft.altitude;
      const climbRateFpm = aircraft.verticalSpeed ?? (diff > 0 ? 1500 : -1500);
      const totalChange = (climbRateFpm / 60) * timeOffset;
      if (Math.abs(diff) <= Math.abs(totalChange)) {
        projectedAltitude = aircraft.targetAltitude;
      } else {
        projectedAltitude = aircraft.altitude + Math.sign(diff) * Math.abs(totalChange);
      }
    }

    trajectory.push({
      x: projectedX,
      y: projectedY,
      timeOffsetSeconds: timeOffset,
      altitude: Math.round(projectedAltitude),
    });
  }

  return trajectory;
}

/**
 * Computes the 2D Euclidean distance between two points in airspace
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the Closest Point of Approach (CPA) between two aircraft over a time horizon.
 * Useful for assessing risk levels without full collision avoidance logic.
 */
export function calculateClosestPointOfApproach(
  ac1: Aircraft,
  ac2: Aircraft,
  lookaheadSeconds: number = 120
): { minDistance: number; timeToCpaSeconds: number; altDiffAtCpa: number } {
  const v1 = calculateVelocity(ac1.speed, ac1.heading);
  const v2 = calculateVelocity(ac2.speed, ac2.heading);

  // Relative initial position
  const rx0 = ac2.x - ac1.x;
  const ry0 = ac2.y - ac1.y;

  // Relative velocity (scaled)
  const rvx = (v2.vx - v1.vx) * SPEED_SCALE_FACTOR;
  const rvy = (v2.vy - v1.vy) * SPEED_SCALE_FACTOR;

  const vRelSquared = rvx * rvx + rvy * rvy;

  let timeToCpa = 0;
  if (vRelSquared > 0.0001) {
    timeToCpa = -(rx0 * rvx + ry0 * rvy) / vRelSquared;
  }

  // Bound to current horizon [0, lookaheadSeconds]
  timeToCpa = Math.max(0, Math.min(timeToCpa, lookaheadSeconds));

  const x1_cpa = ac1.x + v1.vx * timeToCpa * SPEED_SCALE_FACTOR;
  const y1_cpa = ac1.y + v1.vy * timeToCpa * SPEED_SCALE_FACTOR;
  const x2_cpa = ac2.x + v2.vx * timeToCpa * SPEED_SCALE_FACTOR;
  const y2_cpa = ac2.y + v2.vy * timeToCpa * SPEED_SCALE_FACTOR;

  const minDistance = calculateDistance(x1_cpa, y1_cpa, x2_cpa, y2_cpa);
  const altDiff = Math.abs(ac1.altitude - ac2.altitude);

  return {
    minDistance,
    timeToCpaSeconds: Math.round(timeToCpa),
    altDiffAtCpa: altDiff,
  };
}
