import type { Aircraft, AirspaceDimensions, SimulationSettings } from '../types/aircraft';
import type {
  AirspaceConflictSummary,
  CollisionEvent,
  CollisionPrediction,
  CollisionRiskLevel,
  CollisionThresholds,
} from '../types/collision';
import type {
  AircraftWeatherInteraction,
  WeatherEvent,
  WeatherRiskLevel,
  WeatherSummary,
  WeatherZone,
} from '../types/weather';
import type {
  AirspaceOverviewSummary,
  AirspaceSectorData,
  DynamicAirspaceSector,
  RestrictedZone,
  UnifiedAircraftSafety,
} from '../types/safety';
import { stepAircraft } from './aircraft';
import {
  DEFAULT_COLLISION_THRESHOLDS,
  detectAirspaceCollisions,
  deriveAircraftStatusMap,
} from './collision';
import { calculateVelocity } from './movement';
import { calculatePredictedTrajectory } from './trajectory';
import { evaluateAirspaceWeather } from '../weather/weatherPrediction';
import {
  evaluateUnifiedAirspaceSafety,
  generateDynamicAirspaceGrid,
  evaluateAirspaceSectors,
} from '../weather/airspaceSafety';

export type SimulationTickListener = (
  aircraft: Aircraft[],
  simTimeSeconds: number,
  conflictSummary: AirspaceConflictSummary,
  collisionEvents: CollisionEvent[],
  weatherSummary: WeatherSummary,
  unifiedSafetyMap: Map<string, UnifiedAircraftSafety>,
  dynamicAirspaceSectors: DynamicAirspaceSector[],
  weatherEvents: WeatherEvent[],
  airspaceSectors: AirspaceSectorData[],
  airspaceOverview: AirspaceOverviewSummary
) => void;

export class SimulationEngine {
  private aircraft: Aircraft[] = [];
  private thresholds: CollisionThresholds = { ...DEFAULT_COLLISION_THRESHOLDS };
  private conflictSummary: AirspaceConflictSummary = {
    totalPairsChecked: 0,
    activeConflictsCount: 0,
    criticalCount: 0,
    highRiskCount: 0,
    warningCount: 0,
    highestRiskLevel: 'SAFE',
    conflicts: [],
  };

  private weatherZones: WeatherZone[] = [];
  private restrictedZones: RestrictedZone[] = [];
  private weatherSummary: WeatherSummary = {
    totalZones: 0,
    activeZones: 0,
    stormCount: 0,
    highRiskZonesCount: 0,
    affectedAircraftCount: 0,
    highestWeatherRisk: 'SAFE',
    zoneInteractions: [],
  };

  private unifiedSafetyMap: Map<string, UnifiedAircraftSafety> = new Map();
  private dynamicAirspaceSectors: DynamicAirspaceSector[] = [];
  private airspaceSectors: AirspaceSectorData[] = [];
  private airspaceOverview: AirspaceOverviewSummary = {
    activeAircraftCount: 0,
    activeConflictsCount: 0,
    weatherWarningsCount: 0,
    restrictedZonesCount: 0,
    overallAirspaceRiskScore: 0,
    overallAirspaceRiskLevel: 'SAFE',
    trafficDensityRating: 'LOW',
    sectors: [],
  };

  private collisionEvents: CollisionEvent[] = [];
  private weatherEvents: WeatherEvent[] = [];
  private activeConflictsMap: Map<
    string,
    { risk: CollisionRiskLevel; pairA: Aircraft; pairB: Aircraft }
  > = new Map();
  private activeWeatherMap: Map<
    string,
    { risk: WeatherRiskLevel; currentExposure: boolean; callsign: string; zoneName: string }
  > = new Map();

