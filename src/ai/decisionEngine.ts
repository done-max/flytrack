import type { Aircraft } from '../types/aircraft';
import type { CollisionPrediction } from '../types/collision';
import type { AircraftWeatherInteraction, WeatherZone } from '../types/weather';
import type { AirspaceZoneStatus, RestrictedZone } from '../types/safety';
import type { AIDecision, AIRiskAssessment, ManeuverCandidate, ManeuverType } from '../types/ai';
import { extractAIFeatures } from './features';
import { globalAIRiskModel } from './model';
import { evaluateAllManeuvers } from './maneuverEvaluator';
import { generateAIExplanation } from './explanation';

/**
 * Generates an end-to-end AI Risk Assessment and Decision Recommendation for an aircraft
 */
export function generateAIDecision(
  aircraft: Aircraft,
  allAircraft: Aircraft[],
  conflicts: CollisionPrediction[],
  weatherInteractions: AircraftWeatherInteraction[],
  weatherZones: WeatherZone[],
  restrictedZones: RestrictedZone[]
): AIDecision {
  // 1. Extract structured numerical AI feature vector
  const features = extractAIFeatures(
    aircraft,
    allAircraft,
    conflicts,
    weatherInteractions,
    weatherZones,
    restrictedZones
  );

  // 2. Machine Learning Model Risk Assessment
  const riskAssessment: AIRiskAssessment = globalAIRiskModel.predictRisk(features);

  // 3. Multi-Criteria Forward Simulation of Candidate Maneuvers
  const candidates: ManeuverCandidate[] = evaluateAllManeuvers(
    aircraft,
    allAircraft,
    weatherZones,
    restrictedZones
  );

  // Find active collision conflict and weather interaction for this aircraft
  const activeConflict =
    conflicts.find((c) => c.aircraftA.id === aircraft.id || c.aircraftB.id === aircraft.id) || null;
  const activeWeather =
    weatherInteractions.find((w) => w.aircraftId === aircraft.id) || null;

  // 4. Select the safest viable candidate maneuver
  const viableCandidates = candidates.filter((c) => c.isViable);
  const hasSafeAlternative = viableCandidates.length > 0;

  let selectedCandidate: ManeuverCandidate;
  let recommendedAction: ManeuverType;

  if (!hasSafeAlternative) {
    // Emergency: no viable candidate satisfies safety criteria
    selectedCandidate = {
      id: 'maneuver_emergency_hold',
      type: 'HOLD_EMERGENCY',
      label: 'HOLD / EMERGENCY ACTION',
      headingDelta: 0,
      altitudeDelta: 0,
      speedDelta: 0,
      projectedTrafficRisk: 100,
      projectedWeatherRisk: 100,
      projectedAirspaceRisk: 100,
      totalManeuverRisk: 100,
      resultingClosestSeparation: 0,
      resultingWeatherDistance: 0,
      isViable: false,
      vetoReason: 'NO SAFE ALTERNATIVE FOUND: All candidate vectors enter hazard envelopes.',
    };
    recommendedAction = 'HOLD_EMERGENCY';
  } else if (riskAssessment.riskCategory === 'SAFE' && (!activeConflict || !activeConflict.conflictDetected)) {
    // Current course is safe
    selectedCandidate = candidates.find((c) => c.type === 'CONTINUE' && c.isViable) || viableCandidates[0];
    recommendedAction = selectedCandidate.type;
  } else {
    // Select lowest risk viable candidate
    selectedCandidate = viableCandidates[0];
    recommendedAction = selectedCandidate.type;
  }

  // 5. Generate Fact-Grounded XAI Explanation
  const { reason, explanationDetails, confidence } = generateAIExplanation(
    aircraft,
    riskAssessment,
    selectedCandidate,
    activeConflict,
    activeWeather
  );

  // Airspace zone status determination
  let airspaceRisk: AirspaceZoneStatus = 'SAFE';
  if (features.restrictedProximity < 40) airspaceRisk = 'RESTRICTED';
  else if (riskAssessment.riskCategory === 'CRITICAL') airspaceRisk = 'DANGER';
  else if (riskAssessment.riskCategory === 'HIGH') airspaceRisk = 'HIGH_RISK';
  else if (riskAssessment.riskCategory === 'MODERATE') airspaceRisk = 'CAUTION';

  return {
    aircraftId: aircraft.id,
    aircraftCallsign: aircraft.callsign,
    aiRiskScore: riskAssessment.riskScore,
    aiRiskCategory: riskAssessment.riskCategory,
    collisionRisk: activeConflict ? activeConflict.collisionRisk : 'SAFE',
    weatherRisk: activeWeather ? activeWeather.weatherRisk : 'SAFE',
    airspaceRisk,
    recommendedAction,
    actionLabel: selectedCandidate.label,
    headingAdjustment: selectedCandidate.headingDelta,
    altitudeAdjustment: selectedCandidate.altitudeDelta,
    speedAdjustment: selectedCandidate.speedDelta,
    confidence,
    reason,
    explanationDetails,
    candidates,
    hasSafeAlternative,
    timestamp: Date.now(),
  };
}
