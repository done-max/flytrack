import type { WeatherZone } from '../types/weather';
import type { RestrictedZone } from '../types/safety';

export const DEFAULT_WEATHER_ZONES: WeatherZone[] = [
  {
    id: 'WZ_STORM_ALPHA',
    name: 'Storm Cell Alpha',
    type: 'THUNDERSTORM',
    severity: 'CRITICAL',
    center: { x: 550, y: 350 },
    radius: 110,
    windSpeed: 85,
    windHeading: 240,
    visibility: 1.2,
    minAltitudeFt: 0,
    maxAltitudeFt: 42000,
    isActive: true,
    description: 'Severe convective supercell with severe turbulence and hail',
  },
  {
    id: 'WZ_RAIN_BRAVO',
    name: 'Precipitation Band Bravo',
    type: 'HEAVY_RAIN',
    severity: 'MODERATE',
    center: { x: 220, y: 550 },
    radius: 95,
    windSpeed: 45,
    windHeading: 180,
    visibility: 4.5,
    minAltitudeFt: 0,
    maxAltitudeFt: 25000,
    isActive: true,
    description: 'Heavy continuous rain front with moderate wind shear',
  },
  {
    id: 'WZ_FOG_CHARLIE',
    name: 'Low Vis Corridor Charlie',
    type: 'LOW_VISIBILITY',
    severity: 'LOW',
    center: { x: 800, y: 220 },
    radius: 80,
    windSpeed: 15,
    windHeading: 90,
    visibility: 0.8,
    minAltitudeFt: 0,
    maxAltitudeFt: 8000,
    isActive: true,
    description: 'Dense low-altitude marine fog layer',
  },
];

export const DEFAULT_RESTRICTED_ZONES: RestrictedZone[] = [
  {
    id: 'RZ_MOA_01',
    name: 'Restricted Airspace R-2508 (MOA)',
    center: { x: 500, y: 150 },
    radius: 75,
    minAltitudeFt: 0,
    maxAltitudeFt: 60000,
    status: 'RESTRICTED',
    description: 'Military operations area — active live-fire exercise',
  },
];

/**
 * Creates a customized weather zone
 */
export function createWeatherZone(params: Partial<WeatherZone> & { id: string; name: string }): WeatherZone {
  return {
    id: params.id,
    name: params.name,
    type: params.type || 'STORM',
    severity: params.severity || 'HIGH',
    center: params.center || { x: 500, y: 375 },
    radius: params.radius || 90,
    windSpeed: params.windSpeed || 60,
    windHeading: params.windHeading || 0,
    visibility: params.visibility || 2.0,
    minAltitudeFt: params.minAltitudeFt !== undefined ? params.minAltitudeFt : 0,
    maxAltitudeFt: params.maxAltitudeFt !== undefined ? params.maxAltitudeFt : 45000,
    isActive: params.isActive !== undefined ? params.isActive : true,
    description: params.description || '',
  };
}
