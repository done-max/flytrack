import type { Aircraft, AirspaceDimensions, SimulationSettings } from '../types/aircraft';
import { evaluateAirspaceRiskStatuses, stepAircraft } from './aircraft';
import { calculateVelocity } from './movement';
import { calculatePredictedTrajectory } from './trajectory';

export type SimulationTickListener = (aircraft: Aircraft[], simTimeSeconds: number) => void;

export class SimulationEngine {
  private aircraft: Aircraft[] = [];
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

  constructor(initialAircraft: Aircraft[] = []) {
    this.aircraft = [...initialAircraft];
  }

  public subscribe(listener: SimulationTickListener): () => void {
    this.listeners.add(listener);
    listener(this.aircraft, this.settings.simTimeSeconds);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.aircraft, this.settings.simTimeSeconds);
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

    this.notify();
  }

  public addAircraft(newAc: Aircraft) {
    this.aircraft = [...this.aircraft, newAc];
    this.notify();
  }

  public removeAircraft(id: string) {
    this.aircraft = this.aircraft.filter((ac) => ac.id !== id);
    this.notify();
  }

  public getAircraft(): Aircraft[] {
    return this.aircraft;
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

    // Convert to seconds, clamped between 0.001 and 0.1s to avoid physics explosions on lag spikes
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

    // 2. Evaluate proximity risks
    const riskMap = evaluateAirspaceRiskStatuses(updated);
    updated = updated.map((ac) => {
      // If user hasn't forced a manual status, reflect radar risk assessment
      const dynamicRisk = riskMap.get(ac.id) || 'NORMAL';
      return {
        ...ac,
        status: dynamicRisk,
      };
    });

    this.aircraft = updated;
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.listeners.clear();
  }
}