  private settings: SimulationSettings = {
    isRunning: true,
    simSpeed: 1,
    simTimeSeconds: 0,
    showTrails: true,
    showTrajectories: true,
    showLabels: true,
    showRangeRings: true,
    showSectorGrid: true,
    showWeatherOverlay: true,
    showAirspaceSafetyGrid: false,
    showWaypoints: true,
    radarSweep: true,
    trajectoryPredictionSeconds: 60,
    maxTrailPoints: 40,
  };

  private bounds: AirspaceDimensions = {
    width: 1000,
    height: 750,
    minX: 0,
    maxX: 1000,
    minY: 0,
    maxY: 750,
  };

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private listeners: Set<SimulationTickListener> = new Set();

  constructor(
    initialAircraft: Aircraft[] = [],
    initialWeatherZones: WeatherZone[] = [],
    initialRestrictedZones: RestrictedZone[] = [],
    customThresholds?: Partial<CollisionThresholds>
  ) {
    this.aircraft = [...initialAircraft];
    this.weatherZones = [...initialWeatherZones];
    this.restrictedZones = [...initialRestrictedZones];
    if (customThresholds) {
      this.thresholds = { ...DEFAULT_COLLISION_THRESHOLDS, ...customThresholds };
    }
    // Initialize all safety, sectors, and conflict maps immediately
    this.evaluateAirspaceState();
  }

