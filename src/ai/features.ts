import type { Aircraft } from '../types/aircraft';
import type { CollisionPrediction } from '../types/collision';
import type { AircraftWeatherInteraction, WeatherZone } from '../types/weather';
import type { RestrictedZone } from '../types/safety';
import type { AIFeatureVector } from '../types/ai';

export const FEATURE_BOUNDS: Record<keyof AIFeatureVector, { min: number; max: number }> = {
  currentSeparationDistance: { min: 0, max: 1000 },
  predictedClosestSeparation: { min: 0, max: 500 },
  timeToClosestApproach: { min: 0, max: 120 },
  altitudeDifference: { min: 0, max: 10000 },
  relativeSpeed: { min: 0, max: 1500 },
  headingDifference: { min: 0, max: 180 },
  weatherSeverity: { min: 0, max: 4 },
  windSpeed: { min: 0, max: 150 },
  visibility: { min: 0, max: 15 },
  distanceToWeather: { min: 0, max: 800 },
  timeToWeatherEntry: { min: 0, max: 120 },
  trafficDensity: { min: 0, max: 10 },
  restrictedProximity: { min: 0, max: 800 },
  availableManeuverOptionsCount: { min: 0, max: 8 },
};

/**
 * Normalizes a raw feature value between 0.0 and 1.0 using min-max scaling
 */
export function normalizeFeature(value: number, featureName: keyof AIFeatureVector): number {
  const { min, max } = FEATURE_BOUNDS[featureName];
  if (max === min) return 0.5;
  const clamped = Math.max(min, Math.min(max, value));
  return (clamped - min) / (max - min);
}

/**
 * Normalizes an entire AIFeatureVector into a 0.0 - 1.0 bounded object
 */
export function normalizeFeatureVector(features: AIFeatureVector): Record<string, number> {
  const normalized: Record<string, number> = {};
  for (const key of Object.keys(features) as (keyof AIFeatureVector)[]) {
    normalized[key] = normalizeFeature(features[key], key);
  }
  return normalized;
}

/**
 * Converts a feature vector to a flat numerical array in fixed index order
 */
export function featureVectorToArray(features: AIFeatureVector): number[] {
  return [
    features.currentSeparationDistance,
    features.predictedClosestSeparation,
    features.timeToClosestApproach,
    features.altitudeDifference,
    features.relativeSpeed,
    features.headingDifference,
    features.weatherSeverity,
    features.windSpeed,
    features.visibility,
    features.distanceToWeather,
    features.timeToWeatherEntry,
    features.trafficDensity,
    features.restrictedProximity,
    features.availableManeuverOptionsCount,
  ];
}

/**
 * Extracts a complete AIFeatureVector for an aircraft in the live airspace situation
 */
