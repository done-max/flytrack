import { describe, it, expect } from 'vitest';
import { createAircraft } from '../aircraft';
import { calculateBearingToPoint, smoothTurnTowardsHeading, updateAircraftPosition } from '../movement';
import { evaluateAirspaceSectors, ATC_SECTOR_DEFS } from '../../weather/airspaceSafety';
import { SCENARIOS } from '../scenarios';
import { SimulationEngine } from '../simulationEngine';
import type { Aircraft } from '../../types/aircraft';

describe('Phase 5: Realistic Airspace Data and Advanced Simulation Engine', () => {
  describe('Waypoint Navigation & Smooth Bearing Calculations', () => {
    it('should accurately calculate bearing towards a target waypoint coordinate', () => {
      // Due North (dx=0, dy=-100) -> 0°
      const bearingNorth = calculateBearingToPoint(100, 200, 100, 100);
      expect(bearingNorth).toBeCloseTo(0, 1);

      // Due East (dx=100, dy=0) -> 90°
      const bearingEast = calculateBearingToPoint(100, 100, 200, 100);
      expect(bearingEast).toBeCloseTo(90, 1);

      // Due South (dx=0, dy=100) -> 180°
      const bearingSouth = calculateBearingToPoint(100, 100, 100, 200);
      expect(bearingSouth).toBeCloseTo(180, 1);

      // Due West (dx=-100, dy=0) -> 270°
      const bearingWest = calculateBearingToPoint(200, 100, 100, 100);
      expect(bearingWest).toBeCloseTo(270, 1);
    });

    it('should turn smoothly towards target heading without snapping', () => {
      // Current: 0°, Target: 90°, delta: 1s, turnRate: 4 deg/sec -> should be 4°
      const turned = smoothTurnTowardsHeading(0, 90, 4, 1.0);
      expect(turned).toBe(4);

      // Current: 10°, Target: 350° (shortest turn is left / -20°) -> should decrease by 4° to 6°
      const turnedLeft = smoothTurnTowardsHeading(10, 350, 4, 1.0);
      expect(turnedLeft).toBe(6);

      // Turn within limit should snap cleanly to exact target
      const snapped = smoothTurnTowardsHeading(88, 90, 4, 1.0);
      expect(snapped).toBe(90);
    });

    it('should steer aircraft towards next waypoint and advance waypoint index when within 25px', () => {
      const ac = createAircraft({
        id: 'TEST_AC',
        callsign: 'TEST 101',
        x: 100,
        y: 100,
        altitude: 35000,
        speed: 500,
        heading: 90,
        route: [
          { id: 'WP1', name: 'WAYPT1', x: 110, y: 100 }, // 10px away (< 25px threshold)
          { id: 'WP2', name: 'WAYPT2', x: 300, y: 100 },
        ],
        currentWaypointIndex: 0,
      });

      // Update position with deltaSeconds=0.1, simSpeed=1, bounds
      const updated = updateAircraftPosition(ac, 0.1, 1, { width: 1000, height: 800, minX: 0, maxX: 1000, minY: 0, maxY: 800 });
      
      // Because distance was 10px <= 25px, waypoint index should have advanced to 1
      expect(updated.currentWaypointIndex).toBe(1);
    });
  });

  describe('ATC Airspace Sectors & Dynamic Traffic Density', () => {
    it('should define exactly 6 standard ATC sectors covering the 1000x800 airspace grid', () => {
      expect(ATC_SECTOR_DEFS).toHaveLength(6);
      const sectorIds = ATC_SECTOR_DEFS.map((s) => s.id);
      expect(sectorIds).toEqual(['sec_nw', 'sec_nc', 'sec_ne', 'sec_sw', 'sec_sc', 'sec_se']);
    });

    it('should accurately distribute aircraft into their respective sectors and compute density', () => {
      const aircraft: Aircraft[] = [
        createAircraft({ id: 'AC1', callsign: 'A1', x: 100, y: 100, altitude: 30000, speed: 450, heading: 90 }), // NW
        createAircraft({ id: 'AC2', callsign: 'A2', x: 150, y: 150, altitude: 30000, speed: 450, heading: 90 }), // NW
        createAircraft({ id: 'AC3', callsign: 'A3', x: 200, y: 200, altitude: 30000, speed: 450, heading: 90 }), // NW (3 in NW -> HIGH)
        createAircraft({ id: 'AC4', callsign: 'A4', x: 500, y: 200, altitude: 30000, speed: 450, heading: 90 }), // NC
        createAircraft({ id: 'AC5', callsign: 'A5', x: 800, y: 600, altitude: 30000, speed: 450, heading: 90 }), // SE
      ];

      const { sectors, overview } = evaluateAirspaceSectors(aircraft, [], [], []);

      expect(sectors).toHaveLength(6);
      const nwSector = sectors.find((s) => s.id === 'sec_nw');
      expect(nwSector).toBeDefined();
      expect(nwSector?.aircraftCount).toBe(3);
      expect(nwSector?.densityLevel).toBe('HIGH');

      const ncSector = sectors.find((s) => s.id === 'sec_nc');
      expect(ncSector?.aircraftCount).toBe(1);
      expect(ncSector?.densityLevel).toBe('LOW');

      expect(overview.activeAircraftCount).toBe(5);
    });

    it('should escalate sector traffic density to HIGH when count is 3-4 and CRITICAL when 5+', () => {
      const aircraft: Aircraft[] = [
        createAircraft({ id: 'AC1', callsign: 'A1', x: 100, y: 100, altitude: 30000, speed: 450, heading: 90 }),
        createAircraft({ id: 'AC2', callsign: 'A2', x: 110, y: 110, altitude: 30000, speed: 450, heading: 90 }),
        createAircraft({ id: 'AC3', callsign: 'A3', x: 120, y: 120, altitude: 30000, speed: 450, heading: 90 }),
        createAircraft({ id: 'AC4', callsign: 'A4', x: 130, y: 130, altitude: 30000, speed: 450, heading: 90 }),
        createAircraft({ id: 'AC5', callsign: 'A5', x: 140, y: 140, altitude: 30000, speed: 450, heading: 90 }),
      ];

      const { sectors } = evaluateAirspaceSectors(aircraft, [], [], []);
      const nwSector = sectors.find((s) => s.id === 'sec_nw');
      expect(nwSector?.densityLevel).toBe('CRITICAL');
    });
  });

  describe('Phase 5 Scenarios & Simulation Engine Fleet Stability', () => {
    it('scenario_phase5_dense_airspace should contain at least 10 aircraft with waypoint routes', () => {
      const scenario = SCENARIOS.scenario_phase5_dense_airspace;
      expect(scenario).toBeDefined();
      expect(scenario.aircraft.length).toBeGreaterThanOrEqual(10);

      // Verify all aircraft have valid callsigns, routes, and waypoints
      for (const ac of scenario.aircraft) {
        expect(ac.callsign).toBeTruthy();
        expect(ac.route).toBeDefined();
        expect(ac.route?.length).toBeGreaterThan(0);
        expect(ac.currentWaypointIndex).toBe(0);
      }
    });

    it('should run 10-aircraft Phase 5 simulation engine continuously without runtime error', () => {
      const scenario = SCENARIOS.scenario_phase5_dense_airspace;
      const engine = new SimulationEngine(
        scenario.aircraft,
        scenario.weatherZones || [],
        scenario.restrictedZones || []
      );

      // Verify initial getters
      expect(engine.getAircraft().length).toBe(10);
      expect(engine.getAirspaceSectors().length).toBe(6);
      expect(engine.getAirspaceOverview().activeAircraftCount).toBe(10);

      // Execute 20 manual simulation steps
      for (let i = 0; i < 20; i++) {
        engine.stepManual(0.5);
      }

      const postAircraft = engine.getAircraft();
      expect(postAircraft.length).toBe(10);
      expect(postAircraft[0].routeHistory.length).toBeGreaterThan(1);
      expect(engine.getAirspaceOverview().overallAirspaceRiskScore).toBeGreaterThanOrEqual(0);

      engine.destroy();
    });
  });
});
