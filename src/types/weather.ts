export type WeatherType =
  | 'CLEAR'
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'STORM'
  | 'THUNDERSTORM'
  | 'LOW_VISIBILITY';

export type WeatherSeverity = 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type WeatherRiskLevel = 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface WeatherZone {
  id: string;
  name: string;
  type: WeatherType;
  severity: WeatherSeverity;
  center: {
    x: number;
    y: number;
  };
  radius: number; // Airspace radius in pixels
  windSpeed: number; // km/h
  windHeading?: number; // degrees (0-359)
  visibility: number; // km
  minAltitudeFt: number; // Floor in feet (e.g. 0)
  maxAltitudeFt: number; // Ceiling in feet (e.g. 45000)
  isActive: boolean;
  description?: string;
}

export interface AircraftWeatherInteraction {
  aircraftId: string;
  aircraftCallsign: string;
  weatherZoneId: string;
  zoneName: string;
  zoneType: WeatherType;
  zoneSeverity: WeatherSeverity;
  currentExposure: boolean; // currently inside 3D weather volume
  predictedExposure: boolean; // predicted to enter within lookahead horizon
  distanceToZone: number; // pixels to perimeter (0 if inside)
  distanceToCenter: number; // pixels to center
  timeToEntry: number | null; // seconds until entering (0 if inside, null if no entry)
  timeToExit: number | null; // seconds until exiting
  weatherRisk: WeatherRiskLevel;
  closestDistance: number; // minimum predicted distance to zone perimeter
  altitudeOverlap: boolean; // true if aircraft altitude intersects zone altitude span
  message: string;
}

export interface WeatherSummary {
  totalZones: number;
  activeZones: number;
  stormCount: number;
  highRiskZonesCount: number;
  affectedAircraftCount: number;
  highestWeatherRisk: WeatherRiskLevel;
  zoneInteractions: AircraftWeatherInteraction[];
}

export type WeatherEventType =
  | 'WEATHER_WARNING'
  | 'AIRCRAFT_ENTERED_DANGER_ZONE'
  | 'AIRCRAFT_EXITED_DANGER_ZONE'
  | 'WEATHER_RISK_RESOLVED';

export interface WeatherEvent {
  id: string;
  timestamp: number;
  simTimeSeconds: number;
  type: WeatherEventType;
  aircraftId: string;
  aircraftCallsign: string;
  weatherZoneId: string;
  zoneName: string;
  weatherRisk: WeatherRiskLevel;
  distanceToZone: number;
  timeToEntry: number | null;
  message: string;
}
