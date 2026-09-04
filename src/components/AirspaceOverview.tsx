import React from 'react';
import type { Aircraft } from '../types/aircraft';
import type { AirspaceSectorData, AirspaceOverviewSummary, RestrictedZone } from '../types/safety';
import type { CollisionPrediction } from '../types/collision';
import type { WeatherSummary, WeatherZone } from '../types/weather';
import {
  Globe,
  Shield,
  Plane,
  CloudLightning,
  Flame,
  Activity,
  Navigation,
  Compass,
  Radio,
  BarChart2,
  Users,
} from 'lucide-react';

interface AirspaceOverviewProps {
  overview: AirspaceOverviewSummary;
  sectors: AirspaceSectorData[];
  aircraft: Aircraft[];
  conflicts: CollisionPrediction[];
  weatherSummary: WeatherSummary;
  weatherZones: WeatherZone[];
  restrictedZones: RestrictedZone[];
  selectedAircraftId: string | null;
  onSelectAircraft: (ac: Aircraft) => void;
}

export const AirspaceOverview: React.FC<AirspaceOverviewProps> = ({
  overview,
  sectors,
  aircraft,
  conflicts: _conflicts,
  weatherSummary: _weatherSummary,
  weatherZones,
  restrictedZones,
  selectedAircraftId,
  onSelectAircraft,
}) => {
  // Compute fleet telemetry stats
  const totalAircraft = aircraft.length;
  const inConflictCount = aircraft.filter((a) => a.status === 'HIGH_RISK' || a.status === 'CAUTION').length;
  const avgSpeed = totalAircraft > 0 ? Math.round(aircraft.reduce((s, a) => s + a.speed, 0) / totalAircraft) : 0;
  const avgAltitude = totalAircraft > 0 ? Math.round(aircraft.reduce((s, a) => s + a.altitude, 0) / totalAircraft) : 0;

  // Status color helpers
  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    if (score >= 20) return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  const getDensityBadge = (density: string) => {
    switch (density) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MODERATE':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="liquid-glass rounded-3xl p-5 text-slate-300 select-none flex flex-col gap-4 font-sans shadow-2xl h-full overflow-y-auto custom-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-white">
              Airspace Sector & Fleet Overview
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Live National Airspace System (NAS) Telemetry & Density
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle border border-white/10 text-[10px] font-mono text-slate-300">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>RADAR ACTIVE</span>
        </div>
      </div>

      {/* Primary KPI Header Row */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Risk Score */}
        <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="text-[9.5px] uppercase font-mono text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-sky-400" />
            Airspace Risk
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                overview.overallAirspaceRiskScore >= 70
                  ? 'text-rose-400'
                  : overview.overallAirspaceRiskScore >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {overview.overallAirspaceRiskScore}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">/100</span>
          </div>
          <span
            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${getRiskScoreColor(
              overview.overallAirspaceRiskScore
            )}`}
          >
            {overview.overallAirspaceRiskScore >= 70
              ? 'CRITICAL RISK'
              : overview.overallAirspaceRiskScore >= 40
              ? 'ELEVATED RISK'
              : 'NOMINAL SAFE'}
          </span>
        </div>

        {/* Fleet Count */}
        <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="text-[9.5px] uppercase font-mono text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <Plane className="w-3 h-3 text-sky-400" />
            Active Fleet
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {totalAircraft}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">AC</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400">
            {inConflictCount > 0 ? (
              <span className="text-rose-400 font-bold">{inConflictCount} in conflict</span>
            ) : (
              <span className="text-emerald-400">100% nominal separation</span>
            )}
          </span>
        </div>

        {/* Global Traffic Density */}
        <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10 flex flex-col items-center justify-center text-center">
          <div className="text-[9.5px] uppercase font-mono text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-sky-400" />
            Density Rating
          </div>
          <div className="my-0.5">
            <span
              className={`text-xs font-black font-mono uppercase px-2.5 py-1 rounded-xl border ${getDensityBadge(
                overview.trafficDensityRating
              )}`}
            >
              {overview.trafficDensityRating}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-1">
            Avg {avgSpeed} kts • FL{Math.round(avgAltitude / 100)}
          </span>
        </div>
      </div>

      {/* ATC Airspace Sectors Grid (6 Sectors) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
            ATC Airspace Sectors (6 Live Zones)
          </label>
          <span className="text-[9px] font-mono text-slate-500">
            {sectors.length} Sectors Online
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {sectors.map((sec) => (
            <div
              key={sec.id}
              className={`p-2.5 rounded-2xl liquid-glass-subtle border transition-all ${
                sec.riskLevel === 'DANGER'
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : sec.riskLevel === 'HIGH_RISK'
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-black font-mono text-white">
                    {sec.code}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono truncate max-w-[110px]">
                    {sec.name}
                  </span>
                </div>
                <span
                  className={`text-[8.5px] font-mono uppercase px-1.5 py-0.5 rounded-md border ${getDensityBadge(
                    sec.densityLevel
                  )}`}
                >
                  {sec.densityLevel}
                </span>
              </div>

              {/* Sector Telemetry Bar */}
              <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1 text-slate-300">
                  <Plane className="w-2.5 h-2.5 text-sky-400" />
                  <strong className="text-white">{sec.aircraftCount}</strong> AC
                </span>

                {/* Weather & Restriction Indicators */}
                <div className="flex items-center gap-1.5">
                  {sec.weatherStatus !== 'CLEAR' ? (
                    <span className="text-amber-400 flex items-center gap-0.5" title="Hazardous Weather Active">
                      <CloudLightning className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-slate-600">CLR</span>
                  )}

                  {sec.isRestricted && (
                    <span className="text-rose-400 flex items-center gap-0.5" title="Restricted MOA Active">
                      <Flame className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Quick Flight Strips */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          Active Fleet Telemetry & Waypoints ({aircraft.length})
        </label>

        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {aircraft.map((ac) => {
            const isSelected = selectedAircraftId === ac.id;
            const nextWp =
              ac.route && ac.currentWaypointIndex !== undefined && ac.route[ac.currentWaypointIndex]
                ? ac.route[ac.currentWaypointIndex]
                : null;

            return (
              <button
                key={ac.id}
                onClick={() => onSelectAircraft(ac)}
                className={`w-full p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'liquid-glass-active border-sky-400/50 shadow-lg shadow-sky-500/10'
                    : 'liquid-glass-subtle border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-[11px] border ${
                      ac.status === 'HIGH_RISK'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : ac.status === 'CAUTION'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    }`}
                  >
                    {ac.callsign.substring(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        {ac.callsign}
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-400">
                        {ac.model}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-white/5">
                        {ac.origin} → {ac.destination}
                      </span>
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>FL{Math.round(ac.altitude / 100)}</span>
                      <span>•</span>
                      <span>{Math.round(ac.speed)} kts</span>
                      <span>•</span>
                      <span>{Math.round(ac.heading)}°</span>
                      {nextWp && (
                        <>
                          <span>•</span>
                          <span className="text-sky-300 font-semibold flex items-center gap-0.5">
                            <Compass className="w-2.5 h-2.5" />
                            {nextWp.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[8.5px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                      ac.status === 'HIGH_RISK'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : ac.status === 'CAUTION'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {ac.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Environmental & MOA Status Footer */}
      <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between text-[9.5px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <CloudLightning className="w-3.5 h-3.5 text-sky-400" />
          <span>
            Active Storms:{' '}
            <strong className="text-white">
              {weatherZones.filter((w) => w.isActive).length}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>
            MOA Zones: <strong className="text-white">{restrictedZones.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            STCA Rate: <strong className="text-white">60 Hz</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
