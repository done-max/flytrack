import type { Aircraft } from '../types/aircraft';
import type { WeatherZone } from '../types/weather';
import type { RestrictedZone } from '../types/safety';
import type { ManeuverCandidate, ManeuverType } from '../types/ai';
import { predictPairwiseCollision } from '../simulation/collision';
import { predictAircraftWeatherInteraction } from '../weather/weatherPrediction';

export interface CandidateDef {
  type: ManeuverType;
  label: string;
  headingDelta: number;
  altitudeDelta: number;
  speedDelta: number;
}

export const STANDARD_CANDIDATES: CandidateDef[] = [
  { type: 'CONTINUE', label: 'MAINTAIN CURRENT COURSE', headingDelta: 0, altitudeDelta: 0, speedDelta: 0 },
  { type: 'TURN_RIGHT', label: 'TURN RIGHT 30°', headingDelta: 30, altitudeDelta: 0, speedDelta: 0 },
  { type: 'TURN_LEFT', label: 'TURN LEFT 30°', headingDelta: -30, altitudeDelta: 0, speedDelta: 0 },
  { type: 'CLIMB', label: 'CLIMB +2,000 FT', headingDelta: 0, altitudeDelta: 2000, speedDelta: 0 },
  { type: 'DESCEND', label: 'DESCEND -2,000 FT', headingDelta: 0, altitudeDelta: -2000, speedDelta: 0 },
  { type: 'TURN_RIGHT', label: 'TURN RIGHT 15°', headingDelta: 15, altitudeDelta: 0, speedDelta: 0 },
  { type: 'TURN_LEFT', label: 'TURN LEFT 15°', headingDelta: -15, altitudeDelta: 0, speedDelta: 0 },
  { type: 'SPEED_REDUCE', label: 'REDUCE SPEED -60 KTS', headingDelta: 0, altitudeDelta: 0, speedDelta: -60 },
];

/**
 * Simulates a hypothetical candidate maneuver and evaluates resulting traffic, weather,
 * and restricted airspace risks.
 */
