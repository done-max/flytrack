import type { ScenarioDefinition } from '../types/aircraft';
import { createAircraft } from './aircraft';
import { createWeatherZone, DEFAULT_WEATHER_ZONES, DEFAULT_RESTRICTED_ZONES } from '../weather/weatherZones';

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  // Phase 2: Scenario 1 - Safe Flight
  scenario_safe: {
    id: 'scenario_safe',
    name: 'Scenario 1: Safe Flight',
    tagline: 'Standard Airway Separation (Safe)',
    description:
      'Three commercial aircraft maintaining standard lateral and vertical separation along parallel navigation corridors with zero conflict risk.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'SKY 101',
        model: 'B787-9',
        x: 150,
        y: 200,
        altitude: 33000,
        speed: 500,
        heading: 90, // Eastbound on Airway J48
        origin: 'JFK',
        destination: 'LHR',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'AAL 452',
        model: 'A350-900',
        x: 150,
        y: 400,
        altitude: 33000,
        speed: 500,
        heading: 90, // Eastbound on Airway Q102 (200px lateral separation)
        origin: 'MIA',
        destination: 'ORD',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC003',
        callsign: 'DLH 789',
        model: 'B737-MAX8',
        x: 850,
        y: 600,
        altitude: 35000,
        speed: 480,
        heading: 270, // Westbound on Airway J70
        origin: 'FRA',
        destination: 'YYZ',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [],
    restrictedZones: [],
  },

  // Phase 2: Scenario 2 - Predicted Conflict
  scenario_conflict: {
    id: 'scenario_conflict',
    name: 'Scenario 2: Predicted Conflict',
    tagline: 'Converging 90° Intercept at Same Altitude',
    description:
      'Two aircraft on crossing trajectories at FL300 (30,000 ft). As they approach their future intersection, risk escalates from SAFE → WARNING → HIGH_RISK → CRITICAL.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'SKY 101',
        model: 'B777-300ER',
        x: 100,
        y: 360,
        altitude: 30000,
        speed: 520,
        heading: 90, // Eastbound towards (450, 360)
        origin: 'LAX',
        destination: 'JFK',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'UAL 452',
        model: 'A330-300',
        x: 450,
        y: 710,
        altitude: 30000,
        speed: 520,
        heading: 0, // Northbound towards (450, 360)
        origin: 'DFW',
        destination: 'BOS',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC003',
        callsign: 'BAW 214',
        model: 'A380-800',
        x: 750,
        y: 160,
        altitude: 38000,
        speed: 490,
        heading: 260, // Clear safe corridor
        origin: 'LHR',
        destination: 'SFO',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [],
    restrictedZones: [],
  },

  // Phase 2: Scenario 3 - Altitude Separation
  scenario_altitude: {
    id: 'scenario_altitude',
    name: 'Scenario 3: Altitude Separation',
    tagline: 'Crossing 2D Trajectories with 6,000 ft Vertical Clearance',
    description:
      'Two aircraft have intersecting 2D ground tracks at the center of the sector, but maintain 6,000 ft vertical separation (FL300 vs FL360), resulting in zero collision risk.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'SKY 101',
        model: 'B787-9',
        x: 150,
        y: 375,
        altitude: 30000, // FL300
        speed: 520,
        heading: 90,
        origin: 'BOS',
        destination: 'SFO',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'AFR 012',
        model: 'A350-900',
        x: 500,
        y: 700,
        altitude: 36000, // FL360 (6,000 ft vertical clearance)
        speed: 520,
        heading: 0,
        origin: 'CDG',
        destination: 'IAH',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [],
    restrictedZones: [],
  },

  // Phase 2: Scenario 4 - Multiple Aircraft Traffic
  scenario_multi: {
    id: 'scenario_multi',
    name: 'Scenario 4: Multiple Aircraft',
    tagline: 'Multi-Traffic Sector with Single Conflict Pair',
    description:
      'Five aircraft operating in the sector. Only SKY 101 and UAL 452 create a predicted conflict, while the other three aircraft fly safely without false positive alerts.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'SKY 101',
        model: 'B737-800',
        x: 120,
        y: 375,
        altitude: 32000,
        speed: 500,
        heading: 90, // Converging with UAL 452
        origin: 'SEA',
        destination: 'DEN',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'UAL 452',
        model: 'A321neo',
        x: 480,
        y: 720,
        altitude: 32000,
        speed: 500,
        heading: 0, // Converging with SKY 101
        origin: 'DFW',
        destination: 'BOS',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC003',
        callsign: 'QFA 008',
        model: 'B787-9',
        x: 820,
        y: 180,
        altitude: 38000,
        speed: 520,
        heading: 270, // Safe high-altitude corridor
        origin: 'SYD',
        destination: 'JFK',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC004',
        callsign: 'SWA 1940',
        model: 'B737-700',
        x: 180,
        y: 650,
        altitude: 26000,
        speed: 460,
        heading: 30, // Safe lower altitude
        origin: 'PHX',
        destination: 'MDW',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC005',
        callsign: 'KLM 641',
        model: 'B777-200ER',
        x: 820,
        y: 580,
        altitude: 36000,
        speed: 510,
        heading: 270, // Safe westbound corridor
        origin: 'AMS',
        destination: 'ATL',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [],
    restrictedZones: [],
  },

  // Phase 2: Scenario 5 - Head-On Approach
  scenario_headon: {
    id: 'scenario_headon',
    name: 'Scenario 5: Head-On Approach',
    tagline: 'High-Closing-Speed Opposite Headings (180°)',
    description:
      'Two aircraft (AAL 100 and DAL 200) cruising toward each other on the exact same airway (heading 090° vs 270°) at FL320 with over 1,000 kts relative closing speed.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'AAL 100',
        model: 'B777-300ER',
        x: 120,
        y: 375,
        altitude: 32000,
        speed: 540,
        heading: 90, // Eastbound
        origin: 'SFO',
        destination: 'JFK',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'DAL 200',
        model: 'A350-900',
        x: 880,
        y: 375,
        altitude: 32000,
        speed: 540,
        heading: 270, // Westbound (direct reciprocal heading)
        origin: 'JFK',
        destination: 'SFO',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [],
    restrictedZones: [],
  },

  // ==========================================
  // Phase 3: Weather Scenarios
  // ==========================================

  // Phase 3: Scenario W1 - Clear Airspace
  scenario_weather_clear: {
    id: 'scenario_weather_clear',
    name: 'Weather 1: Clear Airspace',
    tagline: 'Nominal Atmosphere & Standard Airway Routing',
    description:
      'Nominal atmospheric conditions across the sector with zero convective hazards. All aircraft operate safely in standard corridor buffers.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'SKY 101',
        model: 'B787-9',
        x: 150,
        y: 250,
        altitude: 34000,
        speed: 490,
        heading: 90,
        origin: 'ORD',
        destination: 'LGA',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'DAL 452',
        model: 'A321neo',
        x: 850,
        y: 480,
        altitude: 36000,
        speed: 510,
        heading: 270,
        origin: 'BOS',
        destination: 'DEN',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [],
    restrictedZones: [],
  },

  // Phase 3: Scenario W2 - Storm Ahead
  scenario_weather_storm_ahead: {
    id: 'scenario_weather_storm_ahead',
    name: 'Weather 2: Storm Ahead',
    tagline: 'Direct Convective Storm Cell Intercept',
    description:
      'SKY 101 cruising eastbound at FL320 directly towards an active severe supercell (Storm Cell Alpha). Weather alert triggers with real-time time to entry countdown.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'SKY 101',
        model: 'B777-300ER',
        x: 150,
        y: 375,
        altitude: 32000,
        speed: 500,
        heading: 90, // Flying directly into storm at (550, 375)
        origin: 'SFO',
        destination: 'JFK',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'SWA 880',
        model: 'B737-800',
        x: 150,
        y: 650,
        altitude: 36000,
        speed: 470,
        heading: 90, // Flying safely below storm on clear southern airway
        origin: 'LAX',
        destination: 'MCO',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [
      createWeatherZone({
        id: 'WZ_STORM_ALPHA',
        name: 'Supercell Storm Alpha',
        type: 'THUNDERSTORM',
        severity: 'CRITICAL',
        center: { x: 550, y: 375 },
        radius: 105,
        windSpeed: 85,
        windHeading: 270,
        visibility: 1.0,
        minAltitudeFt: 0,
        maxAltitudeFt: 45000,
        isActive: true,
        description: 'Severe convective supercell with extreme turbulence and lightning',
      }),
    ],
    restrictedZones: [],
  },

  // Phase 3: Scenario W3 - Aircraft Conflict + Storm
  scenario_weather_conflict_storm: {
    id: 'scenario_weather_conflict_storm',
    name: 'Weather 3: Conflict + Storm',
    tagline: 'Dual Hazard: STCA Converging Traffic + Weather Blockade',
    description:
      'SKY 101 & UAL 452 are in an impending collision conflict. The standard right turn escape vector is blocked by a severe thunderstorm cell, highlighting multi-hazard risk.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'SKY 101',
        model: 'B787-9',
        x: 120,
        y: 360,
        altitude: 31000,
        speed: 520,
        heading: 90, // Eastbound converging on (450, 360)
        origin: 'SEA',
        destination: 'BOS',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'UAL 452',
        model: 'A330-300',
        x: 450,
        y: 690,
        altitude: 31000,
        speed: 520,
        heading: 0, // Northbound converging on (450, 360)
        origin: 'DFW',
        destination: 'ORD',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [
      createWeatherZone({
        id: 'WZ_ESCAPE_BLOCK',
        name: 'Storm Front Echo',
        type: 'THUNDERSTORM',
        severity: 'HIGH',
        center: { x: 450, y: 220 }, // Blocks northbound escape for UAL452 / northeast turn for SKY101
        radius: 85,
        windSpeed: 70,
        windHeading: 210,
        visibility: 1.5,
        minAltitudeFt: 0,
        maxAltitudeFt: 40000,
        isActive: true,
        description: 'Convective storm cell obstructing standard northern clearance corridors',
      }),
    ],
    restrictedZones: [
      {
        id: 'RZ_MOA_NORTH',
        name: 'Restricted Airspace R-2508',
        center: { x: 250, y: 180 },
        radius: 65,
        minAltitudeFt: 0,
        maxAltitudeFt: 60000,
        status: 'RESTRICTED',
        description: 'Military operating area',
      },
    ],
  },

  // Phase 3: Scenario W4 - Multiple Weather Zones
  scenario_weather_multi: {
    id: 'scenario_weather_multi',
    name: 'Weather 4: Multi-Hazard Sector',
    tagline: 'Thunderstorm, Heavy Rain & Low Visibility Weather Matrix',
    description:
      'Three distinct weather hazard cells operating simultaneously. Multiple aircraft experience distinct weather risks depending on their altitude and trajectory.',
    aircraft: [
      createAircraft({
        id: 'AC001',
        callsign: 'SKY 101',
        model: 'B777-300ER',
        x: 120,
        y: 350,
        altitude: 32000,
        speed: 500,
        heading: 90, // Intersects Storm Alpha
        origin: 'SFO',
        destination: 'JFK',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC002',
        callsign: 'AFR 012',
        model: 'A350-900',
        x: 100,
        y: 560,
        altitude: 20000,
        speed: 460,
        heading: 90, // Intersects Heavy Rain Bravo (at 20,000 ft)
        origin: 'CDG',
        destination: 'MIA',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC003',
        callsign: 'BAW 214',
        model: 'A380-800',
        x: 880,
        y: 220,
        altitude: 38000,
        speed: 520,
        heading: 270, // Overflies Fog Charlie safely (FL380 >> 8000ft ceiling)
        origin: 'LHR',
        destination: 'LAX',
        status: 'NORMAL',
      }),
      createAircraft({
        id: 'AC004',
        callsign: 'DLH 789',
        model: 'B787-9',
        x: 850,
        y: 680,
        altitude: 34000,
        speed: 490,
        heading: 270, // Clear corridor south
        origin: 'FRA',
        destination: 'IAH',
        status: 'NORMAL',
      }),
    ],
    weatherZones: [...DEFAULT_WEATHER_ZONES],
    restrictedZones: [...DEFAULT_RESTRICTED_ZONES],
  },
};
