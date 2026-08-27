import React from 'react';

interface RadarGridProps {
  width: number;
  height: number;
  showRangeRings: boolean;
  showSectorGrid: boolean;
  showRadarSweep: boolean;
}

export const RadarGrid: React.FC<RadarGridProps> = ({
  width,
  height,
  showRangeRings,
  showSectorGrid,
  showRadarSweep,
}) => {
  const centerX = width / 2;
  const centerY = height / 2;

  // Concentric Radar Range Rings (Nautical Miles)
  const rangeRings = [
    { radius: 80, label: '20 NM' },
    { radius: 160, label: '40 NM' },
    { radius: 240, label: '60 NM' },
    { radius: 320, label: '80 NM' },
    { radius: 400, label: '100 NM' },
  ];

  // Compass Rose Azimuths
  const azimuths = [
    { deg: 0, label: '360° N' },
    { deg: 30, label: '030°' },
    { deg: 60, label: '060°' },
    { deg: 90, label: '090° E' },
    { deg: 120, label: '120°' },
    { deg: 150, label: '150°' },
    { deg: 180, label: '180° S' },
    { deg: 210, label: '210°' },
    { deg: 240, label: '240°' },
    { deg: 270, label: '270° W' },
    { deg: 300, label: '300°' },
    { deg: 330, label: '330°' },
  ];

  // Navigation Fixes & VORs (Secondary Blue & Green)
  const waypoints = [
    { name: 'KILMA', x: 200, y: 180, type: 'FIX' },
    { name: 'IGN', x: 800, y: 160, type: 'VOR' },
    { name: 'MERIT', x: 500, y: 375, type: 'VOR' },
    { name: 'LENDY', x: 240, y: 580, type: 'FIX' },
    { name: 'BOSOX', x: 760, y: 590, type: 'FIX' },
    { name: 'SAX', x: 340, y: 375, type: 'VOR' },
    { name: 'VALRE', x: 660, y: 375, type: 'FIX' },
  ];

  // Jet Airway Corridors
  const airways = [
    { id: 'J48', x1: 50, y1: 180, x2: 950, y2: 180 },
    { id: 'Q102', x1: 50, y1: 375, x2: 950, y2: 375 },
    { id: 'J70', x1: 50, y1: 580, x2: 950, y2: 580 },
    { id: 'V16', x1: 200, y1: 50, x2: 240, y2: 700 },
    { id: 'J6', x1: 500, y1: 50, x2: 500, y2: 700 },
    { id: 'V34', x1: 800, y1: 50, x2: 760, y2: 700 },
    { id: 'Q436', x1: 150, y1: 650, x2: 850, y2: 150 },
    { id: 'J121', x1: 150, y1: 150, x2: 850, y2: 650 },
  ];

  return (
    <g className="radar-scope-grid select-none pointer-events-none font-mono">
      <defs>
        {/* Phosphor Green Radar Grid Pattern */}
        <pattern id="atc-grid-green" width="100" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M 100 0 L 0 0 0 100"
            fill="none"
            stroke="rgba(34, 197, 94, 0.08)"
            strokeWidth="0.6"
          />
        </pattern>

        {/* Phosphor Green Radar Sweep Gradient */}
        <linearGradient id="atc-sweep-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(34, 197, 94, 0.22)" />
          <stop offset="50%" stopColor="rgba(34, 197, 94, 0.04)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Scope Background Grid */}
      {showSectorGrid && (
        <>
          <rect width={width} height={height} fill="url(#atc-grid-green)" />

          {/* Airway routes in phosphor green */}
          <g className="airways" stroke="rgba(34, 197, 94, 0.16)" strokeWidth="0.8" strokeDasharray="3 3">
            {airways.map((aw) => (
              <g key={aw.id}>
                <line x1={aw.x1} y1={aw.y1} x2={aw.x2} y2={aw.y2} />
                <text
                  x={(aw.x1 + aw.x2) / 2 + 8}
                  y={(aw.y1 + aw.y2) / 2 - 4}
                  fill="rgba(34, 197, 94, 0.4)"
                  fontSize="8"
                  letterSpacing="0.5"
                >
                  {aw.id}
                </text>
              </g>
            ))}
          </g>

          {/* Center Crosshairs */}
          <line
            x1={0}
            y1={centerY}
            x2={width}
            y2={centerY}
            stroke="rgba(34, 197, 94, 0.2)"
            strokeWidth="0.8"
          />
          <line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={height}
            stroke="rgba(34, 197, 94, 0.2)"
            strokeWidth="0.8"
          />
        </>
      )}

      {/* Radar Green Range Rings & Mileage Indicators */}
      {showRangeRings && (
        <g className="range-rings">
          {rangeRings.map((ring, idx) => (
            <g key={idx}>
              <circle
                cx={centerX}
                cy={centerY}
                r={ring.radius}
                fill="none"
                stroke="rgba(34, 197, 94, 0.22)"
                strokeWidth="0.8"
                strokeDasharray="2 4"
              />
              <text
                x={centerX + ring.radius - 3}
                y={centerY - 4}
                fill="rgba(34, 197, 94, 0.55)"
                fontSize="9"
                textAnchor="end"
                fontWeight="600"
              >
                {ring.label}
              </text>
            </g>
          ))}

          {/* Outer 100 NM Scope Limit Ring in Radar Green */}
          <circle
            cx={centerX}
            cy={centerY}
            r={400}
            fill="none"
            stroke="rgba(34, 197, 94, 0.45)"
            strokeWidth="1.2"
          />

          {/* Compass Rose Azimuth Ticks in Radar Green */}
          {azimuths.map((az) => {
            const rad = ((az.deg - 90) * Math.PI) / 180;
            const rOuter = 400;
            const rInner = 392;
            const rLabel = 414;

            const x1 = centerX + rInner * Math.cos(rad);
            const y1 = centerY + rInner * Math.sin(rad);
            const x2 = centerX + rOuter * Math.cos(rad);
            const y2 = centerY + rOuter * Math.sin(rad);
            const xText = centerX + rLabel * Math.cos(rad);
            const yText = centerY + rLabel * Math.sin(rad) + 3;

            return (
              <g key={az.deg}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(34, 197, 94, 0.6)"
                  strokeWidth="1"
                />
                <text
                  x={xText}
                  y={yText}
                  fill="rgba(74, 222, 128, 0.8)"
                  fontSize="9"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {az.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Navigation Fixes & VORs in Secondary Blue */}
      <g className="navigation-fixes">
        {waypoints.map((wp) => (
          <g key={wp.name} transform={`translate(${wp.x}, ${wp.y})`}>
            {wp.type === 'VOR' ? (
              <polygon
                points="0,-5 4.3,-2.5 4.3,2.5 0,5 -4.3,2.5 -4.3,-2.5"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
              />
            ) : (
              <polygon
                points="0,-4 4,3 -4,3"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
              />
            )}
            <circle cx="0" cy="0" r="1.2" fill="#60a5fa" />
            <text
              x="7"
              y="3"
              fill="rgba(56, 189, 248, 0.75)"
              fontSize="8.5"
              fontWeight="600"
              letterSpacing="0.5"
            >
              {wp.name}
            </text>
          </g>
        ))}
      </g>

      {/* Phosphor Green Radar Sweep Beam */}
      {showRadarSweep && (
        <g
          className="radar-sweep-beam"
          style={{
            transformOrigin: `${centerX}px ${centerY}px`,
          }}
        >
          <path
            d={`M ${centerX} ${centerY} L ${centerX} ${centerY - 400} A 400 400 0 0 1 ${
              centerX + 400 * Math.sin(Math.PI / 7)
            } ${centerY - 400 * Math.cos(Math.PI / 7)} Z`}
            fill="url(#atc-sweep-green)"
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - 400}
            stroke="rgba(74, 222, 128, 0.6)"
            strokeWidth="1.2"
          />
        </g>
      )}

      {/* Scope Outer Frame in Radar Green & Black */}
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        fill="none"
        stroke="rgba(34, 197, 94, 0.3)"
        strokeWidth="1"
      />
      <text x={8} y={15} fill="rgba(34, 197, 94, 0.6)" fontSize="8.5">
        FIR SECTOR 04 [N42°30' W071°30']
      </text>
      <text x={width - 8} y={15} fill="rgba(34, 197, 94, 0.6)" fontSize="8.5" textAnchor="end">
        RADAR: PR/SSR | POLARIZATION: VERT
      </text>
      <text x={8} y={height - 8} fill="rgba(34, 197, 94, 0.6)" fontSize="8.5">
        QNH: 1013.25 HPA | FL180-FL450
      </text>
      <text x={width - 8} y={height - 8} fill="rgba(34, 197, 94, 0.6)" fontSize="8.5" textAnchor="end">
        SWEEP: 4.8s | BEARING: MAG
      </text>
    </g>
  );
};
