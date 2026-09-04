import type {
  WeatherRiskLevel,
  WeatherSeverity,
  WeatherType,
  WeatherZone,
} from '../types/weather';
import type { Aircraft } from '../types/aircraft';

/**
 * Evaluates whether an aircraft's altitude falls within the active vertical span of a weather zone.
 */
export function isAltitudeWithinWeatherZone(
  aircraftAltitudeFt: number,
  zone: WeatherZone
): boolean {
  return (
    aircraftAltitudeFt >= zone.minAltitudeFt &&
    aircraftAltitudeFt <= zone.maxAltitudeFt
  );
}

/**
 * Computes deterministic weather risk level factoring in:
 * - Weather zone severity
 * - Weather type (e.g. THUNDERSTORM vs RAIN)
 * - Wind speed & visibility
 * - Aircraft altitude overlap
 * - Current exposure (inside zone) vs Predicted exposure (time to entry)
 */
export function calculateWeatherRisk(
  aircraft: Aircraft,
  zone: WeatherZone,
  currentExposure: boolean,
  predictedExposure: boolean,
  timeToEntry: number | null
): WeatherRiskLevel {
  if (!zone.isActive) {
    return 'SAFE';
  }

  // If the aircraft altitude is completely clear of the weather zone's ceiling/floor,
  // there is no physical hazard (e.g., cruising at FL380 over low-altitude surface fog)
  const altitudeOverlaps = isAltitudeWithinWeatherZone(aircraft.altitude, zone);
  if (!altitudeOverlaps) {
    return 'SAFE';
  }

  // Base severity weight from weather zone configuration
  const severityBase: Record<WeatherSeverity, number> = {
    SAFE: 0,
    LOW: 1,
    MODERATE: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  // Weather type multipliers
  const typeWeight: Record<WeatherType, number> = {
    CLEAR: 0,
    RAIN: 1,
    LOW_VISIBILITY: 2,
    HEAVY_RAIN: 2,
    STORM: 3,
    THUNDERSTORM: 4,
  };

  // High wind (> 80 km/h) or low visibility (< 1.5 km) escalates danger
  let hazardScore = Math.max(severityBase[zone.severity], typeWeight[zone.type]);

  if (zone.windSpeed >= 80 || zone.visibility < 1.5) {
    hazardScore = Math.min(hazardScore + 1, 4);
  }

  // Proximity / Exposure modulation
  if (currentExposure) {
    // Aircraft is currently inside the active weather volume
    if (hazardScore >= 3) return 'CRITICAL';
    if (hazardScore === 2) return 'HIGH';
    if (hazardScore === 1) return 'MODERATE';
    return 'SAFE';
  }

  if (predictedExposure && timeToEntry !== null) {
    // Imminent entry (< 30s)
    if (timeToEntry <= 30) {
      if (hazardScore >= 3) return 'CRITICAL';
      if (hazardScore === 2) return 'HIGH';
      if (hazardScore === 1) return 'MODERATE';
      return 'LOW';
    }
    // High alert horizon (30s - 60s)
    if (timeToEntry <= 60) {
      if (hazardScore >= 3) return 'HIGH';
      if (hazardScore === 2) return 'MODERATE';
      return 'LOW';
    }
    // Warning alert horizon (60s - 120s)
    if (timeToEntry <= 120) {
      if (hazardScore >= 3) return 'MODERATE';
      if (hazardScore === 2) return 'LOW';
      return 'LOW';
    }
  }

  return 'SAFE';
}
