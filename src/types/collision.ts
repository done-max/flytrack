import type { Aircraft } from './aircraft';

export type CollisionRiskLevel = 'SAFE' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';

export interface CollisionThresholds {
  /** Maximum future lookahead horizon in seconds (default: 120s) */
  lookaheadTimeSeconds: number;
  
  /** Horizontal separation distance thresholds in airspace pixels */
  criticalDistanceThreshold: number; // e.g. 30px (imminent breach)
  highRiskDistanceThreshold: number;  // e.g. 55px (loss of separation zone)
  warningDistanceThreshold: number;   // e.g. 90px (caution proximity)
  
  /** Time-to-CPA thresholds in seconds */
  criticalTimeThresholdSeconds: number; // e.g. 30s
  highRiskTimeThresholdSeconds: number;  // e.g. 60s
  warningTimeThresholdSeconds: number;   // e.g. 90s
  
  /** Vertical altitude separation thresholds in feet */
  verticalSeparationMinimaFt: number; // Standard IFR separation: 1000 ft
  criticalVerticalSeparationFt: number; // Severe vertical compression: 500 ft
}

export interface CollisionPrediction {
  aircraftA: Aircraft;
  aircraftB: Aircraft;
  
  /** Current 2D Euclidean distance in airspace pixels */
  currentDistance: number;
  
  /** Minimum predicted 2D distance at closest point of approach */
  predictedClosestDistance: number;
  
  /** Time in seconds until closest point of approach (0 if diverging / past) */
  timeToClosestApproach: number;
  
  /** Altitude difference at CPA in feet */
  altitudeDifference: number;
  
  /** Current altitude difference in feet */
  currentAltitudeDifference: number;
  
  /** 3D spatial coordinate of Aircraft A at CPA */
  cpaPointA: {
    x: number;
    y: number;
    altitude: number;
  };
  
  /** 3D spatial coordinate of Aircraft B at CPA */
  cpaPointB: {
    x: number;
    y: number;
    altitude: number;
  };
  
  /** Computed collision risk classification */
  collisionRisk: CollisionRiskLevel;
  
  /** Flag indicating whether any safety threshold is breached (WARNING, HIGH_RISK, or CRITICAL) */
  conflictDetected: boolean;
  
  /** True if aircraft are moving away from each other */
  isDiverging: boolean;
  
  /** Relative velocity vector components */
  relativeVelocity: {
    rvx: number;
    rvy: number;
    relativeSpeed: number; // knots
  };

  /** Estimated loss of separation time window if trajectories intersect unsafe volume */
  lossOfSeparationWindow?: {
    entryTimeSeconds: number;
    exitTimeSeconds: number;
    durationSeconds: number;
  };
}

export interface AirspaceConflictSummary {
  totalPairsChecked: number;
  activeConflictsCount: number;
  criticalCount: number;
  highRiskCount: number;
  warningCount: number;
  highestRiskLevel: CollisionRiskLevel;
  conflicts: CollisionPrediction[];
}

export type CollisionEventType = 'CONFLICT_DETECTED' | 'RISK_ESCALATED' | 'CONFLICT_RESOLVED';

export interface CollisionEvent {
  id: string;
  timestamp: number; // Unix timestamp
  simTimeSeconds: number;
  type: CollisionEventType;
  pairKey: string;
  aircraftA: { id: string; callsign: string; model?: string };
  aircraftB: { id: string; callsign: string; model?: string };
  riskLevel: CollisionRiskLevel;
  currentSeparation: number;
  predictedClosestSeparation: number;
  timeToClosestApproach: number;
  altitudeDifference: number;
  message: string;
}
