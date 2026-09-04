import type { Aircraft, AircraftStatus } from '../types/aircraft';
import type {
  CollisionPrediction,
  CollisionRiskLevel,
  CollisionThresholds,
  AirspaceConflictSummary,
} from '../types/collision';
import { calculateVelocity, SPEED_SCALE_FACTOR } from './movement';

/**
 * Standard ICAO / FAA ATM-aligned configurable safety thresholds
 */
export const DEFAULT_COLLISION_THRESHOLDS: CollisionThresholds = {
  lookaheadTimeSeconds: 120, // 2-minute forward lookahead horizon
  criticalDistanceThreshold: 30, // ~7.5 NM (imminent collision / loss of separation)
  highRiskDistanceThreshold: 55, // ~13.75 NM (severe converging trajectory)
  warningDistanceThreshold: 90, // ~22.5 NM (proximity warning / alert horizon)
  criticalTimeThresholdSeconds: 30, // <= 30 seconds to CPA
  highRiskTimeThresholdSeconds: 60, // <= 60 seconds to CPA
  warningTimeThresholdSeconds: 90, // <= 90 seconds to CPA
  verticalSeparationMinimaFt: 1000, // Standard 1,000 ft vertical separation
  criticalVerticalSeparationFt: 500, // Severe vertical compression
};

/**
 * Extrapolates an aircraft's altitude at a given future time offset in seconds,
 * taking into account active climb/descent rate towards target altitude.
 */
export function projectAltitude(aircraft: Aircraft, timeOffsetSeconds: number): number {
  if (aircraft.targetAltitude === undefined || aircraft.targetAltitude === aircraft.altitude) {
    return aircraft.altitude;
  }

  const diff = aircraft.targetAltitude - aircraft.altitude;
  const climbRateFpm =
    aircraft.verticalSpeed && aircraft.verticalSpeed !== 0
      ? aircraft.verticalSpeed
      : diff > 0
      ? 1500
      : -1500;

  const totalAltChange = (climbRateFpm / 60) * timeOffsetSeconds;

  if (Math.abs(diff) <= Math.abs(totalAltChange)) {
    return aircraft.targetAltitude;
  }

  return Math.round(aircraft.altitude + Math.sign(diff) * Math.abs(totalAltChange));
}

/**
 * Calculates 2D Euclidean distance between two spatial points
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes deterministic pairwise collision prediction and Closest Point of Approach (CPA)
 * between two aircraft using exact vector kinematics.
 * 
 * Mathematical Formulation:
 * 1. Let initial relative displacement r0 = Pos_B - Pos_A
 * 2. Let relative velocity vector V_rel = V_B - V_A
 * 3. Distance squared over time: D(t)^2 = |r0 + V_rel * t|^2 = |r0|^2 + 2*(r0 • V_rel)*t + |V_rel|^2 * t^2
 * 4. Minimizing D(t)^2 yields exact analytical CPA time:
 *    t_cpa = - (r0 • V_rel) / |V_rel|^2
 * 
 * @param aircraftA First aircraft
 * @param aircraftB Second aircraft
 * @param thresholds Configurable safety threshold parameters
 */
