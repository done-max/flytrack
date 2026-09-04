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

  const getStatusColor = (s: AircraftStatus, selected?: boolean) => {
    if (selected) return '#38bdf8'; // Luminous Ice Blue when selected
    switch (s) {
      case 'CRITICAL':
        return '#ef4444'; // Red
      case 'HIGH_RISK':
        return '#f87171'; // Red-Orange
      case 'CAUTION':
        return '#fbbf24'; // Amber
      case 'NORMAL':
      default:
        return 'rgba(56, 189, 248, 0.75)'; // Soft Ice Cyan
    }
  };

  const strokeColor = getStatusColor(status, isSelected);
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
        strokeWidth={isSelected ? 1.4 : 0.8}
        strokeDasharray="3 3"
        strokeOpacity={isSelected ? 0.95 : 0.65}
      />

      {/* Discrete time prediction ticks (+30s, +60s) */}
      {trajectory.map((point) => (
        <g key={`traj-tick-${point.timeOffsetSeconds}`} transform={`translate(${point.x}, ${point.y})`}>
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

          {(isSelected || point.timeOffsetSeconds % 30 === 0) && (
            <text
              x="4"
              y="-3"
              fill={strokeColor}
              fontSize="7.5"
              fillOpacity={isSelected ? 0.95 : 0.75}
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
        r={isSelected ? 3.5 : 2}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.2}
        strokeOpacity={0.9}
      />
    </g>
  );
};
