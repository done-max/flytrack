import type { Aircraft, AircraftStatus, AirspaceDimensions, RoutePoint } from '../types/aircraft';
import { calculateVelocity, updateAircraftPosition } from './movement';
import { calculateClosestPointOfApproach, calculatePredictedTrajectory } from './trajectory';

/**
 * Factory function to initialize a new aircraft with valid velocity and predicted trajectory.
 */
export function createAircraft(params: {
  id: string;
  callsign: string;
  x: number;
  y: number;
  altitude: number;
  targetAltitude?: number;
  speed: number;
  heading: number;
  status?: AircraftStatus;
  model?: string;
  squawk?: string;
  origin?: string;
  destination?: string;
}): Aircraft {
  const velocity = calculateVelocity(params.speed, params.heading);
  const baseAircraft: Aircraft = {
    id: params.id,
    callsign: params.callsign,
    x: params.x,
    y: params.y,
    altitude: params.altitude,
    targetAltitude: params.targetAltitude ?? params.altitude,
    speed: params.speed,
    heading: params.heading,
    velocity,
    status: params.status ?? 'NORMAL',
    routeHistory: [
      {
        x: params.x,
        y: params.y,
        timestamp: Date.now(),
        altitude: params.altitude,
        speed: params.speed,
      },
    ],
    predictedTrajectory: [],
    model: params.model ?? 'B738',
    squawk: params.squawk ?? `${Math.floor(1000 + Math.random() * 8999)}`,
    origin: params.origin ?? 'BOS',
    destination: params.destination ?? 'SFO',
    verticalSpeed: 0,
  };

  // Pre-calculate initial trajectory
  baseAircraft.predictedTrajectory = calculatePredictedTrajectory(baseAircraft, 60, 15);
  return baseAircraft;
}

/**
 * Updates aircraft route history (breadcrumbs) with memory bounds and distance throttling.
 */
export function updateRouteHistory(
  currentHistory: RoutePoint[],
  newX: number,
  newY: number,
  altitude: number,
  speed: number,
  maxPoints: number = 40,
  minDistanceThreshold: number = 8 // pixels before dropping a new breadcrumb
): RoutePoint[] {
  const lastPoint = currentHistory[currentHistory.length - 1];

  let history = [...currentHistory];

  if (!lastPoint) {
    history.push({ x: newX, y: newY, timestamp: Date.now(), altitude, speed });
    return history;
  }

  const dx = newX - lastPoint.x;
  const dy = newY - lastPoint.y;
  const distSquared = dx * dx + dy * dy;

  // Add a new point only if aircraft moved sufficient distance
  if (distSquared >= minDistanceThreshold * minDistanceThreshold) {
    history.push({
      x: newX,
      y: newY,
      timestamp: Date.now(),
      altitude,
      speed,
    });

    // Enforce memory limit
    if (history.length > maxPoints) {
      history = history.slice(history.length - maxPoints);
    }
  }

  return history;
}

/**
 * Evaluates proximity risk between all aircraft to assign dynamic statuses (NORMAL, CAUTION, HIGH_RISK, CRITICAL)
 * when not manually overridden.
 */
export function evaluateAirspaceRiskStatuses(aircraftList: Aircraft[]): Map<string, AircraftStatus> {
  const statusMap = new Map<string, AircraftStatus>();

  // Default everyone to NORMAL
  aircraftList.forEach((ac) => statusMap.set(ac.id, 'NORMAL'));

  for (let i = 0; i < aircraftList.length; i++) {
    for (let j = i + 1; j < aircraftList.length; j++) {
      const ac1 = aircraftList[i];
      const ac2 = aircraftList[j];

      // Current distance
      const dx = ac2.x - ac1.x;
      const dy = ac2.y - ac1.y;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const altDiff = Math.abs(ac1.altitude - ac2.altitude);

      // Trajectory CPA analysis
      const cpa = calculateClosestPointOfApproach(ac1, ac2, 90);

      // Threat levels based on distance and altitude separation (< 1000 ft vertical)
      if (altDiff < 1000) {
        if (currentDist < 30 || (cpa.minDistance < 25 && cpa.timeToCpaSeconds < 25)) {
          // CRITICAL: Imminent separation breach or under 25s CPA
          statusMap.set(ac1.id, 'CRITICAL');
          statusMap.set(ac2.id, 'CRITICAL');
        } else if (cpa.minDistance < 45 && cpa.timeToCpaSeconds < 60) {
          // HIGH_RISK: Trajectory converging within 60s
          if (statusMap.get(ac1.id) !== 'CRITICAL') statusMap.set(ac1.id, 'HIGH_RISK');
          if (statusMap.get(ac2.id) !== 'CRITICAL') statusMap.set(ac2.id, 'HIGH_RISK');
        } else if (cpa.minDistance < 70 && cpa.timeToCpaSeconds < 90) {
          // CAUTION: Possible converging course
          if (!['CRITICAL', 'HIGH_RISK'].includes(statusMap.get(ac1.id)!)) {
            statusMap.set(ac1.id, 'CAUTION');
          }
          if (!['CRITICAL', 'HIGH_RISK'].includes(statusMap.get(ac2.id)!)) {
            statusMap.set(ac2.id, 'CAUTION');
          }
        }
      }
    }
  }

  return statusMap;
}

/**
 * Step update for a single aircraft in the simulation frame.
 */
export function stepAircraft(
  aircraft: Aircraft,
  deltaSeconds: number,
  simSpeed: number,
  bounds: AirspaceDimensions,
  predictionHorizonSeconds: number = 60,
  maxTrailPoints: number = 40
): Aircraft {
  const movement = updateAircraftPosition(aircraft, deltaSeconds, simSpeed, bounds);

  const updatedHistory = updateRouteHistory(
    aircraft.routeHistory,
    movement.x,
    movement.y,
    movement.altitude,
    aircraft.speed,
    maxTrailPoints
  );

  const updatedAircraft: Aircraft = {
    ...aircraft,
    x: movement.x,
    y: movement.y,
    altitude: movement.altitude,
    velocity: movement.velocity,
    heading: movement.heading,
    routeHistory: updatedHistory,
    predictedTrajectory: [],
  };

  // Recalculate future trajectory vector
  updatedAircraft.predictedTrajectory = calculatePredictedTrajectory(
    updatedAircraft,
    predictionHorizonSeconds,
    15
  );

  return updatedAircraft;
}
