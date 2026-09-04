import type { AIFeatureVector, AIRiskCategory } from '../types/ai';

export interface LabeledDataSample {
  id: string;
  features: AIFeatureVector;
  label: AIRiskCategory;
}

/**
 * Deterministic ground truth labeling rule based on multi-parameter safety minima
 */
export function assignGroundTruthLabel(f: AIFeatureVector): AIRiskCategory {
  const isTrafficCritical =
    f.predictedClosestSeparation < 30 &&
    f.timeToClosestApproach <= 30 &&
    f.altitudeDifference < 1000;

  const isWeatherCritical =
    f.weatherSeverity === 4 &&
    (f.timeToWeatherEntry <= 30 || f.distanceToWeather <= 20);

  if (isTrafficCritical || isWeatherCritical) {
    return 'CRITICAL';
  }

  const isTrafficHigh =
    f.predictedClosestSeparation < 55 &&
    f.timeToClosestApproach <= 60 &&
    f.altitudeDifference < 1000;

  const isWeatherHigh =
    f.weatherSeverity >= 3 &&
    f.timeToWeatherEntry <= 60;

  const isRestrictedDanger = f.restrictedProximity < 30;

  if (isTrafficHigh || isWeatherHigh || isRestrictedDanger) {
    return 'HIGH';
  }

  const isTrafficModerate =
    f.predictedClosestSeparation < 90 &&
    f.timeToClosestApproach <= 90 &&
    f.altitudeDifference < 1000;

  const isWeatherModerate =
    (f.weatherSeverity >= 2 && f.timeToWeatherEntry <= 90) ||
    f.windSpeed >= 70 ||
    f.visibility <= 2.0;

  if (isTrafficModerate || isWeatherModerate) {
    return 'MODERATE';
  }

  const isTrafficLow =
    f.currentSeparationDistance < 150 ||
    f.predictedClosestSeparation < 120;

  const isWeatherLow =
    f.weatherSeverity >= 1 && f.timeToWeatherEntry <= 120;

  if (isTrafficLow || isWeatherLow) {
    return 'LOW';
  }

  return 'SAFE';
}

/**
 * Generates a synthetic dataset of realistic aviation safety situations
 */
export function generateSyntheticDataset(count: number = 1200, seed: number = 42): LabeledDataSample[] {
  const samples: LabeledDataSample[] = [];

  // Simple pseudo-random number generator for deterministic reproducible dataset
  let s = seed;
  const rand = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };

  for (let i = 0; i < count; i++) {
    // Generate situation distribution across different archetypes
    const archetype = i % 5;
    let sampleFeatures: AIFeatureVector;

    if (archetype === 0) {
      // 1. Safe Clear Airway
      sampleFeatures = {
        currentSeparationDistance: 150 + rand() * 600,
        predictedClosestSeparation: 120 + rand() * 300,
        timeToClosestApproach: 60 + rand() * 60,
        altitudeDifference: 2000 + rand() * 8000,
        relativeSpeed: 200 + rand() * 600,
        headingDifference: rand() * 180,
        weatherSeverity: rand() < 0.8 ? 0 : 1,
        windSpeed: rand() * 40,
        visibility: 8 + rand() * 7,
        distanceToWeather: 300 + rand() * 500,
        timeToWeatherEntry: 999,
        trafficDensity: Math.floor(rand() * 4),
        restrictedProximity: 250 + rand() * 500,
        availableManeuverOptionsCount: 6 + Math.floor(rand() * 3),
      };
    } else if (archetype === 1) {
      // 2. Low Risk Proximity / Light Weather
      sampleFeatures = {
        currentSeparationDistance: 90 + rand() * 120,
        predictedClosestSeparation: 90 + rand() * 60,
        timeToClosestApproach: 70 + rand() * 50,
        altitudeDifference: 1000 + rand() * 4000,
        relativeSpeed: 400 + rand() * 500,
        headingDifference: rand() * 180,
        weatherSeverity: Math.floor(rand() * 2) + 1,
        windSpeed: 20 + rand() * 40,
        visibility: 4 + rand() * 5,
        distanceToWeather: 120 + rand() * 250,
        timeToWeatherEntry: 80 + rand() * 40,
        trafficDensity: Math.floor(rand() * 5),
        restrictedProximity: 150 + rand() * 400,
        availableManeuverOptionsCount: 5 + Math.floor(rand() * 3),
      };
    } else if (archetype === 2) {
      // 3. Moderate Risk (Caution separation / moderate precipitation)
      sampleFeatures = {
        currentSeparationDistance: 60 + rand() * 60,
        predictedClosestSeparation: 55 + rand() * 35,
        timeToClosestApproach: 45 + rand() * 45,
        altitudeDifference: rand() < 0.6 ? Math.floor(rand() * 900) : 1000 + rand() * 2000,
        relativeSpeed: 500 + rand() * 600,
        headingDifference: 30 + rand() * 120,
        weatherSeverity: Math.floor(rand() * 2) + 2,
        windSpeed: 40 + rand() * 50,
        visibility: 2 + rand() * 4,
        distanceToWeather: 60 + rand() * 100,
        timeToWeatherEntry: 45 + rand() * 45,
        trafficDensity: 2 + Math.floor(rand() * 5),
        restrictedProximity: 80 + rand() * 200,
        availableManeuverOptionsCount: 3 + Math.floor(rand() * 3),
      };
    } else if (archetype === 3) {
      // 4. High Risk (Converging traffic / storm approach)
      sampleFeatures = {
        currentSeparationDistance: 35 + rand() * 45,
        predictedClosestSeparation: 15 + rand() * 38,
        timeToClosestApproach: 20 + rand() * 40,
        altitudeDifference: Math.floor(rand() * 800),
        relativeSpeed: 600 + rand() * 600,
        headingDifference: 45 + rand() * 135,
        weatherSeverity: rand() < 0.7 ? 3 : 4,
        windSpeed: 65 + rand() * 50,
        visibility: 1 + rand() * 2.5,
        distanceToWeather: 20 + rand() * 60,
        timeToWeatherEntry: 20 + rand() * 40,
        trafficDensity: 3 + Math.floor(rand() * 6),
        restrictedProximity: 40 + rand() * 120,
        availableManeuverOptionsCount: 1 + Math.floor(rand() * 3),
      };
    } else {
      // 5. Critical Risk (Imminent loss of separation / Inside storm)
      sampleFeatures = {
        currentSeparationDistance: 5 + rand() * 30,
        predictedClosestSeparation: rand() * 25,
        timeToClosestApproach: 5 + rand() * 25,
        altitudeDifference: Math.floor(rand() * 400),
        relativeSpeed: 700 + rand() * 600,
        headingDifference: 80 + rand() * 100,
        weatherSeverity: rand() < 0.8 ? 4 : 3,
        windSpeed: 80 + rand() * 60,
        visibility: 0.5 + rand() * 1.5,
        distanceToWeather: rand() * 20,
        timeToWeatherEntry: rand() * 25,
        trafficDensity: 4 + Math.floor(rand() * 6),
        restrictedProximity: rand() * 60,
        availableManeuverOptionsCount: Math.floor(rand() * 2),
      };
    }

    const label = assignGroundTruthLabel(sampleFeatures);

    samples.push({
      id: `sample_${i + 1}`,
      features: sampleFeatures,
      label,
    });
  }

  return samples;
}
