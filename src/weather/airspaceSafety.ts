import type { Aircraft } from '../types/aircraft';
import type { CollisionPrediction, CollisionRiskLevel } from '../types/collision';
import type {
  AircraftWeatherInteraction,
  WeatherRiskLevel,
  WeatherZone,
} from '../types/weather';
import type {
  AirspaceOverviewSummary,
  AirspaceSectorData,
  DynamicAirspaceSector,
  OverallSafetyLevel,
  RestrictedZone,
  TrafficDensityLevel,
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

export interface SectorDefinition {
  id: string;
  code: string;
  name: string;
  minXFrac: number;
  maxXFrac: number;
  minYFrac: number;
  maxYFrac: number;
}

export const ATC_SECTOR_DEFS: SectorDefinition[] = [
  { id: 'sec_nw', code: 'SEC-01', name: 'Northwest Airway Corridor', minXFrac: 0, maxXFrac: 0.333, minYFrac: 0, maxYFrac: 0.5 },
  { id: 'sec_nc', code: 'SEC-02', name: 'North Central Corridor', minXFrac: 0.333, maxXFrac: 0.666, minYFrac: 0, maxYFrac: 0.5 },
  { id: 'sec_ne', code: 'SEC-03', name: 'Northeast Terminal Approach', minXFrac: 0.666, maxXFrac: 1.0, minYFrac: 0, maxYFrac: 0.5 },
  { id: 'sec_sw', code: 'SEC-04', name: 'Southwest Transit Sector', minXFrac: 0, maxXFrac: 0.333, minYFrac: 0.5, maxYFrac: 1.0 },
  { id: 'sec_sc', code: 'SEC-05', name: 'Central Terminal Control Area (TMA)', minXFrac: 0.333, maxXFrac: 0.666, minYFrac: 0.5, maxYFrac: 1.0 },
  { id: 'sec_se', code: 'SEC-06', name: 'Southeast En-Route Sector', minXFrac: 0.666, maxXFrac: 1.0, minYFrac: 0.5, maxYFrac: 1.0 },
];

/**
 * Evaluates the 6 realistic ATC airspace sectors for traffic density, weather, risk, and restricted zones
 */
export function evaluateAirspaceSectors(
  aircraftList: Aircraft[],
  weatherZones: WeatherZone[] = [],
  restrictedZones: RestrictedZone[] = [],
  conflicts: CollisionPrediction[] = [],
  bounds: { width: number; height: number } = { width: 1000, height: 750 }
): { sectors: AirspaceSectorData[]; overview: AirspaceOverviewSummary } {
  const sectors: AirspaceSectorData[] = [];
  let totalConflicts = conflicts.length;
  let activeWeatherCount = weatherZones.filter((w) => w.isActive).length;

  for (const def of ATC_SECTOR_DEFS) {
    const minX = def.minXFrac * bounds.width;
    const maxX = def.maxXFrac * bounds.width;
    const minY = def.minYFrac * bounds.height;
    const maxY = def.maxYFrac * bounds.height;
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    // Aircraft in this sector
    const sectorAircraft = aircraftList.filter(
      (ac) => ac.x >= minX && ac.x < maxX && ac.y >= minY && ac.y < maxY
    );
    const aircraftIds = sectorAircraft.map((ac) => ac.id);
    const count = sectorAircraft.length;

    // Density level calculation
    let densityLevel: TrafficDensityLevel = 'LOW';
    if (count >= 5) densityLevel = 'CRITICAL';
    else if (count >= 3) densityLevel = 'HIGH';
    else if (count >= 2) densityLevel = 'MODERATE';

    // Sector restricted check
    let isRestricted = false;
    for (const rz of restrictedZones) {
      const dx = Math.max(0, Math.abs(centerX - rz.center.x) - width / 2);
      const dy = Math.max(0, Math.abs(centerY - rz.center.y) - height / 2);
      if (Math.sqrt(dx * dx + dy * dy) <= rz.radius) {
        isRestricted = true;
        break;
      }
    }

    // Sector weather status
    let weatherStatus: 'CLEAR' | 'MODERATE' | 'SEVERE' = 'CLEAR';
    for (const wz of weatherZones) {
      if (!wz.isActive) continue;
      const dx = Math.max(0, Math.abs(centerX - wz.center.x) - width / 2);
      const dy = Math.max(0, Math.abs(centerY - wz.center.y) - height / 2);
      if (Math.sqrt(dx * dx + dy * dy) <= wz.radius) {
        if (wz.severity === 'CRITICAL' || wz.type === 'THUNDERSTORM') {
          weatherStatus = 'SEVERE';
        } else if (weatherStatus !== 'SEVERE') {
          weatherStatus = 'MODERATE';
        }
      }
    }

    // Sector active conflicts
    const sectorConflicts = conflicts.filter((c) =>
      aircraftIds.includes(c.aircraftA.id) || aircraftIds.includes(c.aircraftB.id)
    );

    // Sector risk level
    let riskLevel: AirspaceSectorData['riskLevel'] = 'SAFE';
    if (isRestricted) {
      riskLevel = 'RESTRICTED';
    } else if (
      sectorConflicts.some((c) => c.collisionRisk === 'CRITICAL') ||
      weatherStatus === 'SEVERE'
    ) {
      riskLevel = 'DANGER';
    } else if (
      sectorConflicts.some((c) => c.collisionRisk === 'HIGH_RISK') ||
      densityLevel === 'CRITICAL'
    ) {
      riskLevel = 'HIGH_RISK';
    } else if (
      sectorConflicts.some((c) => c.collisionRisk === 'WARNING') ||
      weatherStatus === 'MODERATE' ||
      densityLevel === 'HIGH'
    ) {
      riskLevel = 'CAUTION';
    }

    sectors.push({
      id: def.id,
      code: def.code,
      name: def.name,
      x: minX,
      y: minY,
      width,
      height,
      aircraftIds,
      aircraftCount: count,
      densityLevel,
      weatherStatus,
      riskLevel,
      isRestricted,
      activeConflictsCount: sectorConflicts.length,
    });
  }

  // Global Airspace Risk Score (0-100) and traffic density rating
  const fleetCount = aircraftList.length;
  let globalDensityRating: TrafficDensityLevel = 'LOW';
  if (fleetCount >= 9) globalDensityRating = 'CRITICAL';
  else if (fleetCount >= 6) globalDensityRating = 'HIGH';
  else if (fleetCount >= 3) globalDensityRating = 'MODERATE';

  let riskScore = 10;
  if (totalConflicts > 0) {
    const hasCritical = conflicts.some((c) => c.collisionRisk === 'CRITICAL');
    const hasHigh = conflicts.some((c) => c.collisionRisk === 'HIGH_RISK');
    riskScore += hasCritical ? 60 : hasHigh ? 40 : 20;
  }
  if (activeWeatherCount > 0) {
    riskScore += activeWeatherCount * 12;
  }
  if (globalDensityRating === 'CRITICAL') riskScore += 20;
  else if (globalDensityRating === 'HIGH') riskScore += 10;

  riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

  let overallAirspaceRiskLevel: OverallSafetyLevel = 'SAFE';
  if (riskScore >= 75) overallAirspaceRiskLevel = 'CRITICAL';
  else if (riskScore >= 55) overallAirspaceRiskLevel = 'HIGH_RISK';
  else if (riskScore >= 35) overallAirspaceRiskLevel = 'WARNING';
  else if (riskScore >= 20) overallAirspaceRiskLevel = 'CAUTION';

  const overview: AirspaceOverviewSummary = {
    activeAircraftCount: fleetCount,
    activeConflictsCount: totalConflicts,
    weatherWarningsCount: activeWeatherCount,
    restrictedZonesCount: restrictedZones.length,
    overallAirspaceRiskScore: riskScore,
    overallAirspaceRiskLevel,
    trafficDensityRating: globalDensityRating,
    sectors,
  };

  return { sectors, overview };
}
