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
    { deg: 0, label: '360°' },
    { deg: 30, label: '030°' },
    { deg: 60, label: '060°' },
    { deg: 90, label: '090°' },
    { deg: 120, label: '120°' },
    { deg: 150, label: '150°' },
    { deg: 180, label: '180°' },
    { deg: 210, label: '210°' },
    { deg: 240, label: '240°' },
    { deg: 270, label: '270°' },
    { deg: 300, label: '300°' },
    { deg: 330, label: '330°' },
  ];

  // Navigation Fixes & VORs with real ICAO naming
  const waypoints = [
    { name: 'KILMA', x: 200, y: 180, type: 'FIX' },
    { name: 'IGN', x: 800, y: 160, type: 'VOR' },
    { name: 'MERIT', x: 500, y: 375, type: 'VOR' }, // Center VOR/DME
    { name: 'LENDY', x: 240, y: 580, type: 'FIX' },
    { name: 'BOSOX', x: 760, y: 590, type: 'FIX' },
    { name: 'SAX', x: 340, y: 375, type: 'VOR' },
    { name: 'VALRE', x: 660, y: 375, type: 'FIX' },
  ];

  // Airway Route Corridors (High Jet Routes & RNAV Q-routes)
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
        {/* Subtle grid pattern */}
        <pattern id="atc-grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M 100 0 L 0 0 0 100"
            fill="none"
            stroke="#0f172a"
            strokeWidth="0.6"
          />
        </pattern>

        {/* Faint radar sweep gradient */}
        <linearGradient id="atc-sweep-beam" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.12)" />
          <stop offset="50%" stopColor="rgba(56, 189, 248, 0.02)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Scope Background Grid */}
      {showSectorGrid && (
        <>
          <rect width={width} height={height} fill="url(#atc-grid)" />

          {/* Sector airway routes */}
          <g className="airways" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3">
            {airways.map((aw) => (
              <g key={aw.id}>
                <line x1={aw.x1} y1={aw.y1} x2={aw.x2} y2={aw.y2} />
                <text
                  x={(aw.x1 + aw.x2) / 2 + 10}
                  y={(aw.y1 + aw.y2) / 2 - 4}
                  fill="#334155"
                  fontSize="8"
                  letterSpacing="0.5"
                >
                  {aw.id}
                </text>
              </g>
            ))}
          </g>

          {/* Centerline Crosshairs */}
          <line
            x1={0}
            y1={centerY}
            x2={width}
            y2={centerY}
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          <line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={height}
            stroke="#1e293b"
            strokeWidth="0.8"
          />
        </>
      )}

      {/* Range Rings & Range Mileage Indicators */}
      {showRangeRings && (
        <g className="range-rings">
          {rangeRings.map((ring, idx) => (
            <g key={idx}>
              <circle
                cx={centerX}
                cy={centerY}
                r={ring.radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.8"
              />
              <text
                x={centerX + ring.radius - 3}
                y={centerY - 4}
                fill="#475569"
                fontSize="9"
                textAnchor="end"
              >
                {ring.label}
              </text>
            </g>
          ))}

          {/* Outer 100 NM Scope Limit Ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={400}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Precision Azimuth Compass Rose */}
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
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={xText}
                  y={yText}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {az.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Navigation Fixes & VORs */}
      <g className="navigation-fixes">
        {waypoints.map((wp) => (
          <g key={wp.name} transform={`translate(${wp.x}, ${wp.y})`}>
            {wp.type === 'VOR' ? (
              // Standard VOR Hexagon symbol
              <polygon
                points="0,-5 4.3,-2.5 4.3,2.5 0,5 -4.3,2.5 -4.3,-2.5"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1"
              />
            ) : (
              // Standard Aeronautical Fix Triangle
              <polygon
                points="0,-4 4,3 -4,3"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1"
              />
            )}
            <circle cx="0" cy="0" r="1" fill="#38bdf8" />
            <text
              x="7"
              y="3"
              fill="#64748b"
              fontSize="8.5"
              fontWeight="600"
              letterSpacing="0.5"
            >
              {wp.name}
            </text>
          </g>
        ))}
      </g>

      {/* Authentic Faint Radar Sweep Trace */}
      {showRadarSweep && (
        <g
          className="radar-sweep-beam"
          style={{
            transformOrigin: `${centerX}px ${centerY}px`,
          }}
        >
          <path
            d={`M ${centerX} ${centerY} L ${centerX} ${centerY - 400} A 400 400 0 0 1 ${
              centerX + 400 * Math.sin(Math.PI / 8)
            } ${centerY - 400 * Math.cos(Math.PI / 8)} Z`}
            fill="url(#atc-sweep-beam)"
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - 400}
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth="1"
          />
        </g>
      )}

      {/* Airspace Boundary & Lat/Long Reference Grid */}
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        fill="none"
        stroke="#1e293b"
        strokeWidth="1"
      />
      <text x={8} y={15} fill="#475569" fontSize="8.5">
        FIR SECTOR 04 [N42°30' W071°30']
      </text>
      <text x={width - 8} y={15} fill="#475569" fontSize="8.5" textAnchor="end">
        RANGE: 100 NM | RADAR: PR/SSR
      </text>
      <text x={8} y={height - 8} fill="#475569" fontSize="8.5">
        QNH: 1013.25 HPA (29.92 INHG)
      </text>
      <text x={width - 8} y={height - 8} fill="#475569" fontSize="8.5" textAnchor="end">
        FL BASE: FL180 | CEILING: FL450
      </text>
    </g>
  );
};