export function predictPairwiseCollision(
  aircraftA: Aircraft,
  aircraftB: Aircraft,
  thresholds: CollisionThresholds = DEFAULT_COLLISION_THRESHOLDS
): CollisionPrediction {
  // Defensive sanitization: ensure coordinates and speeds are finite numbers
  const ax = Number.isFinite(aircraftA.x) ? aircraftA.x : 0;
  const ay = Number.isFinite(aircraftA.y) ? aircraftA.y : 0;
  const bx = Number.isFinite(aircraftB.x) ? aircraftB.x : 0;
  const by = Number.isFinite(aircraftB.y) ? aircraftB.y : 0;
  const aSpeed = Number.isFinite(aircraftA.speed) && aircraftA.speed >= 0 ? aircraftA.speed : 0;
  const bSpeed = Number.isFinite(aircraftB.speed) && aircraftB.speed >= 0 ? aircraftB.speed : 0;
  const aHdg = Number.isFinite(aircraftA.heading) ? (aircraftA.heading % 360 + 360) % 360 : 0;
  const bHdg = Number.isFinite(aircraftB.heading) ? (aircraftB.heading % 360 + 360) % 360 : 0;

  // 1. Current horizontal separation distance
  const dx0 = bx - ax;
  const dy0 = by - ay;
  const currentDistance = Math.sqrt(dx0 * dx0 + dy0 * dy0);

  // 2. Compute true velocity vectors in simulation coordinate system
  const vA = calculateVelocity(aSpeed, aHdg);
  const vB = calculateVelocity(bSpeed, bHdg);

  // Scaled relative velocity components (pixels per second)
  const rvx = (vB.vx - vA.vx) * SPEED_SCALE_FACTOR;
  const rvy = (vB.vy - vA.vy) * SPEED_SCALE_FACTOR;

  const relativeSpeedKnots = Math.sqrt(
    Math.pow(vB.vx - vA.vx, 2) + Math.pow(vB.vy - vA.vy, 2)
  );

  const vRelSquared = rvx * rvx + rvy * rvy;
  const dotProduct = dx0 * rvx + dy0 * rvy;

  let timeToClosestApproach = 0;
  let isDiverging = false;

  // 3. Closest Point of Approach (CPA) Analytical Calculation
  if (vRelSquared < 1e-7 || !Number.isFinite(vRelSquared)) {
    // Parallel flights with matching speed: constant distance
    timeToClosestApproach = 0;
    isDiverging = false;
  } else {
    const rawTimeCpa = -dotProduct / vRelSquared;

    if (rawTimeCpa <= 0 || !Number.isFinite(rawTimeCpa)) {
      // CPA was in the past; distance is currently increasing (diverging)
      timeToClosestApproach = 0;
      isDiverging = true;
    } else {
      // Converging flight paths
      isDiverging = false;
      timeToClosestApproach = Math.min(rawTimeCpa, thresholds.lookaheadTimeSeconds);
    }
  }

  // 4. Projected positions at CPA
  const cpaAx = aircraftA.x + vA.vx * timeToClosestApproach * SPEED_SCALE_FACTOR;
  const cpaAy = aircraftA.y + vA.vy * timeToClosestApproach * SPEED_SCALE_FACTOR;
  const cpaBx = aircraftB.x + vB.vx * timeToClosestApproach * SPEED_SCALE_FACTOR;
  const cpaBy = aircraftB.y + vB.vy * timeToClosestApproach * SPEED_SCALE_FACTOR;

  // 5. Predicted closest horizontal distance
  const predictedClosestDistance = isDiverging
    ? currentDistance
    : calculateDistance(cpaAx, cpaAy, cpaBx, cpaBy);

  // 6. Altitude separation analysis
  const currentAltitudeDifference = Math.abs(aircraftA.altitude - aircraftB.altitude);
  const altAtCpaA = projectAltitude(aircraftA, timeToClosestApproach);
  const altAtCpaB = projectAltitude(aircraftB, timeToClosestApproach);
  const altitudeDifferenceAtCpa = Math.abs(altAtCpaA - altAtCpaB);

  // 7. Loss of Separation (LoS) time window calculation
  let lossOfSeparationWindow: CollisionPrediction['lossOfSeparationWindow'];
  if (vRelSquared > 1e-7 && !isDiverging) {
    const D_sep = thresholds.criticalDistanceThreshold;
    const A = vRelSquared;
    const B = 2 * dotProduct;
    const C = dx0 * dx0 + dy0 * dy0 - D_sep * D_sep;
    const discriminant = B * B - 4 * A * C;

    if (discriminant >= 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      const t1 = Math.max(0, (-B - sqrtDisc) / (2 * A));
      const t2 = Math.min(thresholds.lookaheadTimeSeconds, (-B + sqrtDisc) / (2 * A));

      if (t2 > t1 && t1 < thresholds.lookaheadTimeSeconds) {
        lossOfSeparationWindow = {
          entryTimeSeconds: Math.round(t1),
          exitTimeSeconds: Math.round(t2),
          durationSeconds: Math.round(t2 - t1),
        };
      }
    }
  }

  // 8. Deterministic Risk Classification based on Configurable Thresholds
  let collisionRisk: CollisionRiskLevel = 'SAFE';

  const hasVerticalConflict = altitudeDifferenceAtCpa < thresholds.verticalSeparationMinimaFt;
  const currentVerticalConflict = currentAltitudeDifference < thresholds.verticalSeparationMinimaFt;

  if (hasVerticalConflict) {
    // Check for imminent separation breach (CRITICAL)
    if (
      (currentDistance < thresholds.criticalDistanceThreshold && currentVerticalConflict) ||
      (predictedClosestDistance < thresholds.criticalDistanceThreshold &&
        timeToClosestApproach <= thresholds.criticalTimeThresholdSeconds &&
        !isDiverging)
    ) {
      collisionRisk = 'CRITICAL';
    }
    // Check for high risk convergence (HIGH_RISK)
    else if (
      predictedClosestDistance < thresholds.highRiskDistanceThreshold &&
      timeToClosestApproach <= thresholds.highRiskTimeThresholdSeconds &&
      !isDiverging
    ) {
      collisionRisk = 'HIGH_RISK';
    }
    // Check for proximity warning (WARNING)
    else if (
      predictedClosestDistance < thresholds.warningDistanceThreshold &&
      timeToClosestApproach <= thresholds.warningTimeThresholdSeconds &&
      !isDiverging
    ) {
      collisionRisk = 'WARNING';
    }
  }

  const conflictDetected = collisionRisk !== 'SAFE';

  return {
    aircraftA,
    aircraftB,
    currentDistance: Math.round(currentDistance * 10) / 10,
    predictedClosestDistance: Math.round(predictedClosestDistance * 10) / 10,
    timeToClosestApproach: Math.round(timeToClosestApproach),
    altitudeDifference: Math.round(altitudeDifferenceAtCpa),
    currentAltitudeDifference: Math.round(currentAltitudeDifference),
    cpaPointA: {
      x: Math.round(cpaAx * 10) / 10,
      y: Math.round(cpaAy * 10) / 10,
      altitude: altAtCpaA,
    },
    cpaPointB: {
      x: Math.round(cpaBx * 10) / 10,
      y: Math.round(cpaBy * 10) / 10,
      altitude: altAtCpaB,
    },
    collisionRisk,
    conflictDetected,
    isDiverging,
    relativeVelocity: {
      rvx: Math.round(rvx * 100) / 100,
      rvy: Math.round(rvy * 100) / 100,
      relativeSpeed: Math.round(relativeSpeedKnots),
    },
    lossOfSeparationWindow,
  };
}

