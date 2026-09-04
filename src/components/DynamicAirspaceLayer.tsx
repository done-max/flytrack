import React from 'react';
import type { DynamicAirspaceSector, RestrictedZone } from '../types/safety';

interface DynamicAirspaceLayerProps {
  sectors: DynamicAirspaceSector[];
  restrictedZones: RestrictedZone[];
  visible: boolean;
}

export const DynamicAirspaceLayer: React.FC<DynamicAirspaceLayerProps> = ({
  sectors,
  restrictedZones,
  visible,
}) => {
  if (!visible) return null;

  return (
    <g className="dynamic-airspace-layer pointer-events-none opacity-45">
      {/* Dynamic Grid Sectors */}
      {sectors.map((sector) => {
        let fillColor = 'rgba(56, 189, 248, 0.04)'; // SAFE default subtle cyan/green
        let strokeColor = 'rgba(255, 255, 255, 0.05)';

        if (sector.status === 'DANGER') {
          fillColor = 'rgba(239, 68, 68, 0.25)'; // RED
          strokeColor = 'rgba(239, 68, 68, 0.4)';
        } else if (sector.status === 'HIGH_RISK') {
          fillColor = 'rgba(249, 115, 22, 0.18)'; // ORANGE
          strokeColor = 'rgba(249, 115, 22, 0.35)';
        } else if (sector.status === 'CAUTION') {
          fillColor = 'rgba(234, 179, 8, 0.12)'; // YELLOW
          strokeColor = 'rgba(234, 179, 8, 0.25)';
        } else if (sector.status === 'RESTRICTED') {
          fillColor = 'rgba(100, 116, 139, 0.25)'; // GREY/BLACK
          strokeColor = 'rgba(148, 163, 184, 0.4)';
        } else if (sector.status === 'SAFE') {
          fillColor = 'rgba(34, 197, 94, 0.06)'; // GREEN
          strokeColor = 'rgba(34, 197, 94, 0.15)';
        }

        return (
          <rect
            key={sector.id}
            x={sector.x}
            y={sector.y}
            width={sector.width}
            height={sector.height}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="0.8"
            className="transition-colors duration-500"
          />
        );
      })}

      {/* Restricted Special Use Airspace / MOA Boundaries */}
      {restrictedZones.map((rz) => (
        <g key={rz.id}>
          <circle
            cx={rz.center.x}
            cy={rz.center.y}
            r={rz.radius}
            fill="rgba(15, 23, 42, 0.5)"
            stroke="rgba(148, 163, 184, 0.7)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <foreignObject
            x={rz.center.x - 70}
            y={rz.center.y - 12}
            width={140}
            height={30}
            className="overflow-visible"
          >
            <div className="bg-slate-900/80 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-600 text-center font-bold tracking-wider">
              {rz.name.slice(0, 20)}
            </div>
          </foreignObject>
        </g>
      ))}
    </g>
  );
};
