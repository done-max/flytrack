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
  // Primary: Radar Green, Critical: Red, Secondary: Blue
  const getStatusColor = (s: AircraftStatus) => {
    switch (s) {
      case 'CRITICAL':
        return {
          primary: '#ef4444',
          secondary: '#fca5a5',
          bg: 'rgba(25, 4, 4, 0.85)',
          border: 'rgba(239, 68, 68, 0.8)',
          text: '#fca5a5',
          glow: 'rgba(239, 68, 68, 0.5)',
        };
      case 'HIGH_RISK':
        return {
          primary: '#f87171',
          secondary: '#fca5a5',
          bg: 'rgba(25, 8, 8, 0.85)',
          border: 'rgba(248, 113, 113, 0.7)',
          text: '#fca5a5',
          glow: 'rgba(248, 113, 113, 0.4)',
        };
      case 'CAUTION':
        return {
          primary: '#f59e0b',
          secondary: '#fcd34d',
          bg: 'rgba(24, 14, 4, 0.85)',
          border: 'rgba(245, 158, 11, 0.7)',
          text: '#fcd34d',
          glow: 'rgba(245, 158, 11, 0.4)',
        };
      case 'NORMAL':
      default:
        return {
          primary: '#22c55e',
          secondary: '#86efac',
          bg: 'rgba(4, 16, 8, 0.85)',
          border: 'rgba(74, 222, 128, 0.5)',
          text: '#86efac',
          glow: 'rgba(34, 197, 94, 0.35)',
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
            fill="rgba(239, 68, 68, 0.15)"
            stroke="none"
          />
        </g>
      )}

      {/* Target Selection Reticle in Secondary Blue */}
      {isSelected && (
        <g className="selection-brackets pointer-events-none" stroke="#38bdf8" strokeWidth="1.2">
          <circle cx="0" cy="0" r="14" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.6)" strokeDasharray="2 2" />
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

      {/* Full Data Block (FDB) with Translucent Frosted Glass Plate */}
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
              stroke="rgba(255, 255, 255, 0.2)"
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
