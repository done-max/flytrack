import React from 'react';
import type { AircraftStatus, TrajectoryPoint } from '../types/aircraft';

interface TrajectoryLineProps {
  currentX: number;
  currentY: number;
  trajectory: TrajectoryPoint[];
  status: AircraftStatus;
  isSelected?: boolean;
}

export const TrajectoryLine: React.FC<TrajectoryLineProps> = ({
  currentX,
  currentY,
  trajectory,
  status,
  isSelected,
}) => {
  if (!trajectory || trajectory.length === 0) return null;

  const getStatusColor = (s: AircraftStatus) => {
    switch (s) {
      case 'CRITICAL':
        return '#ef4444';
      case 'HIGH_RISK':
        return '#f97316';
      case 'CAUTION':
        return '#f59e0b';
      case 'NORMAL':
      default:
        return '#0284c7'; // Deep Sky / Cyan
    }
  };

  const strokeColor = getStatusColor(status);
  const endPoint = trajectory[trajectory.length - 1];

  return (
    <g className="atc-predicted-trajectory pointer-events-none font-mono">
      {/* Dashed trajectory projection vector */}
      <line
        x1={currentX}
        y1={currentY}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke={strokeColor}
        strokeWidth={isSelected ? 1.2 : 0.8}
        strokeDasharray="3 3"
        strokeOpacity={isSelected ? 0.9 : 0.55}
      />

      {/* Discrete time prediction ticks (+30s, +60s) */}
      {trajectory.map((point) => (
        <g key={`traj-tick-${point.timeOffsetSeconds}`} transform={`translate(${point.x}, ${point.y})`}>
          {/* Subtle perpendicular tick mark */}
          <line
            x1="-2.5"
            y1="0"
            x2="2.5"
            y2="0"
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />
          <line
            x1="0"
            y1="-2.5"
            x2="0"
            y2="2.5"
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />

          {/* Time tag for selected or 30s intervals */}
          {(isSelected || point.timeOffsetSeconds % 30 === 0) && (
            <text
              x="4"
              y="-3"
              fill={strokeColor}
              fontSize="7.5"
              fillOpacity={isSelected ? 0.9 : 0.65}
              fontWeight="600"
            >
              +{point.timeOffsetSeconds}s
            </text>
          )}
        </g>
      ))}

      {/* Terminal lookahead point */}
      <circle
        cx={endPoint.x}
        cy={endPoint.y}
        r={isSelected ? 3 : 2}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        strokeOpacity="0.8"
      />
    </g>
  );
};