export function extractAIFeatures(
  aircraft: Aircraft,
  allAircraft: Aircraft[],
  conflicts: CollisionPrediction[],
  weatherInteractions: AircraftWeatherInteraction[],
  weatherZones: WeatherZone[],
  restrictedZones: RestrictedZone[]
): AIFeatureVector {
  // 1. Traffic Proximity & Conflict Telemetry
  const acConflicts = conflicts.filter(
    (c) => c.aircraftA.id === aircraft.id || c.aircraftB.id === aircraft.id
  );

  let nearestTrafficDist = 999;
  let minPredictedDist = 999;
  let minTimeToCpa = 999;
  let altDiffAtCpa = 10000;
  let relSpeedKnots = 0;
  let headingDiffDeg = 0;
  let trafficDensityCount = 0;

  for (const other of allAircraft) {
    if (other.id === aircraft.id) continue;
    const dx = other.x - aircraft.x;
    const dy = other.y - aircraft.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < nearestTrafficDist) {
      nearestTrafficDist = dist;
    }
    if (dist <= 300) {
      trafficDensityCount++;
    }
  }

  if (acConflicts.length > 0) {
    // Pick the most urgent conflict (lowest time to CPA or closest distance)
    const urgent = acConflicts[0];
    minPredictedDist = urgent.predictedClosestDistance;
    minTimeToCpa = urgent.timeToClosestApproach;
    altDiffAtCpa = urgent.altitudeDifference;
    relSpeedKnots = urgent.relativeVelocity.relativeSpeed;

    const otherAc = urgent.aircraftA.id === aircraft.id ? urgent.aircraftB : urgent.aircraftA;
    const hdgDiff = Math.abs(aircraft.heading - otherAc.heading);
    headingDiffDeg = hdgDiff > 180 ? 360 - hdgDiff : hdgDiff;
  } else if (nearestTrafficDist < 999) {
    minPredictedDist = nearestTrafficDist;
  }

  // 2. Weather Hazard Features
  const acWeather = weatherInteractions.filter((w) => w.aircraftId === aircraft.id);

  let wxSeverityScore = 0;
  let maxWindSpeed = 0;
  let minVisibility = 15;
  let minDistanceToWx = 800;
  let minTimeToWxEntry = 999;

  const severityMapping = { SAFE: 0, LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };

  for (const wz of weatherZones) {
    if (!wz.isActive) continue;
    const dx = aircraft.x - wz.center.x;
    const dy = aircraft.y - wz.center.y;
    const distToCenter = Math.sqrt(dx * dx + dy * dy);
    const distToPerimeter = Math.max(0, distToCenter - wz.radius);

    if (distToPerimeter < minDistanceToWx) {
      minDistanceToWx = distToPerimeter;
    }
  }

  for (const w of acWeather) {
    const score = severityMapping[w.zoneSeverity] || 0;
    if (score > wxSeverityScore) wxSeverityScore = score;

    const matchedZone = weatherZones.find((z) => z.id === w.weatherZoneId);
    if (matchedZone) {
      if (matchedZone.windSpeed > maxWindSpeed) maxWindSpeed = matchedZone.windSpeed;
      if (matchedZone.visibility < minVisibility) minVisibility = matchedZone.visibility;
    }

    if (w.timeToEntry !== null && w.timeToEntry < minTimeToWxEntry) {
      minTimeToWxEntry = w.timeToEntry;
    }
  }

  // 3. Restricted Airspace Proximity
  let minRestrictedDist = 800;
  for (const rz of restrictedZones) {
    const dx = aircraft.x - rz.center.x;
    const dy = aircraft.y - rz.center.y;
    const distToCenter = Math.sqrt(dx * dx + dy * dy);
    const distToPerimeter = Math.max(0, distToCenter - rz.radius);
    if (distToPerimeter < minRestrictedDist) {
      minRestrictedDist = distToPerimeter;
    }
  }

  // 4. Feasible Maneuver Count Estimation
  let viableOptions = 8;
  if (acConflicts.length > 0) viableOptions -= 3;
  if (minDistanceToWx < 100) viableOptions -= 2;
  if (minRestrictedDist < 100) viableOptions -= 2;
  viableOptions = Math.max(0, Math.min(8, viableOptions));

  return {
    currentSeparationDistance: Math.round(nearestTrafficDist),
    predictedClosestSeparation: Math.round(minPredictedDist),
    timeToClosestApproach: Math.round(minTimeToCpa),
    altitudeDifference: Math.round(altDiffAtCpa),
    relativeSpeed: Math.round(relSpeedKnots),
    headingDifference: Math.round(headingDiffDeg),
    weatherSeverity: wxSeverityScore,
    windSpeed: Math.round(maxWindSpeed),
    visibility: Math.round(minVisibility * 10) / 10,
    distanceToWeather: Math.round(minDistanceToWx),
    timeToWeatherEntry: Math.round(minTimeToWxEntry),
    trafficDensity: trafficDensityCount,
    restrictedProximity: Math.round(minRestrictedDist),
    availableManeuverOptionsCount: viableOptions,
  };
}