  public subscribe(listener: SimulationTickListener): () => void {
    this.listeners.add(listener);
    listener(
      this.aircraft,
      this.settings.simTimeSeconds,
      this.conflictSummary,
      this.collisionEvents,
      this.weatherSummary,
      this.unifiedSafetyMap,
      this.dynamicAirspaceSectors,
      this.weatherEvents,
      this.airspaceSectors,
      this.airspaceOverview
    );
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(
        this.aircraft,
        this.settings.simTimeSeconds,
        this.conflictSummary,
        this.collisionEvents,
        this.weatherSummary,
        this.unifiedSafetyMap,
        this.dynamicAirspaceSectors,
        this.weatherEvents,
        this.airspaceSectors,
        this.airspaceOverview
      );
    }
  }

  public start() {
    if (this.settings.isRunning && this.animationFrameId !== null) return;
    this.settings.isRunning = true;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public pause() {
    this.settings.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public togglePlayPause(): boolean {
    if (this.settings.isRunning) {
      this.pause();
    } else {
      this.start();
    }
    return this.settings.isRunning;
  }

  public setSpeed(speedMultiplier: number) {
    this.settings.simSpeed = speedMultiplier;
  }

  public reset(
    newAircraftList?: Aircraft[],
    newWeatherZones?: WeatherZone[],
    newRestrictedZones?: RestrictedZone[]
  ) {
    this.pause();
    this.settings.simTimeSeconds = 0;
    this.collisionEvents = [];
    this.weatherEvents = [];
    this.activeConflictsMap.clear();
    this.activeWeatherMap.clear();

    if (newWeatherZones !== undefined) {
      this.weatherZones = [...newWeatherZones];
    }
    if (newRestrictedZones !== undefined) {
      this.restrictedZones = [...newRestrictedZones];
    }

    if (newAircraftList) {
      this.aircraft = newAircraftList.map((ac) => ({
        ...ac,
        routeHistory: [
          {
            x: ac.x,
            y: ac.y,
            timestamp: Date.now(),
            altitude: ac.altitude,
            speed: ac.speed,
          },
        ],
        predictedTrajectory: calculatePredictedTrajectory(
          ac,
          this.settings.trajectoryPredictionSeconds,
          15
        ),
      }));
    }
    this.updateTick(0.001);
    this.notify();
    this.start();
  }

  public stepManual(deltaSeconds: number = 0.5) {
    this.pause();
    this.updateTick(deltaSeconds);
    this.notify();
  }

  public setSimTime(timeSeconds: number) {
    this.settings.simTimeSeconds = Math.max(0, timeSeconds);
    this.notify();
  }

  public updateAircraftDirect(
    id: string,
    updates: Partial<Pick<Aircraft, 'heading' | 'speed' | 'altitude' | 'targetAltitude' | 'status' | 'callsign'>>
  ) {
    this.aircraft = this.aircraft.map((ac) => {
      if (ac.id !== id) return ac;

      const updated: Aircraft = {
        ...ac,
        ...updates,
      };

      if (updates.speed !== undefined || updates.heading !== undefined) {
        updated.velocity = calculateVelocity(updated.speed, updated.heading);
      }

      // Immediately refresh predicted trajectory
      updated.predictedTrajectory = calculatePredictedTrajectory(
        updated,
        this.settings.trajectoryPredictionSeconds,
        15
      );

      return updated;
    });

    // Re-evaluate conflicts and weather immediately upon manual control
    this.evaluateAirspaceState();
    this.notify();
  }

  public addAircraft(newAc: Aircraft) {
    this.aircraft = [...this.aircraft, newAc];
    this.evaluateAirspaceState();
    this.notify();
  }

  public removeAircraft(id: string) {
    this.aircraft = this.aircraft.filter((ac) => ac.id !== id);
    this.evaluateAirspaceState();
    this.notify();
  }

  public getWeatherZones(): WeatherZone[] {
    return [...this.weatherZones];
  }

  public setWeatherZones(zones: WeatherZone[]) {
    this.weatherZones = [...zones];
    this.evaluateAirspaceState();
    this.notify();
  }

  public toggleWeatherZone(zoneId: string, isActive?: boolean) {
    this.weatherZones = this.weatherZones.map((z) => {
      if (z.id !== zoneId) return z;
      return {
        ...z,
        isActive: isActive !== undefined ? isActive : !z.isActive,
      };
    });
    this.evaluateAirspaceState();
    this.notify();
  }

  public getRestrictedZones(): RestrictedZone[] {
    return [...this.restrictedZones];
  }

  public setRestrictedZones(zones: RestrictedZone[]) {
    this.restrictedZones = [...zones];
    this.evaluateAirspaceState();
    this.notify();
  }

  public getAircraft(): Aircraft[] {
    return this.aircraft;
  }

  public getConflicts(): CollisionPrediction[] {
    return this.conflictSummary.conflicts;
  }

  public getConflictSummary(): AirspaceConflictSummary {
    return { ...this.conflictSummary };
  }

  public getWeatherSummary(): WeatherSummary {
    return { ...this.weatherSummary };
  }

  public getUnifiedSafetyMap(): Map<string, UnifiedAircraftSafety> {
    return new Map(this.unifiedSafetyMap);
  }

  public getDynamicAirspaceSectors(): DynamicAirspaceSector[] {
    return [...this.dynamicAirspaceSectors];
  }

  public getAirspaceSectors(): AirspaceSectorData[] {
    return [...this.airspaceSectors];
  }

  public getAirspaceOverview(): AirspaceOverviewSummary {
    return { ...this.airspaceOverview };
  }

  public getCollisionEvents(): CollisionEvent[] {
    return [...this.collisionEvents];
  }

  public getEvents(): CollisionEvent[] {
    return [...this.collisionEvents];
  }

  public getWeatherEvents(): WeatherEvent[] {
    return [...this.weatherEvents];
  }

  public clearEvents() {
    this.collisionEvents = [];
    this.weatherEvents = [];
    this.notify();
  }

  public getThresholds(): CollisionThresholds {
    return { ...this.thresholds };
  }

  public setThresholds(updates: Partial<CollisionThresholds>) {
    this.thresholds = { ...this.thresholds, ...updates };
    this.evaluateAirspaceState();
    this.notify();
  }

  public getSettings(): SimulationSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SimulationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.notify();
  }

  public getBounds(): AirspaceDimensions {
    return { ...this.bounds };
  }

  public setBounds(bounds: AirspaceDimensions) {
    this.bounds = { ...bounds };
  }

  private loop = (timestamp: number) => {
    if (!this.settings.isRunning) return;

    const elapsedMs = timestamp - (this.lastTimestamp || timestamp);
    this.lastTimestamp = timestamp;

    const deltaSeconds = Math.min(Math.max(elapsedMs / 1000, 0.001), 0.1);

    this.updateTick(deltaSeconds);
    this.notify();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private updateTick(deltaSeconds: number) {
    const effectiveDelta = deltaSeconds * this.settings.simSpeed;
    this.settings.simTimeSeconds += effectiveDelta;

    // 1. Advance movement & history for all aircraft
    this.aircraft = this.aircraft.map((ac) =>
      stepAircraft(
        ac,
        deltaSeconds,
        this.settings.simSpeed,
        this.bounds,
        this.settings.trajectoryPredictionSeconds,
        this.settings.maxTrailPoints
      )
    );

    // 2. Perform multi-factor airspace evaluation
    this.evaluateAirspaceState();
  }

  private evaluateAirspaceState() {
    // 1. Deterministic mathematical pairwise collision detection
    this.conflictSummary = detectAirspaceCollisions(this.aircraft, this.thresholds);
    this.processConflictEvents(this.conflictSummary.conflicts);

    // 2. Deterministic analytical weather interaction evaluation
    this.weatherSummary = evaluateAirspaceWeather(
      this.aircraft,
      this.weatherZones,
      this.thresholds.lookaheadTimeSeconds
    );
    this.processWeatherEvents(this.weatherSummary.zoneInteractions);

    // 3. Unified multi-factor safety evaluation
    this.unifiedSafetyMap = evaluateUnifiedAirspaceSafety(
      this.aircraft,
      this.conflictSummary.conflicts,
      this.weatherSummary.zoneInteractions
    );

    // 4. Update core aircraft status badges
    const statusMap = deriveAircraftStatusMap(this.aircraft, this.conflictSummary.conflicts);
    this.aircraft = this.aircraft.map((ac) => {
      const unified = this.unifiedSafetyMap.get(ac.id);
      let status = statusMap.get(ac.id) || 'NORMAL';

      // Elevate status if weather risk is critical/high
      if (unified) {
        if (unified.overallSafety === 'CRITICAL') status = 'CRITICAL';
        else if (unified.overallSafety === 'HIGH_RISK' && status !== 'CRITICAL') status = 'HIGH_RISK';
        else if (unified.overallSafety === 'WARNING' && status === 'NORMAL') status = 'CAUTION';
      }

      return {
        ...ac,
        status,
      };
    });

    // 5. Compute dynamic safe airspace grid
    this.dynamicAirspaceSectors = generateDynamicAirspaceGrid(
      this.bounds.width,
      this.bounds.height,
      this.weatherZones,
      this.restrictedZones,
      this.conflictSummary.conflicts,
      this.aircraft
    );

    // 6. Compute realistic ATC airspace sectors and traffic density overview
    const sectorEval = evaluateAirspaceSectors(
      this.aircraft,
      this.weatherZones,
      this.restrictedZones,
      this.conflictSummary.conflicts,
      this.bounds
    );
    this.airspaceSectors = sectorEval.sectors;
    this.airspaceOverview = sectorEval.overview;
  }

  private processConflictEvents(currentConflicts: CollisionPrediction[]) {
    const severityRank: Record<CollisionRiskLevel, number> = {
      SAFE: 0,
      WARNING: 1,
      HIGH_RISK: 2,
      CRITICAL: 3,
    };

    const currentPairKeys = new Set<string>();

    for (const conflict of currentConflicts) {
      const idA = conflict.aircraftA.id;
      const idB = conflict.aircraftB.id;
      const pairKey = [idA, idB].sort().join('_');
      currentPairKeys.add(pairKey);

      const prev = this.activeConflictsMap.get(pairKey);

      if (!prev) {
        this.activeConflictsMap.set(pairKey, {
          risk: conflict.collisionRisk,
          pairA: conflict.aircraftA,
          pairB: conflict.aircraftB,
        });

        const newEvent: CollisionEvent = {
          id: `evt_c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          simTimeSeconds: Math.round(this.settings.simTimeSeconds),
          type: 'CONFLICT_DETECTED',
          pairKey,
          aircraftA: {
            id: conflict.aircraftA.id,
            callsign: conflict.aircraftA.callsign,
            model: conflict.aircraftA.model,
          },
          aircraftB: {
            id: conflict.aircraftB.id,
            callsign: conflict.aircraftB.callsign,
            model: conflict.aircraftB.model,
          },
          riskLevel: conflict.collisionRisk,
          currentSeparation: conflict.currentDistance,
          predictedClosestSeparation: conflict.predictedClosestDistance,
          timeToClosestApproach: conflict.timeToClosestApproach,
          altitudeDifference: conflict.altitudeDifference,
          message: `Separation conflict detected between ${conflict.aircraftA.callsign} & ${conflict.aircraftB.callsign} (${conflict.collisionRisk}, CPA: ${conflict.predictedClosestDistance}px in ${conflict.timeToClosestApproach}s)`,
        };

        this.collisionEvents = [newEvent, ...this.collisionEvents].slice(0, 50);
      } else if (severityRank[conflict.collisionRisk] > severityRank[prev.risk]) {
        this.activeConflictsMap.set(pairKey, {
          risk: conflict.collisionRisk,
          pairA: conflict.aircraftA,
          pairB: conflict.aircraftB,
        });

        const newEvent: CollisionEvent = {
          id: `evt_c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          simTimeSeconds: Math.round(this.settings.simTimeSeconds),
          type: 'RISK_ESCALATED',
          pairKey,
          aircraftA: {
            id: conflict.aircraftA.id,
            callsign: conflict.aircraftA.callsign,
            model: conflict.aircraftA.model,
          },
          aircraftB: {
            id: conflict.aircraftB.id,
            callsign: conflict.aircraftB.callsign,
            model: conflict.aircraftB.model,
          },
          riskLevel: conflict.collisionRisk,
          currentSeparation: conflict.currentDistance,
          predictedClosestSeparation: conflict.predictedClosestDistance,
          timeToClosestApproach: conflict.timeToClosestApproach,
          altitudeDifference: conflict.altitudeDifference,
          message: `Conflict severity escalated to ${conflict.collisionRisk} for ${conflict.aircraftA.callsign} & ${conflict.aircraftB.callsign} (CPA: ${conflict.predictedClosestDistance}px in ${conflict.timeToClosestApproach}s)`,
        };

        this.collisionEvents = [newEvent, ...this.collisionEvents].slice(0, 50);
      }
    }

    for (const [pairKey, prevData] of this.activeConflictsMap.entries()) {
      if (!currentPairKeys.has(pairKey)) {
        this.activeConflictsMap.delete(pairKey);

        const newEvent: CollisionEvent = {
          id: `evt_c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          simTimeSeconds: Math.round(this.settings.simTimeSeconds),
          type: 'CONFLICT_RESOLVED',
          pairKey,
          aircraftA: {
            id: prevData.pairA.id,
            callsign: prevData.pairA.callsign,
            model: prevData.pairA.model,
          },
          aircraftB: {
            id: prevData.pairB.id,
            callsign: prevData.pairB.callsign,
            model: prevData.pairB.model,
          },
          riskLevel: 'SAFE',
          currentSeparation: 0,
          predictedClosestSeparation: 0,
          timeToClosestApproach: 0,
          altitudeDifference: 0,
          message: `Separation conflict resolved between ${prevData.pairA.callsign} & ${prevData.pairB.callsign} — safe radar separation restored`,
        };

        this.collisionEvents = [newEvent, ...this.collisionEvents].slice(0, 50);
      }
    }
  }

  private processWeatherEvents(currentInteractions: AircraftWeatherInteraction[]) {
    const currentKeys = new Set<string>();

    for (const inter of currentInteractions) {
      if (inter.weatherRisk === 'SAFE' && !inter.currentExposure) continue;

      const key = `${inter.aircraftId}_${inter.weatherZoneId}`;
      currentKeys.add(key);

      const prev = this.activeWeatherMap.get(key);

      if (!prev) {
        // Initial Warning or Zone Entry
        this.activeWeatherMap.set(key, {
          risk: inter.weatherRisk,
          currentExposure: inter.currentExposure,
          callsign: inter.aircraftCallsign,
          zoneName: inter.zoneName,
        });

        const eventType = inter.currentExposure
          ? 'AIRCRAFT_ENTERED_DANGER_ZONE'
          : 'WEATHER_WARNING';

        const newEvent: WeatherEvent = {
          id: `evt_w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          simTimeSeconds: Math.round(this.settings.simTimeSeconds),
          type: eventType,
          aircraftId: inter.aircraftId,
          aircraftCallsign: inter.aircraftCallsign,
          weatherZoneId: inter.weatherZoneId,
          zoneName: inter.zoneName,
          weatherRisk: inter.weatherRisk,
          distanceToZone: inter.distanceToZone,
          timeToEntry: inter.timeToEntry,
          message: inter.currentExposure
            ? `Target ${inter.aircraftCallsign} entered hazardous weather: ${inter.zoneName} (${inter.weatherRisk})`
            : `Weather alert: ${inter.aircraftCallsign} approaching ${inter.zoneName} in ${inter.timeToEntry}s (${inter.weatherRisk})`,
        };

        this.weatherEvents = [newEvent, ...this.weatherEvents].slice(0, 50);
      } else if (!prev.currentExposure && inter.currentExposure) {
        // Transitioned from approaching to inside
        this.activeWeatherMap.set(key, {
          ...prev,
          currentExposure: true,
          risk: inter.weatherRisk,
        });

        const newEvent: WeatherEvent = {
          id: `evt_w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          simTimeSeconds: Math.round(this.settings.simTimeSeconds),
          type: 'AIRCRAFT_ENTERED_DANGER_ZONE',
          aircraftId: inter.aircraftId,
          aircraftCallsign: inter.aircraftCallsign,
          weatherZoneId: inter.weatherZoneId,
          zoneName: inter.zoneName,
          weatherRisk: inter.weatherRisk,
          distanceToZone: 0,
          timeToEntry: 0,
          message: `Target ${inter.aircraftCallsign} entered active weather boundary: ${inter.zoneName} (${inter.weatherRisk})`,
        };

        this.weatherEvents = [newEvent, ...this.weatherEvents].slice(0, 50);
      }
    }

    // Check resolved weather hazards
    for (const [key, prevData] of this.activeWeatherMap.entries()) {
      if (!currentKeys.has(key)) {
        this.activeWeatherMap.delete(key);

        const eventType = prevData.currentExposure
          ? 'AIRCRAFT_EXITED_DANGER_ZONE'
          : 'WEATHER_RISK_RESOLVED';

        const [acId, zId] = key.split('_');

        const newEvent: WeatherEvent = {
          id: `evt_w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          simTimeSeconds: Math.round(this.settings.simTimeSeconds),
          type: eventType,
          aircraftId: acId,
          aircraftCallsign: prevData.callsign,
          weatherZoneId: zId,
          zoneName: prevData.zoneName,
          weatherRisk: 'SAFE',
          distanceToZone: 0,
          timeToEntry: null,
          message: prevData.currentExposure
            ? `${prevData.callsign} exited ${prevData.zoneName} — returned to clear airspace`
            : `${prevData.callsign} weather hazard resolved for ${prevData.zoneName} — path clear`,
        };

        this.weatherEvents = [newEvent, ...this.weatherEvents].slice(0, 50);
      }
    }
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.listeners.clear();
  }
}
