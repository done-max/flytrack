import type { Aircraft, AirspaceDimensions, Velocity } from '../types/aircraft';

/**
 * Coordinate and Speed scaling constant:
 * Maps knots & real-time simulation seconds to airspace canvas pixels.
 * e.g., 500 knots at 1x speed moves ~25 pixels per simulated second.
 */
export const SPEED_SCALE_FACTOR = 0.05;

/**
 * Converts heading in degrees (0 = North, 90 = East, 180 = South, 270 = West)
 * and speed (knots) into standard Cartesian velocity components.
 * 
 * Mathematical Formulation:
 * velocityX = speed * sin(headingInRadians)
 * velocityY = -speed * cos(headingInRadians) (Negative because screen Y points downwards)
 */
export function calculateVelocity(speed: number, heading: number): Velocity {
  const headingRad = (heading * Math.PI) / 180;
  const vx = speed * Math.sin(headingRad);
  // In screen coordinates, North (heading 0) moves towards decreasing Y (upwards).
  const vy = -speed * Math.cos(headingRad);
  return { vx, vy };
}

/**
 * Normalizes heading to [0, 360) range
 */
export function normalizeHeading(heading: number): number {
  let normalized = heading % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Advances an aircraft's position, altitude, and velocity based on elapsed delta time.
 * 
 * @param aircraft The aircraft to update
 * @param deltaSeconds Time elapsed in seconds
 * @param simSpeed Multiplier (1x, 2x, 5x, etc.)
 * @param bounds Airspace boundaries for coordinate management
 */
export function updateAircraftPosition(
  aircraft: Aircraft,
  deltaSeconds: number,
  simSpeed: number,
  bounds: AirspaceDimensions
): { x: number; y: number; altitude: number; velocity: Velocity; heading: number } {
  const effectiveDelta = deltaSeconds * simSpeed;
  const velocity = calculateVelocity(aircraft.speed, aircraft.heading);

  // Position displacement
  let newX = aircraft.x + velocity.vx * effectiveDelta * SPEED_SCALE_FACTOR;
  let newY = aircraft.y + velocity.vy * effectiveDelta * SPEED_SCALE_FACTOR;

  // Boundary handling: Wrap around seamlessly when aircraft flies out of sector
  const margin = 40;

  if (newX > bounds.maxX + margin) {
    newX = bounds.minX - margin + (newX - (bounds.maxX + margin));
  } else if (newX < bounds.minX - margin) {
    newX = bounds.maxX + margin - (bounds.minX - margin - newX);
  }

  if (newY > bounds.maxY + margin) {
    newY = bounds.minY - margin + (newY - (bounds.maxY + margin));
  } else if (newY < bounds.minY - margin) {
    newY = bounds.maxY + margin - (bounds.minY - margin - newY);
  }

  // Smooth altitude transition if targetAltitude is set
  let newAltitude = aircraft.altitude;
  if (aircraft.targetAltitude !== undefined && aircraft.targetAltitude !== aircraft.altitude) {
    const diff = aircraft.targetAltitude - aircraft.altitude;
    const climbRateFpm = aircraft.verticalSpeed ?? (diff > 0 ? 1500 : -1500); // 1500 fpm standard
    const altChange = (climbRateFpm / 60) * effectiveDelta;

    if (Math.abs(diff) <= Math.abs(altChange)) {
      newAltitude = aircraft.targetAltitude;
    } else {
      newAltitude += Math.sign(diff) * Math.abs(altChange);
    }
  }

  return {
    x: newX,
    y: newY,
    altitude: Math.round(newAltitude),
    velocity,
    heading: normalizeHeading(aircraft.heading),
  };
}
