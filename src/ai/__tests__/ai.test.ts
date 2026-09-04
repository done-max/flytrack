import { describe, it, expect } from 'vitest';
import type { Aircraft } from '../../types/aircraft';
import type { WeatherZone } from '../../types/weather';
import type { RestrictedZone } from '../../types/safety';
import { extractAIFeatures, featureVectorToArray, normalizeFeatureVector } from '../features';
import { generateSyntheticDataset } from '../dataset';
import { AirspaceRiskModel, globalAIRiskModel } from '../model';
import { evaluateCandidateManeuver, evaluateAllManeuvers, STANDARD_CANDIDATES } from '../maneuverEvaluator';
import { generateAIExplanation } from '../explanation';
import { generateAIDecision } from '../decisionEngine';
import { predictPairwiseCollision } from '../../simulation/collision';
import { predictAircraftWeatherInteraction } from '../../weather/weatherPrediction';

describe('Phase 4: AI Risk Assessment & Decision Engine', () => {
  const dummyAircraftA: Aircraft = {
    id: 'ac_test_1',
    callsign: 'SKG101',
    model: 'B738',
    x: 200,
    y: 300,
    altitude: 32000,
    targetAltitude: 32000,
    speed: 450,
    heading: 90, // flying east
    velocity: { vx: 450, vy: 0 },
    verticalSpeed: 0,
    status: 'NORMAL',
    routeHistory: [],
    predictedTrajectory: [],
  };

  const dummyAircraftB: Aircraft = {
    id: 'ac_test_2',
    callsign: 'SKG202',
    model: 'A320',
    x: 400,
    y: 300,
    altitude: 32000,
    targetAltitude: 32000,
    speed: 450,
    heading: 270, // flying west (head-on collision)
    velocity: { vx: -450, vy: 0 },
    verticalSpeed: 0,
    status: 'NORMAL',
    routeHistory: [],
    predictedTrajectory: [],
  };

  const clearWeatherZone: WeatherZone = {
    id: 'wx_1',
    name: 'Sector Storm',
    type: 'THUNDERSTORM',
    severity: 'CRITICAL',
    center: { x: 800, y: 800 },
    radius: 60,
    windSpeed: 85,
    visibility: 2,
    minAltitudeFt: 0,
    maxAltitudeFt: 45000,
    isActive: true,
  };

  const dummyRestrictedZone: RestrictedZone = {
    id: 'moa_1',
    name: 'MOA Bravo',
    center: { x: 200, y: 600 },
    radius: 50,
    status: 'RESTRICTED',
    description: 'Military operations area',
    minAltitudeFt: 0,
    maxAltitudeFt: 45000,
  };

  describe('1. Feature Vector Extraction Pipeline', () => {
    it('extracts all 14 structured telemetry features accurately', () => {
      const conflict = predictPairwiseCollision(dummyAircraftA, dummyAircraftB);
      const wxInter = predictAircraftWeatherInteraction(dummyAircraftA, clearWeatherZone);

      const features = extractAIFeatures(
        dummyAircraftA,
        [dummyAircraftA, dummyAircraftB],
        [conflict],
        [wxInter],
        [clearWeatherZone],
        [dummyRestrictedZone]
      );

      expect(features.currentSeparationDistance).toBe(200);
      expect(features.predictedClosestSeparation).toBeLessThan(10);
      expect(features.timeToClosestApproach).toBeGreaterThan(0);
      expect(features.altitudeDifference).toBe(0);
      expect(features.relativeSpeed).toBe(900); // 450 + 450 head-on
      expect(features.headingDifference).toBe(180);
      expect(features.weatherSeverity).toBe(4); // from clearWeatherZone severity CRITICAL
      expect(features.trafficDensity).toBe(1);
      expect(features.restrictedProximity).toBeGreaterThan(100);
      expect(features.availableManeuverOptionsCount).toBeGreaterThanOrEqual(1);
    });

    it('normalizes feature vectors to [0, 1] range', () => {
      const conflict = predictPairwiseCollision(dummyAircraftA, dummyAircraftB);
      const wxInter = predictAircraftWeatherInteraction(dummyAircraftA, clearWeatherZone);

      const features = extractAIFeatures(
        dummyAircraftA,
        [dummyAircraftA, dummyAircraftB],
        [conflict],
        [wxInter],
        [clearWeatherZone],
        [dummyRestrictedZone]
      );

      const normalized = normalizeFeatureVector(features);
      for (const val of Object.values(normalized)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('converts feature vector to numerical array with 14 elements', () => {
      const conflict = predictPairwiseCollision(dummyAircraftA, dummyAircraftB);
      const features = extractAIFeatures(
        dummyAircraftA,
        [dummyAircraftA, dummyAircraftB],
        [conflict],
        [],
        [],
        []
      );

      const array = featureVectorToArray(features);
      expect(array).toHaveLength(14);
      array.forEach((val) => expect(typeof val).toBe('number'));
    });
  });

  describe('2. Synthetic Dataset & Random Forest Classifier', () => {
    it('generates a balanced synthetic dataset across all 5 risk categories', () => {
      const dataset = generateSyntheticDataset(500);
      expect(dataset.length).toBeGreaterThanOrEqual(500);

      const categories = ['SAFE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
      for (const cat of categories) {
        const count = dataset.filter((d) => d.label === cat).length;
        expect(count).toBeGreaterThan(20);
      }
    });

    it('trains Random Forest classifier and achieves > 85% accuracy on test split', () => {
      const model = new AirspaceRiskModel(12, 7);
      const metrics = model.trainAndEvaluate(800);

      expect(metrics.accuracy).toBeGreaterThanOrEqual(0.85);
      expect(metrics.sampleCount).toBeGreaterThanOrEqual(800);
      expect(metrics.treeCount).toBe(12);

      // Verify confusion matrix is populated
      const categories = ['SAFE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const;
      for (const cat of categories) {
        expect(metrics.precision[cat]).toBeGreaterThan(0.65);
        expect(metrics.recall[cat]).toBeGreaterThan(0.65);
        expect(metrics.f1Score[cat]).toBeGreaterThan(0.65);
      }
    });

    it('computes continuous AI Risk Score (0-100) with confidence', () => {
      const assessmentSafe = globalAIRiskModel.predictRisk({
        currentSeparationDistance: 500,
        predictedClosestSeparation: 450,
        timeToClosestApproach: 999,
        altitudeDifference: 3000,
        relativeSpeed: 300,
        headingDifference: 0,
        weatherSeverity: 0,
        windSpeed: 10,
        visibility: 25,
        distanceToWeather: 600,
        timeToWeatherEntry: 999,
        trafficDensity: 0,
        restrictedProximity: 400,
        availableManeuverOptionsCount: 8,
      });

      expect(assessmentSafe.riskScore).toBeLessThan(35);
      expect(assessmentSafe.riskCategory).toBe('SAFE');
      expect(assessmentSafe.modelConfidence).toBeGreaterThan(0.5);

      const assessmentCritical = globalAIRiskModel.predictRisk({
        currentSeparationDistance: 60,
        predictedClosestSeparation: 5,
        timeToClosestApproach: 15,
        altitudeDifference: 0,
        relativeSpeed: 900,
        headingDifference: 180,
        weatherSeverity: 0,
        windSpeed: 20,
        visibility: 20,
        distanceToWeather: 400,
        timeToWeatherEntry: 999,
        trafficDensity: 2,
        restrictedProximity: 300,
        availableManeuverOptionsCount: 3,
      });

      expect(assessmentCritical.riskScore).toBeGreaterThanOrEqual(80);
      expect(assessmentCritical.riskCategory).toBe('CRITICAL');
    });
  });

  describe('3. Multi-Criteria Maneuver Evaluator', () => {
    it('evaluates all 8 standard candidate maneuvers and provides viability status', () => {
      const candidates = evaluateAllManeuvers(
        dummyAircraftA,
        [dummyAircraftA, dummyAircraftB],
        [clearWeatherZone],
        [dummyRestrictedZone]
      );

      expect(candidates.length).toBe(STANDARD_CANDIDATES.length);
      expect(candidates.some((c) => c.isViable)).toBe(true);

      // Maintaining straight course should have high risk in head-on conflict
      const continueCandidate = candidates.find((c) => c.type === 'CONTINUE');
      expect(continueCandidate).toBeDefined();
      expect(continueCandidate?.totalManeuverRisk).toBeGreaterThan(70);
    });

    it('vetoes candidates that steer into severe weather within 45 seconds', () => {
      const stormAheadZone: WeatherZone = {
        id: 'wx_storm',
        name: 'Thunderstorm Cell',
        type: 'THUNDERSTORM',
        severity: 'CRITICAL',
        center: { x: 350, y: 300 }, // right in front of dummyAircraftA (x: 200, heading: 90)
        radius: 50,
        windSpeed: 90,
        visibility: 1,
        minAltitudeFt: 0,
        maxAltitudeFt: 45000,
        isActive: true,
      };

      const candidateContinue = evaluateCandidateManeuver(
        dummyAircraftA,
        [dummyAircraftA],
        [stormAheadZone],
        [],
        { type: 'CONTINUE', label: 'MAINTAIN COURSE', headingDelta: 0, altitudeDelta: 0, speedDelta: 0 }
      );

      expect(candidateContinue.isViable).toBe(false);
      expect(candidateContinue.vetoReason).toContain('Steers directly into');
    });

    it('vetoes candidates that penetrate restricted airspace MOA', () => {
      const closeRestrictedZone: RestrictedZone = {
        id: 'moa_close',
        name: 'Restricted Range Alpha',
        center: { x: 200, y: 315 }, // just 15px south of dummyAircraftA (x: 200, y: 300)
        radius: 30,
        status: 'RESTRICTED',
        description: 'Prohibited airspace',
        minAltitudeFt: 0,
        maxAltitudeFt: 45000,
      };

      const candidateSouth = evaluateCandidateManeuver(
        dummyAircraftA,
        [dummyAircraftA],
        [],
        [closeRestrictedZone],
        { type: 'TURN_RIGHT', label: 'TURN RIGHT 90°', headingDelta: 90, altitudeDelta: 0, speedDelta: 0 }
      );

      expect(candidateSouth.isViable).toBe(false);
      expect(candidateSouth.vetoReason).toContain('Penetrates Restricted Range Alpha');
    });

    it('vetoes maneuvers that violate operational altitude envelope (<10,000 ft or >43,000 ft)', () => {
      const lowAircraft: Aircraft = { ...dummyAircraftA, altitude: 10500 };
      const candDescend = evaluateCandidateManeuver(
        lowAircraft,
        [lowAircraft],
        [],
        [],
        { type: 'DESCEND', label: 'DESCEND -2,000 FT', headingDelta: 0, altitudeDelta: -2000, speedDelta: 0 }
      );

      expect(candDescend.isViable).toBe(false);
      expect(candDescend.vetoReason).toContain('minimum sector altitude');
    });
  });

  describe('4. Explainable AI (XAI) Engine', () => {
    it('generates fact-grounded reason and detailed parameters for collision resolution', () => {
      const conflict = predictPairwiseCollision(dummyAircraftA, dummyAircraftB);
      const features = extractAIFeatures(
        dummyAircraftA,
        [dummyAircraftA, dummyAircraftB],
        [conflict],
        [],
        [],
        []
      );
      const riskAssessment = globalAIRiskModel.predictRisk(features);
      const candidates = evaluateAllManeuvers(dummyAircraftA, [dummyAircraftA, dummyAircraftB], [], []);
      const topManeuver = candidates.find((c) => c.isViable) || candidates[0];

      const xai = generateAIExplanation(dummyAircraftA, riskAssessment, topManeuver, conflict, null);

      expect(xai.reason).toBeTruthy();
      expect(xai.explanationDetails.length).toBeGreaterThan(0);
      expect(xai.confidence).toBeGreaterThanOrEqual(75);
      expect(xai.explanationDetails[0]).toContain(dummyAircraftB.callsign);
    });

    it('generates clear flight corridor explanation when airspace is safe', () => {
      const isolatedAircraft: Aircraft = {
        ...dummyAircraftA,
        x: 100,
        y: 100,
        altitude: 35000,
      };

      const features = extractAIFeatures(isolatedAircraft, [isolatedAircraft], [], [], [], []);
      const riskAssessment = globalAIRiskModel.predictRisk(features);
      const candidates = evaluateAllManeuvers(isolatedAircraft, [isolatedAircraft], [], []);
      const topManeuver = candidates.find((c) => c.type === 'CONTINUE') || candidates[0];

      const xai = generateAIExplanation(isolatedAircraft, riskAssessment, topManeuver, null, null);

      expect(xai.reason).toContain('standard ICAO radar separation');
      expect(xai.confidence).toBeGreaterThanOrEqual(90);
    });
  });

  describe('5. End-to-End AI Decision Pipeline & Edge Cases', () => {
    it('recommends CONTINUE in nominal clear airspace', () => {
      const decision = generateAIDecision(
        dummyAircraftA,
        [dummyAircraftA],
        [],
        [],
        [],
        []
      );

      expect(decision.recommendedAction).toBe('CONTINUE');
      expect(decision.aiRiskCategory).toBe('SAFE');
      expect(decision.aiRiskScore).toBeLessThan(35);
      expect(decision.hasSafeAlternative).toBe(true);
    });

    it('recommends lateral or vertical diversion under head-on collision threat', () => {
      const conflict = predictPairwiseCollision(dummyAircraftA, dummyAircraftB);
      const decision = generateAIDecision(
        dummyAircraftA,
        [dummyAircraftA, dummyAircraftB],
        [conflict],
        [],
        [],
        []
      );

      expect(['TURN_RIGHT', 'TURN_LEFT', 'CLIMB', 'DESCEND']).toContain(decision.recommendedAction);
      expect(decision.aiRiskCategory).toBe('CRITICAL');
      expect(decision.aiRiskScore).toBeGreaterThanOrEqual(75);
      expect(decision.hasSafeAlternative).toBe(true);
    });

    it('handles simultaneous collision threat and thunderstorm hazard correctly', () => {
      const conflict = predictPairwiseCollision(dummyAircraftA, dummyAircraftB);
      const thunderstormNorth: WeatherZone = {
        id: 'wx_north',
        name: 'Convective Cell North',
        type: 'THUNDERSTORM',
        severity: 'CRITICAL',
        center: { x: 300, y: 150 }, // north of flight track
        radius: 60,
        windSpeed: 80,
        visibility: 2,
        minAltitudeFt: 0,
        maxAltitudeFt: 45000,
        isActive: true,
      };

      const wxInter = predictAircraftWeatherInteraction(dummyAircraftA, thunderstormNorth);

      const decision = generateAIDecision(
        dummyAircraftA,
        [dummyAircraftA, dummyAircraftB],
        [conflict],
        [wxInter],
        [thunderstormNorth],
        []
      );

      // Decision should resolve conflict without steering into north storm
      expect(decision.hasSafeAlternative).toBe(true);
      expect(decision.recommendedAction).not.toBe('CONTINUE');
      expect(decision.aiRiskScore).toBeGreaterThan(70);
    });

    it('triggers HOLD_EMERGENCY if all candidate vectors are vetoed by hazards', () => {
      // Surround aircraft with extreme restricted zones and conflicting traffic in all directions
      const surroundingMOAs: RestrictedZone[] = [
        { id: 'moa_1', name: 'MOA North', center: { x: 200, y: 280 }, radius: 40, status: 'RESTRICTED', description: 'Restricted Range North', minAltitudeFt: 0, maxAltitudeFt: 50000 },
        { id: 'moa_2', name: 'MOA South', center: { x: 200, y: 320 }, radius: 40, status: 'RESTRICTED', description: 'Restricted Range South', minAltitudeFt: 0, maxAltitudeFt: 50000 },
        { id: 'moa_3', name: 'MOA East', center: { x: 230, y: 300 }, radius: 40, status: 'RESTRICTED', description: 'Restricted Range East', minAltitudeFt: 0, maxAltitudeFt: 50000 },
        { id: 'moa_4', name: 'MOA West', center: { x: 170, y: 300 }, radius: 40, status: 'RESTRICTED', description: 'Restricted Range West', minAltitudeFt: 0, maxAltitudeFt: 50000 },
      ];

      const trappedAircraft: Aircraft = { ...dummyAircraftA, altitude: 10000 }; // lowest altitude (cannot descend)

      const decision = generateAIDecision(
        trappedAircraft,
        [trappedAircraft],
        [],
        [],
        [],
        surroundingMOAs
      );

      expect(decision.recommendedAction).toBe('HOLD_EMERGENCY');
      expect(decision.hasSafeAlternative).toBe(false);
      expect(decision.reason).toContain('CRITICAL: No safe candidate maneuver satisfies');
    });
  });
});
