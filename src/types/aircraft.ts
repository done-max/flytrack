import type { WeatherZone } from './weather';
import type { RestrictedZone } from './safety';

export type AircraftStatus = 'NORMAL' | 'CAUTION' | 'HIGH_RISK' | 'CRITICAL';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface RoutePoint {
  x: number;
  y: number;
  timestamp: number;
  altitude: number;
  speed: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  timeOffsetSeconds: number;
  altitude: number;
}

export interface Aircraft {
  id: string;
  callsign: string;
  x: number;
  y: number;
  altitude: number; // in feet (e.g. 30000)
  targetAltitude?: number; // target altitude in feet
  speed: number; // in knots (e.g. 450 - 850)
  heading: number; // in degrees (0 - 359, 0 is North)
  velocity: Velocity;
  status: AircraftStatus;
  routeHistory: RoutePoint[];
  predictedTrajectory: TrajectoryPoint[];
  model?: string; // e.g. "B738", "A350"
  squawk?: string; // 4-digit transponder code
  origin?: string; // e.g. "JFK"
  destination?: string; // e.g. "LHR"
  verticalSpeed?: number; // feet per minute (+ climb, - descent)
}

export interface AirspaceDimensions {
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SimulationSettings {
  isRunning: boolean;
  simSpeed: number; // 1x, 2x, 5x, 10x
  simTimeSeconds: number;
  showTrails: boolean;
  showTrajectories: boolean;
  showLabels: boolean;
  showRangeRings: boolean;
  showSectorGrid: boolean;
  showWeatherOverlay: boolean;
  showAirspaceSafetyGrid: boolean;
  radarSweep: boolean;
  trajectoryPredictionSeconds: number; // e.g. 60 or 120
  maxTrailPoints: number;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  aircraft: Aircraft[];
  weatherZones?: WeatherZone[];
  restrictedZones?: RestrictedZone[];
}
