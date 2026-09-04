import React from 'react';
import type { WeatherZone, AircraftWeatherInteraction } from '../types/weather';
import type { Aircraft } from '../types/aircraft';
import { CloudLightning, CloudRain, EyeOff } from 'lucide-react';

interface WeatherZoneLayerProps {
  weatherZones: WeatherZone[];
  interactions: AircraftWeatherInteraction[];
  aircraftList: Aircraft[];
  selectedZoneId?: string | null;
  onSelectZone?: (zone: WeatherZone) => void;
}

export const WeatherZoneLayer: React.FC<WeatherZoneLayerProps> = ({
  weatherZones,
  interactions,
  selectedZoneId,
  onSelectZone,
}) => {
  return (
    <g className="weather-zone-layer pointer-events-auto">
      <defs>
        {/* Thunderstorm Radial Gradient */}
        <radialGradient id="grad-thunderstorm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#b91c1c" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.05" />
        </radialGradient>

        {/* Rain Radial Gradient */}
        <radialGradient id="grad-rain" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#0284c7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.02" />
        </radialGradient>

        {/* Heavy Rain Radial Gradient */}
        <radialGradient id="grad-heavy-rain" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3730a3" stopOpacity="0.03" />
        </radialGradient>

        {/* Fog / Low Visibility Radial Gradient */}
        <radialGradient id="grad-fog" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#94a3b8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.02" />
        </radialGradient>

        {/* Caution Weather Radial Gradient */}
        <radialGradient id="grad-caution" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#d97706" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0.03" />
        </radialGradient>
      </defs>

      {weatherZones.map((zone) => {
        if (!zone.isActive) return null;

        const isSelected = selectedZoneId === zone.id;
        const isStorm = zone.type === 'THUNDERSTORM' || zone.type === 'STORM';
        const isCritical = zone.severity === 'CRITICAL';
        const isHigh = zone.severity === 'HIGH';

        // Select gradient
        let fillGradient = 'url(#grad-rain)';
        let strokeColor = 'rgba(56, 189, 248, 0.4)';
        let badgeBg = 'bg-sky-500/20 text-sky-200 border-sky-400/40';

        if (isStorm || isCritical) {
          fillGradient = 'url(#grad-thunderstorm)';
          strokeColor = 'rgba(239, 68, 68, 0.6)';
          badgeBg = 'bg-red-500/30 text-red-200 border-red-500/50';
        } else if (isHigh || zone.severity === 'MODERATE') {
          fillGradient = 'url(#grad-heavy-rain)';
          strokeColor = 'rgba(129, 140, 248, 0.5)';
          badgeBg = 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40';
        } else if (zone.type === 'LOW_VISIBILITY') {
          fillGradient = 'url(#grad-fog)';
          strokeColor = 'rgba(203, 213, 225, 0.4)';
          badgeBg = 'bg-slate-500/20 text-slate-200 border-slate-400/40';
        }

        // Check if any aircraft is currently inside or approaching this zone
        const zoneInteractions = interactions.filter((i) => i.weatherZoneId === zone.id);
        const hasActiveExposure = zoneInteractions.some(
          (i) => i.currentExposure || i.predictedExposure
        );

        return (
          <g
            key={zone.id}
            className="cursor-pointer transition-all duration-300 group"
            onClick={() => onSelectZone && onSelectZone(zone)}
          >
            {/* Outer Pulsing Aura for Severe Storms */}
            {(isStorm || isCritical) && (
              <circle
                cx={zone.center.x}
                cy={zone.center.y}
                r={zone.radius + 12}
                fill="none"
                stroke="rgba(239, 68, 68, 0.25)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                className="animate-spin-slow"
                style={{ transformOrigin: `${zone.center.x}px ${zone.center.y}px` }}
              />
            )}

            {/* Weather Zone Body */}
            <circle
              cx={zone.center.x}
              cy={zone.center.y}
              r={zone.radius}
              fill={fillGradient}
              stroke={strokeColor}
              strokeWidth={isSelected || hasActiveExposure ? '2.5' : '1.5'}
              strokeDasharray={isStorm ? '8 4' : '4 3'}
              className={`transition-all duration-200 ${
                hasActiveExposure ? 'filter drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]' : ''
              }`}
            />

            {/* Weather Center Icon & Tactical Glass Badge */}
            <foreignObject
              x={zone.center.x - 75}
              y={zone.center.y - 28}
              width={150}
              height={60}
              className="overflow-visible pointer-events-none"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass text-[10px] font-mono font-bold shadow-lg border ${badgeBg} ${
                    isSelected ? 'ring-2 ring-white/60' : ''
                  }`}
                >
                  {isStorm ? (
                    <CloudLightning className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  ) : zone.type === 'LOW_VISIBILITY' ? (
                    <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                  ) : (
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span className="tracking-wider uppercase">{zone.name}</span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-[8.5px] font-mono text-slate-300 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 shadow-sm backdrop-blur-md">
                  <span>WIND: {zone.windSpeed} km/h</span>
                  <span>•</span>
                  <span>VIS: {zone.visibility} km</span>
                </div>
              </div>
            </foreignObject>

            {/* Highlighted Approach Vectors for converging aircraft */}
            {zoneInteractions.map((inter) => {
              if (!inter.predictedExposure || inter.timeToEntry === null || inter.currentExposure)
                return null;

              return (
                <g key={`approach-${inter.aircraftId}-${zone.id}`}>
                  <line
                    x1={zone.center.x}
                    y1={zone.center.y}
                    x2={zone.center.x}
                    y2={zone.center.y}
                    stroke="rgba(239,68,68,0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
