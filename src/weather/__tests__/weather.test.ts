import { describe, it, expect } from 'vitest';
import {
  predictAircraftWeatherInteraction,
  evaluateAirspaceWeather,
} from '../weatherPrediction';
import { isAltitudeWithinWeatherZone } from '../weatherRisk';
import { createWeatherZone } from '../weatherZones';
import {
  determineOverallSafety,
  generateDynamicAirspaceGrid,
} from '../airspaceSafety';
import { createAircraft } from '../../simulation/aircraft';
import { SimulationEngine } from '../../simulation/simulationEngine';
import { SCENARIOS } from '../../simulation/scenarios';
import type { WeatherZone } from '../../types/weather';

describe('Phase 3: Weather Prediction Engine - Exact Geometric Intersections', () => {
  const testStormZone: WeatherZone = createWeatherZone({
    id: 'WZ_TEST_STORM',
    name: 'Convective Storm Cell',
    type: 'THUNDERSTORM',
    severity: 'CRITICAL',
    center: { x: 500, y: 300 },
    radius: 100,
    windSpeed: 90,
    visibility: 1.0,
    minAltitudeFt: 0,
    maxAltitudeFt: 40000,
    isActive: true,
  });

  it('1. Detects aircraft moving directly toward storm with exact entry time countdown', () => {
    // Aircraft at (100, 300) flying East (heading 90) at 500 kts (25 px/s)
    // Distance to storm center (500, 300) is 400 px
    // Distance to storm perimeter (radius 100) is 300 px
    // Expected time to entry = 300 / 25 = 12 seconds!
    const ac = createAircraft({
      id: 'AC01',
      callsign: 'SKY 101',
      x: 100,
      y: 300,
      altitude: 32000,
      speed: 500,
      heading: 90,
    });

    const inter = predictAircraftWeatherInteraction(ac, testStormZone, 120);

    expect(inter.predictedExposure).toBe(true);
    expect(inter.currentExposure).toBe(false);
    expect(inter.distanceToZone).toBe(300);
    expect(inter.distanceToCenter).toBe(400);
    expect(inter.timeToEntry).toBe(12);
    expect(inter.timeToExit).toBe(20); // 500/25 = 20s
    expect(inter.weatherRisk).toBe('CRITICAL');
  });

  it('2. Correctly flags aircraft moving away from storm (diverging, no entry)', () => {
    // Aircraft at (100, 300) flying West (heading 270) away from storm at (500, 300)
    const ac = createAircraft({
      id: 'AC02',
      callsign: 'DAL 452',
      x: 100,
      y: 300,
      altitude: 32000,
      speed: 500,
      heading: 270,
    });

    const inter = predictAircraftWeatherInteraction(ac, testStormZone, 120);

    expect(inter.predictedExposure).toBe(false);
    expect(inter.currentExposure).toBe(false);
    expect(inter.timeToEntry).toBeNull();
    expect(inter.weatherRisk).toBe('SAFE');
  });

  it('3. Verifies aircraft passing safely around storm (tangential path outside perimeter)', () => {
    // Aircraft at (100, 500) flying East (heading 90)
    // Storm is at (500, 300) with radius 100 (y span: 200 to 400)
    // Aircraft passes at y=500, closest distance to center is 200 px, perimeter distance is 100 px
    const ac = createAircraft({
      id: 'AC03',
      callsign: 'SWA 880',
      x: 100,
      y: 500,
      altitude: 32000,
      speed: 500,
      heading: 90,
    });

    const inter = predictAircraftWeatherInteraction(ac, testStormZone, 120);

    expect(inter.predictedExposure).toBe(false);
    expect(inter.closestDistance).toBe(100);
    expect(inter.timeToEntry).toBeNull();
    expect(inter.weatherRisk).toBe('SAFE');
  });

  it('4. Computes entry and exit times when aircraft trajectory crosses storm', () => {
    // Aircraft at (500, 50) flying South (heading 180) at 500 kts (25 px/s)
    // Storm center at (500, 300), radius 100 (y span: 200 to 400)
    // Distance from y=50 to y=200 is 150 px -> Entry time = 150 / 25 = 6s
    // Distance from y=50 to y=400 is 350 px -> Exit time = 350 / 25 = 14s
    const ac = createAircraft({
      id: 'AC04',
      callsign: 'AFR 012',
      x: 500,
      y: 50,
      altitude: 25000,
      speed: 500,
      heading: 180,
    });

    const inter = predictAircraftWeatherInteraction(ac, testStormZone, 120);

    expect(inter.predictedExposure).toBe(true);
    expect(inter.timeToEntry).toBe(6);
    expect(inter.timeToExit).toBe(14);
    expect(inter.weatherRisk).toBe('CRITICAL');
  });

  it('5. Verifies safe vertical clearance over low-altitude weather ceiling', () => {
    const lowFogZone: WeatherZone = createWeatherZone({
      id: 'WZ_FOG',
      name: 'Marine Fog Layer',
      type: 'LOW_VISIBILITY',
      severity: 'LOW',
      center: { x: 500, y: 300 },
      radius: 100,
      minAltitudeFt: 0,
      maxAltitudeFt: 8000, // Ceiling is 8,000 ft
      isActive: true,
    });

    // Aircraft cruising at FL350 (35,000 ft) right over the fog center
    const ac = createAircraft({
      id: 'AC05',
      callsign: 'BAW 214',
      x: 500,
      y: 300,
      altitude: 35000,
      speed: 500,
      heading: 90,
    });

    expect(isAltitudeWithinWeatherZone(ac.altitude, lowFogZone)).toBe(false);

    const inter = predictAircraftWeatherInteraction(ac, lowFogZone, 120);

    expect(inter.currentExposure).toBe(false);
    expect(inter.predictedExposure).toBe(false);
    expect(inter.weatherRisk).toBe('SAFE');
  });

  it('6. Dynamically updates weather prediction when aircraft turns heading away from storm', () => {
    // Initially heading 90 (East) towards storm at (500, 300)
    const ac = createAircraft({
      id: 'AC06',
      callsign: 'EVA 01',
      x: 200,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });

    const initialInter = predictAircraftWeatherInteraction(ac, testStormZone, 120);
    expect(initialInter.predictedExposure).toBe(true);
    expect(initialInter.weatherRisk).toBe('CRITICAL');

    // Aircraft turns 90 degrees North (heading 0) to avoid storm
    const turnedAc = { ...ac, heading: 0 };
    const turnedInter = predictAircraftWeatherInteraction(turnedAc, testStormZone, 120);

    expect(turnedInter.predictedExposure).toBe(false);
    expect(turnedInter.weatherRisk).toBe('SAFE');
  });

  it('7. Dynamically updates entry time when aircraft accelerates speed', () => {
    // At 500 kts (25 px/s), distance 200 px -> 8s
    const acSlow = createAircraft({
      id: 'AC07',
      callsign: 'KLM 01',
      x: 200,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90,
    });

    const interSlow = predictAircraftWeatherInteraction(acSlow, testStormZone, 120);
    expect(interSlow.timeToEntry).toBe(8); // (300-100)/25 = 8s

    // Accelerated to 1000 kts (50 px/s) -> 4s
    const acFast = { ...acSlow, speed: 1000 };
    const interFast = predictAircraftWeatherInteraction(acFast, testStormZone, 120);
    expect(interFast.timeToEntry).toBe(4); // 200/50 = 4s
  });
});