export function evaluateCandidateManeuver(
  aircraft: Aircraft,
  allAircraft: Aircraft[],
  weatherZones: WeatherZone[],
  restrictedZones: RestrictedZone[],
  candidateDef: CandidateDef
): ManeuverCandidate {
  let newHeading = (aircraft.heading + candidateDef.headingDelta) % 360;
  if (newHeading < 0) newHeading += 360;

  const newAltitude = Math.max(10000, Math.min(45000, aircraft.altitude + candidateDef.altitudeDelta));
  const newSpeed = Math.max(250, Math.min(850, aircraft.speed + candidateDef.speedDelta));

  const simulatedAircraft: Aircraft = {
    ...aircraft,
    heading: newHeading,
    altitude: newAltitude,
    targetAltitude: newAltitude,
    speed: newSpeed,
  };

  // 1. Evaluate Traffic Conflict under Candidate Maneuver
  let minCpaDist = 999;
  let highestTrafficRiskScore = 0;
  let trafficVeto = false;
  let trafficVetoReason = '';

  for (const other of allAircraft) {
    if (other.id === aircraft.id) continue;
    const pred = predictPairwiseCollision(simulatedAircraft, other);

    if (pred.predictedClosestDistance < minCpaDist && !pred.isDiverging) {
      minCpaDist = pred.predictedClosestDistance;
    }

    if (pred.conflictDetected) {
      if (pred.collisionRisk === 'CRITICAL') {
        highestTrafficRiskScore = Math.max(highestTrafficRiskScore, 95);
        if (pred.predictedClosestDistance < 30 && pred.altitudeDifference < 1000) {
          trafficVeto = true;
          trafficVetoReason = `Collision conflict with ${other.callsign} (CPA: ${pred.predictedClosestDistance}px in ${pred.timeToClosestApproach}s)`;
        }
      } else if (pred.collisionRisk === 'HIGH_RISK') {
        highestTrafficRiskScore = Math.max(highestTrafficRiskScore, 70);
      } else if (pred.collisionRisk === 'WARNING') {
        highestTrafficRiskScore = Math.max(highestTrafficRiskScore, 40);
      }
    }
  }

  // 2. Evaluate Weather Hazard under Candidate Maneuver
  let minWxDist = 800;
  let highestWeatherRiskScore = 0;
  let weatherVeto = false;
  let weatherVetoReason = '';

  for (const zone of weatherZones) {
    if (!zone.isActive) continue;
    const inter = predictAircraftWeatherInteraction(simulatedAircraft, zone);

    if (inter.distanceToZone < minWxDist) {
      minWxDist = inter.distanceToZone;
    }

    if (inter.weatherRisk === 'CRITICAL') {
      highestWeatherRiskScore = Math.max(highestWeatherRiskScore, 90);
      if (inter.predictedExposure && inter.timeToEntry !== null && inter.timeToEntry <= 45) {
        weatherVeto = true;
        weatherVetoReason = `Steers directly into ${zone.name} in ${inter.timeToEntry}s`;
      }
    } else if (inter.weatherRisk === 'HIGH') {
      highestWeatherRiskScore = Math.max(highestWeatherRiskScore, 65);
    } else if (inter.weatherRisk === 'MODERATE') {
      highestWeatherRiskScore = Math.max(highestWeatherRiskScore, 35);
    } else if (inter.weatherRisk === 'LOW') {
      highestWeatherRiskScore = Math.max(highestWeatherRiskScore, 15);
    }
  }

  // 3. Evaluate Restricted Airspace under Candidate Maneuver
  let minRestrictedDist = 800;
  let airspaceRiskScore = 0;
  let airspaceVeto = false;
  let airspaceVetoReason = '';

  for (const rz of restrictedZones) {
    const dx = aircraft.x - rz.center.x;
    const dy = aircraft.y - rz.center.y;
    const dist = Math.max(0, Math.sqrt(dx * dx + dy * dy) - rz.radius);
    if (dist < minRestrictedDist) {
      minRestrictedDist = dist;
    }
    if (dist <= 35) {
      airspaceRiskScore = 80;
      airspaceVeto = true;
      airspaceVetoReason = `Penetrates ${rz.name}`;
    }
  }

  // Flight Envelope Veto check
  if (aircraft.altitude + candidateDef.altitudeDelta < 10000) {
    airspaceVeto = true;
    airspaceVetoReason = 'Descends below minimum sector altitude (FL100)';
  } else if (aircraft.altitude + candidateDef.altitudeDelta > 43000) {
    airspaceVeto = true;
    airspaceVetoReason = 'Exceeds maximum operational ceiling (FL430)';
  }

  // Calculate Combined Multi-Factor Maneuver Risk Score (0 - 100%)
  let totalRisk = Math.max(highestTrafficRiskScore, highestWeatherRiskScore, airspaceRiskScore);
  if (candidateDef.type !== 'CONTINUE' && totalRisk < 15) {
    // Minor maneuver effort penalty to prevent unnecessary small turns when already clear
    totalRisk = 10;
  }

  const isViable = !trafficVeto && !weatherVeto && !airspaceVeto;
  const vetoReason = trafficVetoReason || weatherVetoReason || airspaceVetoReason;

  return {
    id: `maneuver_${candidateDef.label.replace(/\s+/g, '_').toLowerCase()}`,
    type: candidateDef.type,
    label: candidateDef.label,
    headingDelta: candidateDef.headingDelta,
    altitudeDelta: candidateDef.altitudeDelta,
    speedDelta: candidateDef.speedDelta,
    projectedTrafficRisk: highestTrafficRiskScore,
    projectedWeatherRisk: highestWeatherRiskScore,
    projectedAirspaceRisk: airspaceRiskScore,
    totalManeuverRisk: Math.min(100, Math.round(totalRisk)),
    resultingClosestSeparation: Math.round(minCpaDist),
    resultingWeatherDistance: Math.round(minWxDist),
    isViable,
    vetoReason: !isViable ? vetoReason : undefined,
  };
}

/**
 * Evaluates all candidate maneuvers for the aircraft and ranks them by lowest risk
 */
export function evaluateAllManeuvers(
  aircraft: Aircraft,
  allAircraft: Aircraft[],
  weatherZones: WeatherZone[],
  restrictedZones: RestrictedZone[]
): ManeuverCandidate[] {
  const evaluated = STANDARD_CANDIDATES.map((cand) =>
    evaluateCandidateManeuver(aircraft, allAircraft, weatherZones, restrictedZones, cand)
  );

  // Sort viable options first with lowest risk, then non-viable
  evaluated.sort((a, b) => {
    if (a.isViable && !b.isViable) return -1;
    if (!a.isViable && b.isViable) return 1;
    return a.totalManeuverRisk - b.totalManeuverRisk;
  });

  return evaluated;
}
