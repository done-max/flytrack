import type { Aircraft } from '../types/aircraft';
import type { CollisionPrediction, CollisionRiskLevel } from '../types/collision';
import type {
  AircraftWeatherInteraction,
  WeatherRiskLevel,
  WeatherZone,
} from '../types/weather';
import type {
  DynamicAirspaceSector,
  OverallSafetyLevel,
  RestrictedZone,
  UnifiedAircraftSafety,
} from '../types/safety';

/**
 * Combines collision risk and weather risk into an overall safety level
 */
export function determineOverallSafety(
  collisionRisk: CollisionRiskLevel,
  weatherRisk: WeatherRiskLevel
): {
  overallSafety: OverallSafetyLevel;
  primaryHazard: 'NONE' | 'COLLISION' | 'WEATHER' | 'COMBINED';
} {
  const collisionWeight: Record<CollisionRiskLevel, number> = {
    SAFE: 0,
    WARNING: 2,
    HIGH_RISK: 3,
    CRITICAL: 4,
  };

  const weatherWeight: Record<WeatherRiskLevel, number> = {
    SAFE: 0,
    LOW: 1,
    MODERATE: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  const cScore = collisionWeight[collisionRisk] || 0;
  const wScore = weatherWeight[weatherRisk] || 0;
  const maxScore = Math.max(cScore, wScore);

  let primaryHazard: 'NONE' | 'COLLISION' | 'WEATHER' | 'COMBINED' = 'NONE';
  if (cScore > 0 && wScore > 0) {
    primaryHazard = 'COMBINED';
  } else if (cScore > 0) {
    primaryHazard = 'COLLISION';
  } else if (wScore > 0) {
    primaryHazard = 'WEATHER';
  }

  let overallSafety: OverallSafetyLevel = 'SAFE';
  if (maxScore >= 4) overallSafety = 'CRITICAL';
  else if (maxScore === 3) overallSafety = 'HIGH_RISK';
  else if (maxScore === 2) overallSafety = 'WARNING';
  else if (maxScore === 1) overallSafety = 'CAUTION';

  return { overallSafety, primaryHazard };
}

/**
 * Evaluates unified safety telemetry for all aircraft in the sector
 */
export function evaluateUnifiedAirspaceSafety(
  aircraftList: Aircraft[],
  conflicts: CollisionPrediction[],
  weatherInteractions: AircraftWeatherInteraction[]
): Map<string, UnifiedAircraftSafety> {
  const safetyMap = new Map<string, UnifiedAircraftSafety>();

  for (const ac of aircraftList) {
    // Find all active conflicts involving this aircraft
    const acConflicts = conflicts.filter(
      (c) => c.aircraftA.id === ac.id || c.aircraftB.id === ac.id
    );
    let highestCollisionRisk: CollisionRiskLevel = 'SAFE';
    for (const c of acConflicts) {
      if (c.collisionRisk === 'CRITICAL') highestCollisionRisk = 'CRITICAL';
      else if (c.collisionRisk === 'HIGH_RISK' && highestCollisionRisk !== 'CRITICAL')
        highestCollisionRisk = 'HIGH_RISK';
      else if (
        c.collisionRisk === 'WARNING' &&
        highestCollisionRisk !== 'CRITICAL' &&
        highestCollisionRisk !== 'HIGH_RISK'
      )
        highestCollisionRisk = 'WARNING';
    }

    // Find all weather interactions for this aircraft
    const acWeather = weatherInteractions.filter((w) => w.aircraftId === ac.id);
    let highestWeatherRisk: WeatherRiskLevel = 'SAFE';
    for (const w of acWeather) {
      if (w.weatherRisk === 'CRITICAL') highestWeatherRisk = 'CRITICAL';
      else if (w.weatherRisk === 'HIGH' && highestWeatherRisk !== 'CRITICAL')
        highestWeatherRisk = 'HIGH';
      else if (
        w.weatherRisk === 'MODERATE' &&
        highestWeatherRisk !== 'CRITICAL' &&
        highestWeatherRisk !== 'HIGH'
      )
        highestWeatherRisk = 'MODERATE';
      else if (w.weatherRisk === 'LOW' && highestWeatherRisk === 'SAFE')
        highestWeatherRisk = 'LOW';
    }

    const { overallSafety, primaryHazard } = determineOverallSafety(
      highestCollisionRisk,
      highestWeatherRisk
    );

    let summaryMessage = 'Airspace nominal — standard separation maintained';
    if (primaryHazard === 'COMBINED') {
      summaryMessage = `COMBINED HAZARD: STCA Conflict (${highestCollisionRisk}) & Severe Weather (${highestWeatherRisk})`;
    } else if (primaryHazard === 'COLLISION') {
      summaryMessage = `COLLISION HAZARD: Loss of separation predicted (${highestCollisionRisk})`;
    } else if (primaryHazard === 'WEATHER') {
      summaryMessage = `WEATHER HAZARD: ${acWeather[0]?.zoneName || 'Adverse weather'} exposure (${highestWeatherRisk})`;
    }

    safetyMap.set(ac.id, {
      aircraftId: ac.id,
      callsign: ac.callsign,
      collisionRisk: highestCollisionRisk,
      weatherRisk: highestWeatherRisk,
      overallSafety,
      primaryHazard,
      weatherInteractions: acWeather,
      activeConflicts: acConflicts,
      summaryMessage,
    });
  }

  return safetyMap;
}

/**
 * Computes dynamic safe airspace grid sectors across the airspace dimensions
 */
export function generateDynamicAirspaceGrid(
  width: number,
  height: number,
  weatherZones: WeatherZone[],
  restrictedZones: RestrictedZone[],
  conflicts: CollisionPrediction[],
  _aircraftList: Aircraft[],
  cols: number = 10,
  rows: number = 8
): DynamicAirspaceSector[] {
  const sectors: DynamicAirspaceSector[] = [];
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellX = c * cellWidth;
      const cellY = r * cellHeight;
      const centerX = cellX + cellWidth / 2;
      const centerY = cellY + cellHeight / 2;

      let isRestricted = false;
      let hasWeatherHazard = false;
      let hasTrafficHazard = false;
      let sectorStatus: DynamicAirspaceSector['status'] = 'SAFE';

      // 1. Check Restricted Airspace
      for (const rz of restrictedZones) {
        const dx = centerX - rz.center.x;
        const dy = centerY - rz.center.y;
        if (Math.sqrt(dx * dx + dy * dy) <= rz.radius + cellWidth * 0.4) {
          isRestricted = true;
          sectorStatus = 'RESTRICTED';
          break;
        }
      }

      if (!isRestricted) {
        // 2. Check Weather Zones
        for (const wz of weatherZones) {
          if (!wz.isActive) continue;
          const dx = centerX - wz.center.x;
          const dy = centerY - wz.center.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= wz.radius + cellWidth * 0.3) {
            hasWeatherHazard = true;
            if (wz.severity === 'CRITICAL' || wz.type === 'THUNDERSTORM') {
              sectorStatus = 'DANGER';
            } else if (wz.severity === 'HIGH' || wz.type === 'STORM') {
              if (sectorStatus !== 'DANGER') sectorStatus = 'HIGH_RISK';
            } else if (wz.severity === 'MODERATE' || wz.type === 'HEAVY_RAIN') {
              if (sectorStatus !== 'DANGER' && sectorStatus !== 'HIGH_RISK') sectorStatus = 'CAUTION';
            }
          }
        }

        // 3. Check Collision Conflict zones & Aircraft proximity
        for (const conf of conflicts) {
          const midCpaX = (conf.cpaPointA.x + conf.cpaPointB.x) / 2;
          const midCpaY = (conf.cpaPointA.y + conf.cpaPointB.y) / 2;
          const dx = centerX - midCpaX;
          const dy = centerY - midCpaY;

          if (Math.sqrt(dx * dx + dy * dy) <= 60) {
            hasTrafficHazard = true;
            if (conf.collisionRisk === 'CRITICAL') {
              sectorStatus = 'DANGER';
            } else if (conf.collisionRisk === 'HIGH_RISK') {
              if (sectorStatus !== 'DANGER') sectorStatus = 'HIGH_RISK';
            } else if (conf.collisionRisk === 'WARNING') {
              if (sectorStatus !== 'DANGER' && sectorStatus !== 'HIGH_RISK') sectorStatus = 'CAUTION';
            }
          }
        }
      }

      sectors.push({
        id: `sector_${c}_${r}`,
        gridX: c,
        gridY: r,
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        status: sectorStatus,
        hasWeatherHazard,
        hasTrafficHazard,
        isRestricted,
      });
    }
  }

  return sectors;
}
