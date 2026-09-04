import React from 'react';
import type { Aircraft, AircraftStatus } from '../types/aircraft';

interface AircraftMarkerProps {
  aircraft: Aircraft;
  isSelected: boolean;
  showLabels: boolean;
  onSelect: (aircraft: Aircraft) => void;
}

export const AircraftMarker: React.FC<AircraftMarkerProps> = ({
  aircraft,
  isSelected,
  showLabels,
  onSelect,
}) => {
  // Neutral Liquid Glass Colors with Vivid Alert Red for Conflicts
  const getStatusColor = (s: AircraftStatus) => {
    switch (s) {
      case 'CRITICAL':
        return {
          primary: '#ef4444',
          secondary: '#fca5a5',
          bg: 'rgba(36, 8, 14, 0.88)',
          border: 'rgba(248, 113, 113, 0.85)',
          text: '#fecaca',
        };
      case 'HIGH_RISK':
        return {
          primary: '#f87171',
          secondary: '#fca5a5',
          bg: 'rgba(32, 12, 16, 0.88)',
          border: 'rgba(248, 113, 113, 0.7)',
          text: '#fecaca',
        };
      case 'CAUTION':
        return {
          primary: '#fbbf24',
          secondary: '#fde68a',
          bg: 'rgba(30, 20, 8, 0.88)',
          border: 'rgba(251, 191, 36, 0.75)',
          text: '#fde68a',
        };
      case 'NORMAL':
      default:
        return {
          primary: '#38bdf8',
          secondary: '#bae6fd',
          bg: 'rgba(13, 17, 23, 0.85)',
          border: 'rgba(255, 255, 255, 0.22)',
          text: '#ffffff',
        };
    }
  };

  const colors = getStatusColor(aircraft.status);

  // Flight Level & Trend
  const flightLevel = Math.round(aircraft.altitude / 100);
  const formattedFL = String(flightLevel).padStart(3, '0');
  const altDiff = (aircraft.targetAltitude ?? aircraft.altitude) - aircraft.altitude;
  const trendChar = altDiff > 100 ? '↑' : altDiff < -100 ? '↓' : '=';

  // 1-minute speed vector leader length
  const speedVectorLength = Math.max(14, (aircraft.speed / 60) * 3);

  // J-hook leader line offset
  const leaderDx = 26;
  const leaderDy = -24;

  return (
    <g
      className="atc-radar-target cursor-pointer font-mono"
      transform={`translate(${aircraft.x}, ${aircraft.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(aircraft);
      }}
    >
      {/* Critical STCA Alert Pulse Ring in Red */}
      {aircraft.status === 'CRITICAL' && (
        <g>
          <circle
            cx="0"
            cy="0"
            r="18"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            className="animate-spin"
            style={{ animationDuration: '2.5s' }}
          />
          <circle
            cx="0"
            cy="0"
            r="12"
            fill="rgba(239, 68, 68, 0.18)"
            stroke="none"
          />
        </g>
      )}

      {/* Target Selection Reticle in Ice Cyan */}
      {isSelected && (
        <g className="selection-brackets pointer-events-none" stroke="#38bdf8" strokeWidth="1.2">
          <circle cx="0" cy="0" r="15" fill="rgba(56, 189, 248, 0.14)" stroke="rgba(56, 189, 248, 0.7)" strokeDasharray="2 2" />
          <path d="M -10,-6 L -10,-10 L -6,-10" fill="none" />
          <path d="M 10,-6 L 10,-10 L 6,-10" fill="none" />
          <path d="M -10,6 L -10,10 L -6,10" fill="none" />
          <path d="M 10,6 L 10,10 L 6,10" fill="none" />
        </g>
      )}

      {/* Speed Vector Leader Line */}
      <g transform={`rotate(${aircraft.heading})`}>
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={-speedVectorLength}
          stroke={colors.primary}
          strokeWidth="1.2"
          strokeOpacity="0.9"
        />
        <line
          x1="-2.5"
          y1={-speedVectorLength}
          x2="2.5"
          y2={-speedVectorLength}
          stroke={colors.primary}
          strokeWidth="1.2"
        />
      </g>

      {/* Precision SSR Radar Target Chevron */}
      <g transform={`rotate(${aircraft.heading})`}>
        <polygon
          points="0,-6 4.5,4 0,1.8 -4.5,4"
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="0.8"
        />
        <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
      </g>

      {/* Full Data Block (FDB) with Translucent Liquid Glass Plate */}
      {showLabels && (
        <g className="full-data-block select-none pointer-events-none">
          {/* J-Hook Leader Line */}
          <polyline
            points={`0,0 ${leaderDx - 4},${leaderDy + 10} ${leaderDx},${leaderDy + 10}`}
            fill="none"
            stroke={isSelected ? '#38bdf8' : colors.border}
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />

          {/* Frosted Micro-Glass Datatag Plate */}
          <g transform={`translate(${leaderDx}, ${leaderDy})`}>
            {/* Glass Backdrop */}
            <rect
              x="0"
              y="0"
              width="90"
              height="30"
              rx="6"
              ry="6"
              fill={colors.bg}
              stroke={isSelected ? '#38bdf8' : colors.border}
              strokeWidth={isSelected ? '1.2' : '0.8'}
            />
            {/* Top Specular Line */}
            <line
              x1="4"
              y1="1"
              x2="86"
              y2="1"
              stroke="rgba(255, 255, 255, 0.28)"
              strokeWidth="0.8"
            />

            {/* Line 1: Callsign & FL / Speed */}
            <text
              x="5"
              y="11"
              fill={isSelected ? '#38bdf8' : colors.text}
              fontSize="9"
              fontWeight="700"
              letterSpacing="0.3"
            >
              {aircraft.callsign}
            </text>
            <text
              x="85"
              y="11"
              fill={colors.text}
              fontSize="8.5"
              fontWeight="600"
              textAnchor="end"
            >
              {formattedFL}{trendChar}
            </text>

            {/* Line 2: Aircraft Type, Ground Speed, Heading */}
            <text
              x="5"
              y="22"
              fill="#94a3b8"
              fontSize="8"
            >
              {aircraft.model ?? 'B738'}
            </text>
            <text
              x="47"
              y="22"
              fill="#e2e8f0"
              fontSize="8"
              textAnchor="middle"
            >
              {Math.round(aircraft.speed)}K
            </text>
            <text
              x="85"
              y="22"
              fill="#94a3b8"
              fontSize="8"
              textAnchor="end"
            >
              {String(Math.round(aircraft.heading)).padStart(3, '0')}°
            </text>
          </g>
        </g>
      )}
    </g>
  );
};
