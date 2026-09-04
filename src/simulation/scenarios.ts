import type { ScenarioDefinition } from '../types/aircraft';
import { createAircraft } from './aircraft';

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  // Scenario 1: Safe Flight
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
  },

  // Scenario 2: Predicted Conflict
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
  },

  // Scenario 3: Altitude Separation
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
  },

  // Scenario 4: Multiple Aircraft Traffic
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
  },

  // Scenario 5: Head-On Approach
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
  },
};
