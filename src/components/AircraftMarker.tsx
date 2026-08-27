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
          primary: '#ef4444', // Alert Red (STCA)
          secondary: '#fca5a5',
          bg: 'rgba(0, 0, 0, 0.95)',
          border: '#ef4444',
          text: '#ef4444',
        };
      case 'HIGH_RISK':
        return {
          primary: '#f87171', // Red-Orange High Risk
          secondary: '#fca5a5',
          bg: 'rgba(0, 0, 0, 0.95)',
          border: '#f87171',
          text: '#f87171',
        };
      case 'CAUTION':
        return {
          primary: '#f59e0b', // Amber
          secondary: '#fcd34d',
          bg: 'rgba(0, 0, 0, 0.95)',
          border: '#f59e0b',
          text: '#fcd34d',
        };
      case 'NORMAL':
      default:
        return {
          primary: '#22c55e', // Phosphor Radar Green
          secondary: '#86efac',
          bg: 'rgba(0, 0, 0, 0.92)',
          border: '#15803d',
          text: '#4ade80',
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
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          className="animate-spin"
          style={{ animationDuration: '2.5s' }}
        />
      )}

      {/* Target Selection Brackets in Secondary Blue */}
      {isSelected && (
        <g className="selection-brackets pointer-events-none" stroke="#38bdf8" strokeWidth="1.2">
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
          strokeWidth="1"
          strokeOpacity="0.85"
        />
        <line
          x1="-2"
          y1={-speedVectorLength}
          x2="2"
          y2={-speedVectorLength}
          stroke={colors.primary}
          strokeWidth="1"
        />
      </g>

      {/* Precision SSR Radar Target Chevron */}
      <g transform={`rotate(${aircraft.heading})`}>
        <polygon
          points="0,-6 4,4 0,2 -4,4"
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="0.5"
        />
        <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
      </g>

      {/* Full Data Block (FDB) */}
      {showLabels && (
        <g className="full-data-block select-none pointer-events-none">
          {/* 1px J-Hook Leader Line */}
          <polyline
            points={`0,0 ${leaderDx - 4},${leaderDy + 10} ${leaderDx},${leaderDy + 10}`}
            fill="none"
            stroke={isSelected ? '#38bdf8' : colors.border}
            strokeWidth="0.8"
          />

          {/* Minimalist Black Datatag Plate */}
          <g transform={`translate(${leaderDx}, ${leaderDy})`}>
            <rect
              x="0"
              y="0"
              width="88"
              height="30"
              fill={colors.bg}
              stroke={isSelected ? '#38bdf8' : colors.border}
              strokeWidth={isSelected ? '1.2' : '0.8'}
            />

            {/* Line 1: Callsign & FL / Speed */}
            <text
              x="4"
              y="11"
              fill={isSelected ? '#38bdf8' : colors.text}
              fontSize="9"
              fontWeight="700"
              letterSpacing="0.3"
            >
              {aircraft.callsign}
            </text>
            <text
              x="84"
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
              x="4"
              y="22"
              fill="#9ca3af"
              fontSize="8"
            >
              {aircraft.model ?? 'B738'}
            </text>
            <text
              x="46"
              y="22"
              fill="#d1d5db"
              fontSize="8"
              textAnchor="middle"
            >
              {Math.round(aircraft.speed)}K
            </text>
            <text
              x="84"
              y="22"
              fill="#9ca3af"
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
