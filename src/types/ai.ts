import type { CollisionRiskLevel } from './collision';
import type { WeatherRiskLevel } from './weather';
import type { AirspaceZoneStatus } from './safety';

export type AIRiskCategory = 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface AIFeatureVector {
  currentSeparationDistance: number; // Euclidean distance to nearest aircraft (pixels)
  predictedClosestSeparation: number; // Distance at CPA (pixels)
  timeToClosestApproach: number; // Seconds until CPA
  altitudeDifference: number; // Altitude difference at CPA (feet)
  relativeSpeed: number; // Relative velocity magnitude (knots)
  headingDifference: number; // Angular course difference (degrees, 0-180)
  weatherSeverity: number; // 0: None, 1: Low, 2: Moderate, 3: High, 4: Critical
  windSpeed: number; // Wind velocity (km/h)
  visibility: number; // Meteorological visibility (km)
  distanceToWeather: number; // Distance to nearest weather cell boundary (pixels)
  timeToWeatherEntry: number; // Seconds until weather entry (0 if inside, 999 if clear)
  trafficDensity: number; // Number of aircraft in 300px radius
  restrictedProximity: number; // Distance to nearest MOA / restricted boundary (pixels)
  availableManeuverOptionsCount: number; // Count of clear maneuver directions
}

export interface AIRiskAssessment {
  riskScore: number; // Continuous score from 0 to 100
  riskCategory: AIRiskCategory;
  featureVector: AIFeatureVector;
  normalizedFeatures: Record<string, number>;
  modelConfidence: number; // 0.0 to 1.0 (e.g. 0.92)
  predictedProbabilities: Record<AIRiskCategory, number>;
}

export type ManeuverType =
  | 'CONTINUE'
  | 'MONITOR'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'CLIMB'
  | 'DESCEND'
  | 'SPEED_REDUCE'
  | 'HOLD_EMERGENCY';

export interface ManeuverCandidate {
  id: string;
  type: ManeuverType;
  label: string; // e.g. "TURN RIGHT 30°"
  headingDelta: number; // Heading adjustment (e.g. +30)
  altitudeDelta: number; // Altitude adjustment (e.g. +2000)
  speedDelta: number; // Speed adjustment (e.g. -50)
  projectedTrafficRisk: number; // 0 to 100%
  projectedWeatherRisk: number; // 0 to 100%
  projectedAirspaceRisk: number; // 0 to 100%
  totalManeuverRisk: number; // Combined estimated risk 0 to 100%
  resultingClosestSeparation: number; // Projected CPA distance (pixels)
  resultingWeatherDistance: number; // Projected weather distance (pixels)
  isViable: boolean; // True if it satisfies safety minima
  vetoReason?: string;
}

export interface AIDecision {
  aircraftId: string;
  aircraftCallsign: string;
  aiRiskScore: number; // 0 to 100
  aiRiskCategory: AIRiskCategory;
  collisionRisk: CollisionRiskLevel;
  weatherRisk: WeatherRiskLevel;
  airspaceRisk: AirspaceZoneStatus;
  recommendedAction: ManeuverType;
  actionLabel: string;
  headingAdjustment: number;
  altitudeAdjustment: number;
  speedAdjustment: number;
  confidence: number; // 0 to 100%
  reason: string;
  explanationDetails: string[];
  candidates: ManeuverCandidate[];
  hasSafeAlternative: boolean;
  timestamp: number;
}

export interface ModelEvaluationMetrics {
  sampleCount: number;
  accuracy: number; // 0.0 to 1.0 (e.g. 0.945)
  precision: Record<AIRiskCategory, number>;
  recall: Record<AIRiskCategory, number>;
  f1Score: Record<AIRiskCategory, number>;
  confusionMatrix: Record<AIRiskCategory, Record<AIRiskCategory, number>>;
  featureImportances: Record<keyof AIFeatureVector, number>;
  algorithmName: string;
  treeCount: number;
}