describe('Phase 3: Multi-Factor Unified Safety & Dynamic Airspace Classification', () => {
  it('combines collision risk and weather risk into an accurate overall safety state', () => {
    // 1. Both Safe
    const res1 = determineOverallSafety('SAFE', 'SAFE');
    expect(res1.overallSafety).toBe('SAFE');
    expect(res1.primaryHazard).toBe('NONE');

    // 2. Collision Critical + Weather Safe
    const res2 = determineOverallSafety('CRITICAL', 'SAFE');
    expect(res2.overallSafety).toBe('CRITICAL');
    expect(res2.primaryHazard).toBe('COLLISION');

    // 3. Collision Safe + Weather High
    const res3 = determineOverallSafety('SAFE', 'HIGH');
    expect(res3.overallSafety).toBe('HIGH_RISK');
    expect(res3.primaryHazard).toBe('WEATHER');

    // 4. Combined Hazard (STCA Warning + Storm Critical)
    const res4 = determineOverallSafety('WARNING', 'CRITICAL');
    expect(res4.overallSafety).toBe('CRITICAL');
    expect(res4.primaryHazard).toBe('COMBINED');
  });

  it('generates dynamic safe airspace grid sectors reflecting weather and traffic hazards', () => {
    const storm = createWeatherZone({
      id: 'WZ1',
      name: 'Storm Alpha',
      type: 'THUNDERSTORM',
      severity: 'CRITICAL',
      center: { x: 200, y: 200 },
      radius: 80,
    });

    const sectors = generateDynamicAirspaceGrid(
      1000,
      750,
      [storm],
      [],
      [],
      [],
      10,
      8
    );

    expect(sectors.length).toBe(80);

    const dangerSectors = sectors.filter((s) => s.status === 'DANGER');
    expect(dangerSectors.length).toBeGreaterThan(0);

    const safeSectors = sectors.filter((s) => s.status === 'SAFE');
    expect(safeSectors.length).toBeGreaterThan(50);
  });
});

