import type { Aircraft } from '../types/aircraft';
import type {
  AircraftWeatherInteraction,
  WeatherRiskLevel,
  WeatherSummary,
  WeatherZone,
} from '../types/weather';
import { calculateVelocity, SPEED_SCALE_FACTOR } from '../simulation/movement';
import { calculateWeatherRisk, isAltitudeWithinWeatherZone } from './weatherRisk';

export const DEFAULT_WEATHER_LOOKAHEAD_SECONDS = 120; // 2-minute weather lookahead

/**
 * Deterministically calculates the interaction between an aircraft and a weather zone
 * using analytical ray-circle quadratic intersection.
 */
export function predictAircraftWeatherInteraction(
  aircraft: Aircraft,
  zone: WeatherZone,
  lookaheadSeconds: number = DEFAULT_WEATHER_LOOKAHEAD_SECONDS
): AircraftWeatherInteraction {
  const d0x = aircraft.x - zone.center.x;
  const d0y = aircraft.y - zone.center.y;
  const distanceToCenter = Math.sqrt(d0x * d0x + d0y * d0y);
  const distanceToZone = Math.max(0, distanceToCenter - zone.radius);

  const altitudeOverlap = isAltitudeWithinWeatherZone(aircraft.altitude, zone);
  const currentlyInsideCircle = distanceToCenter <= zone.radius;
  const currentExposure = currentlyInsideCircle && altitudeOverlap && zone.isActive;

  // Velocity components in pixels per second
  const v = calculateVelocity(aircraft.speed, aircraft.heading);
  const vx = v.vx * SPEED_SCALE_FACTOR;
  const vy = v.vy * SPEED_SCALE_FACTOR;

  const vSquared = vx * vx + vy * vy;
  const dotProduct = d0x * vx + d0y * vy;

  let timeToEntry: number | null = null;
  let timeToExit: number | null = null;
  let predictedExposure = false;
  let closestDistanceToPerimeter = distanceToZone;

  if (vSquared > 1e-7) {
    // 1. Closest Point of Approach (CPA) to zone center
    const tCpa = -dotProduct / vSquared;
    if (tCpa > 0) {
      const cpaX = d0x + vx * tCpa;
      const cpaY = d0y + vy * tCpa;
      const cpaDistToCenter = Math.sqrt(cpaX * cpaX + cpaY * cpaY);
      closestDistanceToPerimeter = Math.max(0, cpaDistToCenter - zone.radius);
    } else {
      closestDistanceToPerimeter = distanceToZone;
    }

    // 2. Analytical Quadratic Intersection with Weather Circle
    const A = vSquared;
    const B = 2 * dotProduct;
    const C = d0x * d0x + d0y * d0y - zone.radius * zone.radius;
    const discriminant = B * B - 4 * A * C;

    if (currentlyInsideCircle) {
      // Aircraft is already inside the zone
      timeToEntry = 0;
      if (discriminant >= 0) {
        const sqrtDisc = Math.sqrt(discriminant);
        const t2 = (-B + sqrtDisc) / (2 * A);
        timeToExit = Math.max(0, Math.round(t2));
      }
      predictedExposure = zone.isActive && altitudeOverlap;
    } else if (discriminant >= 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      const t1 = (-B - sqrtDisc) / (2 * A);
      const t2 = (-B + sqrtDisc) / (2 * A);

      // Check if entry occurs forward in time within the lookahead horizon
      if (t1 > 0 && t1 <= lookaheadSeconds) {
        timeToEntry = Math.round(t1);
        timeToExit = Math.round(t2);
        predictedExposure = zone.isActive && altitudeOverlap;
      }
    }
  }

  const weatherRisk = calculateWeatherRisk(
    aircraft,
    zone,
    currentExposure,
    predictedExposure,
    timeToEntry
  );

  let message = '';
  if (currentExposure) {
    message = `${aircraft.callsign} inside ${zone.name} (${zone.type}) — ${weatherRisk} risk`;
  } else if (predictedExposure && timeToEntry !== null) {
    message = `${aircraft.callsign} approaching ${zone.name} in ${timeToEntry}s (${distanceToZone.toFixed(0)}px) — ${weatherRisk} risk`;
  } else {
    message = `${aircraft.callsign} clear of ${zone.name}`;
  }

  return {
    aircraftId: aircraft.id,
    aircraftCallsign: aircraft.callsign,
    weatherZoneId: zone.id,
    zoneName: zone.name,
    zoneType: zone.type,
    zoneSeverity: zone.severity,
    currentExposure,
    predictedExposure,
    distanceToZone: Math.round(distanceToZone * 10) / 10,
    distanceToCenter: Math.round(distanceToCenter * 10) / 10,
    timeToEntry,
    timeToExit,
    weatherRisk,
    closestDistance: Math.round(closestDistanceToPerimeter * 10) / 10,
    altitudeOverlap,
    message,
  };
}

/**
 * Evaluates all aircraft in the airspace against all active weather zones.
 */
export function evaluateAirspaceWeather(
  aircraftList: Aircraft[],
  weatherZones: WeatherZone[],
  lookaheadSeconds: number = DEFAULT_WEATHER_LOOKAHEAD_SECONDS
): WeatherSummary {
  const interactions: AircraftWeatherInteraction[] = [];
  const affectedAircraftSet = new Set<string>();
  let stormCount = 0;
  let highRiskZonesCount = 0;

  for (const zone of weatherZones) {
    if (zone.isActive) {
      if (zone.type === 'STORM' || zone.type === 'THUNDERSTORM') {
        stormCount++;
      }
      if (zone.severity === 'HIGH' || zone.severity === 'CRITICAL') {
        highRiskZonesCount++;
      }
    }

    for (const ac of aircraftList) {
      const interaction = predictAircraftWeatherInteraction(ac, zone, lookaheadSeconds);
      if (interaction.weatherRisk !== 'SAFE' || interaction.predictedExposure) {
        interactions.push(interaction);
        affectedAircraftSet.add(ac.id);
      }
    }
  }

  // Sort interactions by highest urgency (CRITICAL first, then lowest time to entry)
  const riskRank: Record<WeatherRiskLevel, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MODERATE: 2,
    LOW: 1,
    SAFE: 0,
  };

  interactions.sort((a, b) => {
    if (riskRank[a.weatherRisk] !== riskRank[b.weatherRisk]) {
      return riskRank[b.weatherRisk] - riskRank[a.weatherRisk];
    }
    const tA = a.timeToEntry ?? 9999;
    const tB = b.timeToEntry ?? 9999;
    return tA - tB;
  });

  const highestWeatherRisk = interactions.length > 0 ? interactions[0].weatherRisk : 'SAFE';

  return {
    totalZones: weatherZones.length,
    activeZones: weatherZones.filter((z) => z.isActive).length,
    stormCount,
    highRiskZonesCount,
    affectedAircraftCount: affectedAircraftSet.size,
    highestWeatherRisk,
    zoneInteractions: interactions,
  };
}
