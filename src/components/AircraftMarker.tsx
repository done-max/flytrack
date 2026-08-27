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
  // Professional ATC Status Color Palette
  const getStatusColor = (s: AircraftStatus) => {
    switch (s) {
      case 'CRITICAL':
        return {
          primary: '#ef4444', // Red (Short-Term Conflict Alert - STCA)
          secondary: '#f87171',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '#ef4444',
          text: '#fca5a5',
        };
      case 'HIGH_RISK':
        return {
          primary: '#f97316', // Orange
          secondary: '#fb923c',
          bg: 'rgba(249, 115, 22, 0.12)',
          border: '#f97316',
          text: '#fdba74',
        };
      case 'CAUTION':
        return {
          primary: '#f59e0b', // Amber
          secondary: '#fbbf24',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: '#f59e0b',
          text: '#fcd34d',
        };
      case 'NORMAL':
      default:
        return {
          primary: '#38bdf8', // Tactical Radar Cyan / Emerald
          secondary: '#7dd3fc',
          bg: 'rgba(15, 23, 42, 0.85)',
          border: '#0284c7',
          text: '#e2e8f0',
        };
    }
  };

  const colors = getStatusColor(aircraft.status);

  // Flight Level & Vertical Trend Symbol (Standard ICAO notation)
  const flightLevel = Math.round(aircraft.altitude / 100);
  const formattedFL = String(flightLevel).padStart(3, '0');
  const altDiff = (aircraft.targetAltitude ?? aircraft.altitude) - aircraft.altitude;
  const trendChar = altDiff > 100 ? '↑' : altDiff < -100 ? '↓' : '=';

  // 1-minute velocity vector leader length (pixels)
  const speedVectorLength = Math.max(14, (aircraft.speed / 60) * 3);

  // Leader line offset to Full Data Block (FDB)
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
      {/* Critical STCA Alert Ring */}
      {aircraft.status === 'CRITICAL' && (
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.2"
          strokeDasharray="2 2"
          className="animate-spin"
          style={{ animationDuration: '3s' }}
        />
      )}

      {/* Target Selection Brackets */}
      {isSelected && (
        <g className="selection-brackets pointer-events-none" stroke="#38bdf8" strokeWidth="1">
          <path d="M -10,-6 L -10,-10 L -6,-10" fill="none" />
          <path d="M 10,-6 L 10,-10 L 6,-10" fill="none" />
          <path d="M -10,6 L -10,10 L -6,10" fill="none" />
          <path d="M 10,6 L 10,10 L 6,10" fill="none" />
        </g>
      )}

      {/* Speed Vector Leader Line (1-min velocity heading vector) */}
      <g transform={`rotate(${aircraft.heading})`}>
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={-speedVectorLength}
          stroke={colors.primary}
          strokeWidth="1"
          strokeOpacity="0.8"
        />
        {/* Speed tick at end of 1-minute vector */}
        <line
          x1="-2"
          y1={-speedVectorLength}
          x2="2"
          y2={-speedVectorLength}
          stroke={colors.primary}
          strokeWidth="1"
        />
      </g>

      {/* Precision SSR Radar Target Blip */}
      <g transform={`rotate(${aircraft.heading})`}>
        {/* Crisp vector target chevron */}
        <polygon
          points="0,-6 4,4 0,2 -4,4"
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="0.5"
        />
        <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
      </g>

      {/* Full Data Block (FDB) - Standard ATC 2-Line Datatag */}
      {showLabels && (
        <g className="full-data-block select-none pointer-events-none">
          {/* 1px J-Hook Leader Line */}
          <polyline
            points={`0,0 ${leaderDx - 4},${leaderDy + 10} ${leaderDx},${leaderDy + 10}`}
            fill="none"
            stroke={isSelected ? '#38bdf8' : '#475569'}
            strokeWidth="0.8"
          />

          {/* Minimalist Datatag Matrix */}
          <g transform={`translate(${leaderDx}, ${leaderDy})`}>
            {/* Dark background tag plate */}
            <rect
              x="0"
              y="0"
              width="88"
              height="30"
              fill={isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(8, 12, 20, 0.88)'}
              stroke={isSelected ? '#38bdf8' : colors.border}
              strokeWidth={isSelected ? '1' : '0.6'}
            />

            {/* Line 1: Callsign & FL / Trend / Speed */}
            <text
              x="4"
              y="11"
              fill={aircraft.status === 'CRITICAL' ? '#ef4444' : isSelected ? '#ffffff' : colors.secondary}
              fontSize="9"
              fontWeight="700"
              letterSpacing="0.3"
            >
              {aircraft.callsign}
            </text>
            <text
              x="84"
              y="11"
              fill="#e2e8f0"
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
              fill="#94a3b8"
              fontSize="8"
            >
              {aircraft.model ?? 'B738'}
            </text>
            <text
              x="46"
              y="22"
              fill="#cbd5e1"
              fontSize="8"
              textAnchor="middle"
            >
              {Math.round(aircraft.speed)}K
            </text>
            <text
              x="84"
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