describe('Phase 3: Deterministic Weather Scenarios (W1 to W4)', () => {
  it('Scenario W1 (Clear Airspace) - confirms nominal atmosphere and 0 weather risks', () => {
    const scenario = SCENARIOS.scenario_weather_clear;
    const summary = evaluateAirspaceWeather(scenario.aircraft, scenario.weatherZones || [], 120);

    expect(summary.activeZones).toBe(0);
    expect(summary.highestWeatherRisk).toBe('SAFE');
    expect(summary.affectedAircraftCount).toBe(0);
  });

  it('Scenario W2 (Storm Ahead) - triggers weather warning and time to entry countdown for SKY 101', () => {
    const scenario = SCENARIOS.scenario_weather_storm_ahead;
    const summary = evaluateAirspaceWeather(scenario.aircraft, scenario.weatherZones || [], 120);

    expect(summary.activeZones).toBe(1);
    expect(summary.stormCount).toBe(1);
    expect(summary.highestWeatherRisk).toBe('CRITICAL');
    expect(summary.affectedAircraftCount).toBe(1);

    const interaction = summary.zoneInteractions.find((i) => i.aircraftCallsign === 'SKY 101');
    expect(interaction).toBeDefined();
    expect(interaction?.predictedExposure).toBe(true);
    expect(interaction?.timeToEntry).toBeGreaterThan(0);
  });

  it('Scenario W3 (Conflict + Storm) - verifies simultaneous collision conflict and weather hazard', () => {
    const scenario = SCENARIOS.scenario_weather_conflict_storm;

    const engine = new SimulationEngine(
      scenario.aircraft,
      scenario.weatherZones || [],
      scenario.restrictedZones || []
    );

    engine.stepManual(0.1);

    const conflicts = engine.getConflicts();
    expect(conflicts.length).toBe(1);

    const wSummary = engine.getWeatherSummary();
    expect(wSummary.activeZones).toBe(1);

    const safetyMap = engine.getUnifiedSafetyMap();
    const ac1Safety = safetyMap.get('AC001');
    expect(ac1Safety?.overallSafety).not.toBe('SAFE');

    engine.destroy();
  });

  it('Scenario W4 (Multiple Weather Zones) - verifies multi-hazard matrix across fleet', () => {
    const scenario = SCENARIOS.scenario_weather_multi;
    const summary = evaluateAirspaceWeather(scenario.aircraft, scenario.weatherZones || [], 120);

    expect(summary.totalZones).toBe(3);
    expect(summary.stormCount).toBe(1);
    expect(summary.highRiskZonesCount).toBeGreaterThanOrEqual(1);

    // Multiple aircraft receive distinct weather risks
    const sky101 = summary.zoneInteractions.find((i) => i.aircraftCallsign === 'SKY 101');
    expect(sky101?.weatherRisk).toBe('CRITICAL');

    // BAW 214 overflies low fog safely at FL380
    const baw214 = summary.zoneInteractions.find((i) => i.aircraftCallsign === 'BAW 214');
    expect(baw214).toBeUndefined(); // Safe, no interaction
  });
});

describe('Phase 3: Weather Event Lifecycle Auditing', () => {
  it('records WEATHER_WARNING, AIRCRAFT_ENTERED_DANGER_ZONE, and WEATHER_RISK_RESOLVED upon heading change', () => {
    const storm = createWeatherZone({
      id: 'WZ_STORM',
      name: 'Convective Cell',
      type: 'THUNDERSTORM',
      severity: 'CRITICAL',
      center: { x: 300, y: 300 },
      radius: 80,
    });

    const ac = createAircraft({
      id: 'AC01',
      callsign: 'TEST 101',
      x: 100,
      y: 300,
      altitude: 30000,
      speed: 500,
      heading: 90, // Flying directly towards storm
    });

    const engine = new SimulationEngine([ac], [storm]);
    engine.stepManual(0.1);

    const initialEvents = engine.getWeatherEvents();
    expect(initialEvents.length).toBeGreaterThan(0);
    expect(initialEvents[0].type).toBe('WEATHER_WARNING');
    expect(initialEvents[0].aircraftCallsign).toBe('TEST 101');

    // Turn aircraft away to North (heading 0)
    engine.updateAircraftDirect('AC01', { heading: 0 });

    const updatedEvents = engine.getWeatherEvents();
    const resolvedEvent = updatedEvents.find((e) => e.type === 'WEATHER_RISK_RESOLVED');
    expect(resolvedEvent).toBeDefined();

    engine.destroy();
  });
});
