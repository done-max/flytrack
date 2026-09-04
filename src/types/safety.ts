import type { CollisionPrediction, CollisionRiskLevel } from './collision';
import type { AircraftWeatherInteraction, WeatherRiskLevel } from './weather';

export type OverallSafetyLevel = 'SAFE' | 'CAUTION' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';

export type AirspaceZoneStatus = 'SAFE' | 'CAUTION' | 'HIGH_RISK' | 'DANGER' | 'RESTRICTED';

export interface RestrictedZone {
  id: string;
  name: string;
  center: {
    x: number;
    y: number;
  };
  radius: number; // in pixels
  minAltitudeFt: number;
  maxAltitudeFt: number;
  status: 'RESTRICTED';
  description: string;
}

export interface UnifiedAircraftSafety {
  aircraftId: string;
  callsign: string;
  collisionRisk: CollisionRiskLevel;
  weatherRisk: WeatherRiskLevel;
  overallSafety: OverallSafetyLevel;
  primaryHazard: 'NONE' | 'COLLISION' | 'WEATHER' | 'COMBINED';
  weatherInteractions: AircraftWeatherInteraction[];
  activeConflicts: CollisionPrediction[];
  summaryMessage: string;
}

export interface DynamicAirspaceSector {
  id: string;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: AirspaceZoneStatus;
  hasWeatherHazard: boolean;
  hasTrafficHazard: boolean;
  isRestricted: boolean;
}

export type TrafficDensityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface AirspaceSectorData {
  id: string;
  code: string; // e.g. "SEC-01", "SEC-02"
  name: string; // e.g. "Northwest Sector Alpha"
  x: number;
  y: number;
  width: number;
  height: number;
  aircraftIds: string[];
  aircraftCount: number;
  densityLevel: TrafficDensityLevel;
  weatherStatus: 'CLEAR' | 'MODERATE' | 'SEVERE';
  riskLevel: AirspaceZoneStatus;
  isRestricted: boolean;
  activeConflictsCount: number;
}

export interface AirspaceOverviewSummary {
  activeAircraftCount: number;
  activeConflictsCount: number;
  weatherWarningsCount: number;
  restrictedZonesCount: number;
  overallAirspaceRiskScore: number; // 0 to 100
  overallAirspaceRiskLevel: OverallSafetyLevel;
  trafficDensityRating: TrafficDensityLevel;
  sectors: AirspaceSectorData[];
}
