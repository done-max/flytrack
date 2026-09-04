import React from 'react';
import type { CollisionPrediction } from '../types/collision';

interface ConflictZoneLayerProps {
  conflicts: CollisionPrediction[];
}

export const ConflictZoneLayer: React.FC<ConflictZoneLayerProps> = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <g className="atc-conflict-zone-layer pointer-events-none font-mono select-none">
      {conflicts.map((conflict, idx) => {
        // Spatial midpoint of the predicted CPA positions for Aircraft A and Aircraft B
        const cpaX = (conflict.cpaPointA.x + conflict.cpaPointB.x) / 2;
        const cpaY = (conflict.cpaPointA.y + conflict.cpaPointB.y) / 2;

        const isCritical = conflict.collisionRisk === 'CRITICAL';
        const isHighRisk = conflict.collisionRisk === 'HIGH_RISK';
        const isCaution = conflict.collisionRisk === 'WARNING';

        // Color theme based on risk severity
        const zoneColor = isCritical
          ? '#ef4444' // Ruby Red
          : isHighRisk
          ? '#f87171' // Red-Orange
          : isCaution
          ? '#fbbf24' // Amber
          : 'rgba(56, 189, 248, 0.4)';

        // Subtle danger region radius based on predicted separation or standard buffer (min 28px)
        const dangerRadius = Math.max(28, Math.min(65, conflict.predictedClosestDistance + 18));

        return (
          <g key={`conflict-${conflict.aircraftA.id}-${conflict.aircraftB.id}-${idx}`}>
            {/* 1. Subtle Frosted Danger Region / Loss of Separation Zone (Requirement 6) */}
            <circle
              cx={cpaX}
              cy={cpaY}
              r={dangerRadius}
              fill={isCritical ? 'rgba(239, 68, 68, 0.12)' : isHighRisk ? 'rgba(248, 113, 113, 0.08)' : 'rgba(251, 191, 36, 0.06)'}
              stroke={zoneColor}
              strokeWidth="1.2"
              strokeDasharray={isCritical ? '4 4' : '3 3'}
              strokeOpacity="0.85"
            />

            {/* Subtle inner pulse for critical conflicts */}
            {isCritical && (
              <circle
                cx={cpaX}
                cy={cpaY}
                r={dangerRadius * 0.55}
                fill="rgba(239, 68, 68, 0.18)"
                stroke={zoneColor}
                strokeWidth="0.8"
                strokeDasharray="2 2"
                className="animate-ping"
                style={{ transformOrigin: `${cpaX}px ${cpaY}px`, animationDuration: '2s' }}
              />
            )}

            {/* 2. Projected Dynamic Vectors from Aircraft to Conflict Point */}
            <line
              x1={conflict.aircraftA.x}
              y1={conflict.aircraftA.y}
              x2={conflict.cpaPointA.x}
              y2={conflict.cpaPointA.y}
              stroke={zoneColor}
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.75"
            />
            <line
              x1={conflict.aircraftB.x}
              y1={conflict.aircraftB.y}
              x2={conflict.cpaPointB.x}
              y2={conflict.cpaPointB.y}
              stroke={zoneColor}
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.75"
            />

            {/* Connecting vector between the two aircraft's CPA locations */}
            <line
              x1={conflict.cpaPointA.x}
              y1={conflict.cpaPointA.y}
              x2={conflict.cpaPointB.x}
              y2={conflict.cpaPointB.y}
              stroke={zoneColor}
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />

            {/* 3. Visual Conflict Hazard Intersection Marker (Requirement 5) */}
            <g transform={`translate(${cpaX}, ${cpaY})`}>
              {/* Diamond Hazard Glyph */}
              <polygon
                points="0,-8 8,0 0,8 -8,0"
                fill={isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(251, 191, 36, 0.25)'}
                stroke={zoneColor}
                strokeWidth="1.5"
              />
              {/* Crosshair inside diamond */}
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#ffffff" strokeWidth="1" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#ffffff" strokeWidth="1" />
            </g>

            {/* 4. Conflict Telemetry Datatag & Time Remaining to CPA (Requirement 7) */}
            <g transform={`translate(${cpaX + 12}, ${cpaY - 26})`}>
              {/* Frosted Glass Datatag Plate */}
              <rect
                x="0"
                y="0"
                width="114"
                height="28"
                rx="6"
                ry="6"
                fill={isCritical ? 'rgba(36, 8, 14, 0.9)' : 'rgba(28, 18, 6, 0.9)'}
                stroke={zoneColor}
                strokeWidth="1"
              />
              {/* Top Specular Line */}
              <line
                x1="4"
                y1="1"
                x2="110"
                y2="1"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="0.8"
              />

              {/* Line 1: Alert Type & Time Remaining to CPA */}
              <text
                x="5"
                y="10"
                fill={zoneColor}
                fontSize="8"
                fontWeight="700"
                letterSpacing="0.3"
              >
                {isCritical ? 'STCA CONFLICT' : 'CONVERGING TRAFFIC'}
              </text>
              <text
                x="109"
                y="10"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="800"
                textAnchor="end"
              >
                T-{conflict.timeToClosestApproach}s
              </text>

              {/* Line 2: Aircraft Pair & CPA Distance */}
              <text
                x="5"
                y="21"
                fill="#cbd5e1"
                fontSize="7.5"
                fontWeight="600"
              >
                {conflict.aircraftA.callsign} ⚡ {conflict.aircraftB.callsign}
              </text>
              <text
                x="109"
                y="21"
                fill="#cbd5e1"
                fontSize="7.5"
                fontWeight="600"
                textAnchor="end"
              >
                {conflict.predictedClosestDistance}PX
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};
