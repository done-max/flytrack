import type { Aircraft, AirspaceDimensions, SimulationSettings } from '../types/aircraft';
import type {
  AirspaceConflictSummary,
  CollisionEvent,
  CollisionPrediction,
  CollisionRiskLevel,
  CollisionThresholds,
} from '../types/collision';
import { stepAircraft } from './aircraft';
import {
  DEFAULT_COLLISION_THRESHOLDS,
  detectAirspaceCollisions,
  deriveAircraftStatusMap,
} from './collision';
import { calculateVelocity } from './movement';
import { calculatePredictedTrajectory } from './trajectory';

export type SimulationTickListener = (
  aircraft: Aircraft[],
  simTimeSeconds: number,
  conflictSummary: AirspaceConflictSummary,
  events: CollisionEvent[]
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

  private events: CollisionEvent[] = [];
  private activeConflictsMap: Map<
    string,
    { risk: CollisionRiskLevel; pairA: Aircraft; pairB: Aircraft }
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
    customThresholds?: Partial<CollisionThresholds>
  ) {
    this.aircraft = [...initialAircraft];
    if (customThresholds) {
      this.thresholds = { ...DEFAULT_COLLISION_THRESHOLDS, ...customThresholds };
    }
  }

  public subscribe(listener: SimulationTickListener): () => void {
    this.listeners.add(listener);
    listener(this.aircraft, this.settings.simTimeSeconds, this.conflictSummary, this.events);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.aircraft, this.settings.simTimeSeconds, this.conflictSummary, this.events);
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

  public reset(newAircraftList?: Aircraft[]) {
    this.pause();
    this.settings.simTimeSeconds = 0;
    this.events = [];
    this.activeConflictsMap.clear();

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

    // Re-evaluate conflicts immediately upon manual clearance modification
    this.conflictSummary = detectAirspaceCollisions(this.aircraft, this.thresholds);
    this.processConflictEvents(this.conflictSummary.conflicts);

    const statusMap = deriveAircraftStatusMap(this.aircraft, this.conflictSummary.conflicts);
    this.aircraft = this.aircraft.map((ac) => ({
      ...ac,
      status: statusMap.get(ac.id) || 'NORMAL',
    }));

    this.notify();
  }

  public addAircraft(newAc: Aircraft) {
    this.aircraft = [...this.aircraft, newAc];
    this.conflictSummary = detectAirspaceCollisions(this.aircraft, this.thresholds);
    this.processConflictEvents(this.conflictSummary.conflicts);
    this.notify();
  }

  public removeAircraft(id: string) {
    this.aircraft = this.aircraft.filter((ac) => ac.id !== id);
    this.conflictSummary = detectAirspaceCollisions(this.aircraft, this.thresholds);
    this.processConflictEvents(this.conflictSummary.conflicts);
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

  public getEvents(): CollisionEvent[] {
    return [...this.events];
  }

  public clearEvents() {
    this.events = [];
    this.notify();
  }

  public getThresholds(): CollisionThresholds {
    return { ...this.thresholds };
  }

  public setThresholds(updates: Partial<CollisionThresholds>) {
    this.thresholds = { ...this.thresholds, ...updates };
    this.conflictSummary = detectAirspaceCollisions(this.aircraft, this.thresholds);
    this.processConflictEvents(this.conflictSummary.conflicts);
    this.notify();
  }

  public getSettings(): SimulationSettings {
    return { ...this.settings };
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

    // Convert to seconds, clamped between 0.001 and 0.1s to avoid physics lag spikes
    const deltaSeconds = Math.min(Math.max(elapsedMs / 1000, 0.001), 0.1);

    this.updateTick(deltaSeconds);
    this.notify();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private updateTick(deltaSeconds: number) {
    const effectiveDelta = deltaSeconds * this.settings.simSpeed;
    this.settings.simTimeSeconds += effectiveDelta;

    // 1. Advance movement & history for all aircraft
    let updated = this.aircraft.map((ac) =>
      stepAircraft(
        ac,
        deltaSeconds,
        this.settings.simSpeed,
        this.bounds,
        this.settings.trajectoryPredictionSeconds,
        this.settings.maxTrailPoints
      )
    );

    // 2. Deterministic mathematical pairwise collision detection
    this.conflictSummary = detectAirspaceCollisions(updated, this.thresholds);
    this.processConflictEvents(this.conflictSummary.conflicts);

    const statusMap = deriveAircraftStatusMap(updated, this.conflictSummary.conflicts);

    // 3. Assign dynamic risk statuses
    updated = updated.map((ac) => {
      const dynamicRisk = statusMap.get(ac.id) || 'NORMAL';
      return {
        ...ac,
        status: dynamicRisk,
      };
    });

    this.aircraft = updated;
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
        // New Conflict Detected
        this.activeConflictsMap.set(pairKey, {
          risk: conflict.collisionRisk,
          pairA: conflict.aircraftA,
          pairB: conflict.aircraftB,
        });

        const newEvent: CollisionEvent = {
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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

        this.events = [newEvent, ...this.events].slice(0, 50);
      } else if (severityRank[conflict.collisionRisk] > severityRank[prev.risk]) {
        // Risk Escalated
        this.activeConflictsMap.set(pairKey, {
          risk: conflict.collisionRisk,
          pairA: conflict.aircraftA,
          pairB: conflict.aircraftB,
        });

        const newEvent: CollisionEvent = {
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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

        this.events = [newEvent, ...this.events].slice(0, 50);
      }
    }

    // Check for resolved conflicts
    for (const [pairKey, prevData] of this.activeConflictsMap.entries()) {
      if (!currentPairKeys.has(pairKey)) {
        // Conflict has resolved
        this.activeConflictsMap.delete(pairKey);

        const newEvent: CollisionEvent = {
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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

        this.events = [newEvent, ...this.events].slice(0, 50);
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
