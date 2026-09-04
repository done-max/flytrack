import React from 'react';
import type { AircraftStatus, RoutePoint } from '../types/aircraft';

interface FlightTrailProps {
  history: RoutePoint[];
  currentX: number;
  currentY: number;
  status: AircraftStatus;
}

export const FlightTrail: React.FC<FlightTrailProps> = ({
  history,
  status,
}) => {
  if (!history || history.length < 2) return null;

  const getStatusColor = (s: AircraftStatus) => {
    switch (s) {
      case 'CRITICAL':
        return '#ef4444'; // Alert Red
      case 'HIGH_RISK':
        return '#f87171'; // Red-Orange
      case 'CAUTION':
        return '#fbbf24'; // Amber
      case 'NORMAL':
      default:
        return '#38bdf8'; // Ice Cyan
    }
  };

  const trailColor = getStatusColor(status);
  const total = history.length;

  return (
    <g className="atc-history-returns pointer-events-none">
      {/* Primary Radar Phosphor History Dots */}
      {history.map((point, index) => {
        if (index % 4 !== 0 || index === total - 1) return null;
        
        const progress = index / total;
        const opacity = Math.max(0.15, Math.pow(progress, 2) * 0.85);
        const radius = 0.8 + progress * 0.8;

        return (
          <circle
            key={`atc-dot-${index}`}
            cx={point.x}
            cy={point.y}
            r={radius}
            fill={trailColor}
            fillOpacity={opacity}
          />
        );
      })}

      {/* Faint Connecting Track Line */}
      {history.map((point, index) => {
        if (index === 0) return null;
        const prev = history[index - 1];
        const progress = index / total;
        const opacity = Math.max(0.05, progress * 0.3);

        return (
          <line
            key={`atc-trk-${index}`}
            x1={prev.x}
            y1={prev.y}
            x2={point.x}
            y2={point.y}
            stroke={trailColor}
            strokeWidth={0.6}
            strokeOpacity={opacity}
            strokeDasharray="2 2"
          />
        );
      })}
    </g>
  );
};