/**
 * Evaluates all unique pairwise combinations in an aircraft fleet and produces
 * a complete conflict summary and status classification map.
 * 
 * @param aircraftList List of all aircraft active in the sector
 * @param thresholds Optional custom thresholds (defaults to DEFAULT_COLLISION_THRESHOLDS)
 */
export function detectAirspaceCollisions(
  aircraftList: Aircraft[],
  thresholds: CollisionThresholds = DEFAULT_COLLISION_THRESHOLDS
): AirspaceConflictSummary {
  const conflicts: CollisionPrediction[] = [];
  let totalPairsChecked = 0;
  let criticalCount = 0;
  let highRiskCount = 0;
  let warningCount = 0;

  for (let i = 0; i < aircraftList.length; i++) {
    for (let j = i + 1; j < aircraftList.length; j++) {
      totalPairsChecked++;
      const prediction = predictPairwiseCollision(aircraftList[i], aircraftList[j], thresholds);

      if (prediction.conflictDetected) {
        conflicts.push(prediction);
        if (prediction.collisionRisk === 'CRITICAL') criticalCount++;
        else if (prediction.collisionRisk === 'HIGH_RISK') highRiskCount++;
        else if (prediction.collisionRisk === 'WARNING') warningCount++;
      }
    }
  }

  // Sort conflicts by urgency (CRITICAL first, then lowest time to CPA)
  conflicts.sort((a, b) => {
    const riskPriority: Record<CollisionRiskLevel, number> = {
      CRITICAL: 4,
      HIGH_RISK: 3,
      WARNING: 2,
      SAFE: 1,
    };
    if (riskPriority[a.collisionRisk] !== riskPriority[b.collisionRisk]) {
      return riskPriority[b.collisionRisk] - riskPriority[a.collisionRisk];
    }
    return a.timeToClosestApproach - b.timeToClosestApproach;
  });

  const highestRiskLevel: CollisionRiskLevel =
    criticalCount > 0
      ? 'CRITICAL'
      : highRiskCount > 0
      ? 'HIGH_RISK'
      : warningCount > 0
      ? 'WARNING'
      : 'SAFE';

  return {
    totalPairsChecked,
    activeConflictsCount: conflicts.length,
    criticalCount,
    highRiskCount,
    warningCount,
    highestRiskLevel,
    conflicts,
  };
}

/**
 * Maps risk levels from CollisionRiskLevel to the core AircraftStatus enum
 */
export function mapRiskLevelToAircraftStatus(risk: CollisionRiskLevel): AircraftStatus {
  switch (risk) {
    case 'CRITICAL':
      return 'CRITICAL';
    case 'HIGH_RISK':
      return 'HIGH_RISK';
    case 'WARNING':
      return 'CAUTION';
    case 'SAFE':
    default:
      return 'NORMAL';
  }
}

/**
 * Returns a map of aircraft ID to highest risk status derived from active collision predictions.
 */
export function deriveAircraftStatusMap(
  aircraftList: Aircraft[],
  conflicts: CollisionPrediction[]
): Map<string, AircraftStatus> {
  const statusMap = new Map<string, AircraftStatus>();
  aircraftList.forEach((ac) => statusMap.set(ac.id, 'NORMAL'));

  const severityWeight: Record<CollisionRiskLevel, number> = {
    SAFE: 0,
    WARNING: 1,
    HIGH_RISK: 2,
    CRITICAL: 3,
  };

  for (const conflict of conflicts) {
    const currentStatusA = statusMap.get(conflict.aircraftA.id) || 'NORMAL';
    const currentStatusB = statusMap.get(conflict.aircraftB.id) || 'NORMAL';

    const conflictStatus = mapRiskLevelToAircraftStatus(conflict.collisionRisk);

    // Helper to evaluate mapped risk level
    const mappedRiskLevel = (status: AircraftStatus): CollisionRiskLevel => {
      if (status === 'CRITICAL') return 'CRITICAL';
      if (status === 'HIGH_RISK') return 'HIGH_RISK';
      if (status === 'CAUTION') return 'WARNING';
      return 'SAFE';
    };

    if (severityWeight[conflict.collisionRisk] > severityWeight[mappedRiskLevel(currentStatusA)]) {
      statusMap.set(conflict.aircraftA.id, conflictStatus);
    }
    if (severityWeight[conflict.collisionRisk] > severityWeight[mappedRiskLevel(currentStatusB)]) {
      statusMap.set(conflict.aircraftB.id, conflictStatus);
    }
  }

  return statusMap;
}
