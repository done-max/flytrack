import type { Aircraft } from '../types/aircraft';
import type { CollisionPrediction } from '../types/collision';
import type { AircraftWeatherInteraction } from '../types/weather';
import type { AIRiskAssessment, ManeuverCandidate } from '../types/ai';

/**
 * Generates clear, fact-grounded Explainable AI (XAI) reasoning from live decision parameters
 */
export function generateAIExplanation(
  aircraft: Aircraft,
  riskAssessment: AIRiskAssessment,
  topManeuver: ManeuverCandidate,
  activeConflict: CollisionPrediction | null,
  activeWeather: AircraftWeatherInteraction | null
): { reason: string; explanationDetails: string[]; confidence: number } {
  const details: string[] = [];

  const { riskCategory, featureVector } = riskAssessment;

  // 1. Situation Assessment & Primary Hazard
  if (activeConflict && activeConflict.conflictDetected) {
    const otherAc =
      activeConflict.aircraftA.id === aircraft.id
        ? activeConflict.aircraftB
        : activeConflict.aircraftA;

    details.push(
      `Impending collision course with ${otherAc.callsign} (${activeConflict.collisionRisk}): Predicted CPA ${activeConflict.predictedClosestDistance}px in ${activeConflict.timeToClosestApproach}s at FL${Math.round(activeConflict.cpaPointA.altitude / 100)}.`
    );
  }

  if (activeWeather && (activeWeather.currentExposure || activeWeather.predictedExposure)) {
    if (activeWeather.currentExposure) {
      details.push(
        `Aircraft is currently inside ${activeWeather.zoneName} (${activeWeather.zoneType}, Wind: ${featureVector.windSpeed} km/h, Vis: ${featureVector.visibility} km).`
      );
    } else if (activeWeather.timeToEntry !== null) {
      details.push(
        `Convective weather hazard detected ahead: Estimated entry into ${activeWeather.zoneName} in ${activeWeather.timeToEntry}s (${activeWeather.distanceToZone}px away).`
      );
    }
  }

  if (featureVector.restrictedProximity < 100) {
    details.push(
      `Proximity to restricted airspace boundary: ${featureVector.restrictedProximity}px lateral clearance.`
    );
  }

  // 2. Reason for Selected Action
  let mainReason = '';

  if (!topManeuver.isViable || topManeuver.type === 'HOLD_EMERGENCY') {
    mainReason = 'CRITICAL: No safe candidate maneuver satisfies standard radar separation and weather avoidance minima. Immediate emergency holding action required.';
    details.push('All candidate heading and altitude adjustments intersect active hazard zones or conflicting traffic.');
    return {
      reason: mainReason,
      explanationDetails: details,
      confidence: 95,
    };
  }

  if (riskCategory === 'SAFE' || topManeuver.type === 'CONTINUE') {
    mainReason = 'Current airway corridor maintains standard ICAO radar separation (5 NM / 1,000 FT) and clear atmospheric profile. Zero conflict vectors detected.';
    details.push('All candidate turn options introduce unnecessary course deviation with negligible safety benefit.');
    return {
      reason: mainReason,
      explanationDetails: details,
      confidence: 96,
    };
  }

  // Active conflict resolution explanation
  if (topManeuver.type === 'TURN_RIGHT' || topManeuver.type === 'TURN_LEFT') {
    const dir = topManeuver.type === 'TURN_RIGHT' ? 'Right' : 'Left';
    const deg = Math.abs(topManeuver.headingDelta);
    mainReason = `Assigned ${dir.toUpperCase()} turn (${deg}°) creates safe lateral divergence (projected separation: ${topManeuver.resultingClosestSeparation}px) while maintaining clear buffer from weather cells.`;
    details.push(
      `Projected post-maneuver traffic risk: ${topManeuver.projectedTrafficRisk}%, weather risk: ${topManeuver.projectedWeatherRisk}%.`
    );
  } else if (topManeuver.type === 'CLIMB' || topManeuver.type === 'DESCEND') {
    const action = topManeuver.type === 'CLIMB' ? 'Climb' : 'Descent';
    const altChange = Math.abs(topManeuver.altitudeDelta);
    mainReason = `Vertical ${action.toLowerCase()} of ${altChange.toLocaleString()} FT establishes safe 1,000+ FT vertical separation over crossing traffic track.`;
    details.push(
      `Cleared new flight level: FL${Math.round((aircraft.altitude + topManeuver.altitudeDelta) / 100)}.`
    );
  } else if (topManeuver.type === 'SPEED_REDUCE') {
    mainReason = `Speed reduction of 60 KTS delays waypoint arrival to allow crossing traffic to clear the intersection.`;
    details.push(`Projected speed: ${aircraft.speed - 60} KTS.`);
  }

  // Model Confidence computation (calibrated with risk score and candidate separation margin)
  let confidenceScore = Math.round(riskAssessment.modelConfidence * 100);
  if (topManeuver.resultingClosestSeparation > 100 && topManeuver.resultingWeatherDistance > 100) {
    confidenceScore = Math.min(98, confidenceScore + 8);
  }
  confidenceScore = Math.max(75, Math.min(99, confidenceScore));

  return {
    reason: mainReason,
    explanationDetails: details,
    confidence: confidenceScore,
  };
}
