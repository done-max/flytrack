import type { AIDecision } from './ai';

export type DemoStageId =
  | 'STAGE_1_NOMINAL'
  | 'STAGE_2_APPROACHING'
  | 'STAGE_3_PREDICTED_CONFLICT'
  | 'STAGE_4_WEATHER_HAZARD'
  | 'STAGE_5_AI_RECOMMENDATION'
  | 'STAGE_6_MANEUVER_EXECUTION'
  | 'STAGE_7_CONFLICT_RESOLVED';

export interface DemoStageConfig {
  id: DemoStageId;
  stageNumber: number;
  title: string;
  subtitle: string;
  description: string;
  triggerTimeSeconds: number;
  highlightAircraftIds?: string[];
  recommendedActionId?: string;
  autoApplyAction?: boolean;
}

export interface DemoState {
  isActive: boolean;
  currentStageIndex: number;
  autoPlay: boolean;
  hasExecutedAvoidance: boolean;
  stageProgress: number;
}

export interface DebugTelemetryData {
  aircraft: {
    id: string;
    callsign: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    heading: number;
    altitude: number;
    speed: number;
    status: string;
  }[];
  activeConflicts: {
    pair: string;
    currentDistPx: number;
    cpaDistPx: number;
    timeToCpaSec: number;
    altDiffFt: number;
    closingSpeedKts: number;
    risk: string;
  }[];
  weatherHazards: {
    callsign: string;
    zoneName: string;
    zoneType: string;
    distPx: number;
    timeToEntrySec: number;
    risk: string;
  }[];
  selectedAIDecision: AIDecision | null;
  overallAirspaceRiskScore: number;
  airspaceStatus: 'SAFE' | 'CAUTION' | 'HIGH RISK' | 'CRITICAL';
}