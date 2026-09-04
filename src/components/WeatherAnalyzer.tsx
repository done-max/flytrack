import React, { useState } from 'react';
import type { WeatherSummary, WeatherZone } from '../types/weather';
import type { Aircraft } from '../types/aircraft';
import {
  CloudLightning,
  CloudRain,
  EyeOff,
  Wind,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Power,
  Layers,
} from 'lucide-react';

interface WeatherAnalyzerProps {
  weatherSummary: WeatherSummary;
  weatherZones: WeatherZone[];
  aircraftList: Aircraft[];
  onToggleZone: (zoneId: string, isActive?: boolean) => void;
  onSelectAircraft: (aircraft: Aircraft) => void;
}

export const WeatherAnalyzer: React.FC<WeatherAnalyzerProps> = ({
  weatherSummary,
  weatherZones,
  aircraftList,
  onToggleZone,
  onSelectAircraft,
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    weatherZones.length > 0 ? weatherZones[0].id : null
  );

  const {
    totalZones,
    activeZones,
    stormCount,
    highRiskZonesCount,
    affectedAircraftCount,
    highestWeatherRisk,
    zoneInteractions,
  } = weatherSummary;

  const selectedZone = weatherZones.find((z) => z.id === selectedZoneId) || null;
  const interactionsForSelected = selectedZone
    ? zoneInteractions.filter((i) => i.weatherZoneId === selectedZone.id)
    : [];

  return (
    <div className="liquid-glass rounded-3xl p-4 text-slate-200 select-none font-sans text-xs flex flex-col gap-3.5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              highestWeatherRisk === 'CRITICAL'
                ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-ping'
                : highestWeatherRisk === 'HIGH'
                ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                : highestWeatherRisk === 'MODERATE'
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : highestWeatherRisk === 'LOW'
                ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
            }`}
          />
          <h2 className="text-xs font-bold tracking-wider uppercase text-white">
            Weather Analyzer
          </h2>
        </div>

        <span
          className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1 ${
            highestWeatherRisk === 'CRITICAL'
              ? 'bg-red-500/30 text-red-200 border-red-400/60 animate-pulse'
              : highestWeatherRisk === 'HIGH'
              ? 'bg-orange-500/30 text-orange-200 border-orange-400/50'
              : highestWeatherRisk === 'MODERATE'
              ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
              : 'bg-sky-500/20 text-sky-200 border-sky-400/40'
          }`}
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          {highestWeatherRisk} HAZARD
        </span>
      </div>

      {/* Sector Weather Metrics (4-Card Telemetry Grid) */}
      <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
        <div className="liquid-glass-subtle p-2 rounded-xl border border-white/10 text-center">
          <span className="text-slate-400 block text-[9px]">ACTIVE</span>
          <span className="text-white font-bold text-xs">
            {activeZones}/{totalZones}
          </span>
        </div>

        <div className="liquid-glass-subtle p-2 rounded-xl border border-white/10 text-center">
          <span className="text-slate-400 block text-[9px]">STORMS</span>
          <span className={`font-bold text-xs ${stormCount > 0 ? 'text-red-400' : 'text-white'}`}>
            {stormCount}
          </span>
        </div>

        <div className="liquid-glass-subtle p-2 rounded-xl border border-white/10 text-center">
          <span className="text-slate-400 block text-[9px]">HIGH RISK</span>
          <span className={`font-bold text-xs ${highRiskZonesCount > 0 ? 'text-amber-400' : 'text-white'}`}>
            {highRiskZonesCount}
          </span>
        </div>

        <div className="liquid-glass-subtle p-2 rounded-xl border border-white/10 text-center">
          <span className="text-slate-400 block text-[9px]">AFFECTED</span>
          <span className={`font-bold text-xs ${affectedAircraftCount > 0 ? 'text-red-300' : 'text-sky-300'}`}>
            {affectedAircraftCount} AC
          </span>
        </div>
      </div>

      {/* Active Weather Warnings Banner Feed */}
      {zoneInteractions.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-0.5">
          {zoneInteractions.map((inter, idx) => {
            const isCritical = inter.weatherRisk === 'CRITICAL';
            const isHigh = inter.weatherRisk === 'HIGH';
            const targetAc = aircraftList.find((ac) => ac.id === inter.aircraftId);

            return (
              <div
                key={`${inter.aircraftId}-${inter.weatherZoneId}-${idx}`}
                className={`p-2.5 rounded-2xl border transition-all duration-150 ${
                  isCritical
                    ? 'liquid-glass-red border-red-500/40 shadow-sm'
                    : isHigh
                    ? 'liquid-glass-amber border-amber-500/30 shadow-sm'
                    : 'liquid-glass-subtle border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <button
                    onClick={() => targetAc && onSelectAircraft(targetAc)}
                    className="hover:underline hover:text-sky-300 transition-colors text-white cursor-pointer"
                  >
                    {inter.aircraftCallsign} ⚡ {inter.zoneName}
                  </button>

                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isCritical
                        ? 'bg-red-500/30 text-red-200'
                        : isHigh
                        ? 'bg-orange-500/30 text-orange-200'
                        : 'bg-amber-500/20 text-amber-200'
                    }`}
                  >
                    {inter.weatherRisk}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    {inter.currentExposure ? (
                      <strong className="text-red-300 animate-pulse">INSIDE DANGER ZONE</strong>
                    ) : (
                      <span>
                        Entry in <strong className="text-red-300">{inter.timeToEntry}s</strong> ({inter.distanceToZone}px)
                      </span>
                    )}
                  </span>
                  <span>{inter.zoneType}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weather Zones Interactive List */}
      <div className="border-t border-white/10 pt-2 flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between font-mono">
          <span>Configured Weather Cells</span>
          <span className="text-slate-500 text-[9px]">{weatherZones.length} Zones</span>
        </label>

        {weatherZones.length === 0 ? (
          <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10 text-center text-slate-400 font-mono text-[10.5px]">
            <CheckCircle2 className="w-4 h-4 text-sky-400 mx-auto mb-1" />
            Clear sector atmospheric profile. Zero hazard zones active.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-0.5">
            {weatherZones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const isStorm = zone.type === 'THUNDERSTORM' || zone.type === 'STORM';

              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'liquid-glass-active text-white border-white/40 shadow-md'
                      : 'liquid-glass-subtle text-slate-300 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      {isStorm ? (
                        <CloudLightning className="w-3.5 h-3.5 text-red-400" />
                      ) : zone.type === 'LOW_VISIBILITY' ? (
                        <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                      ) : (
                        <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                      )}
                      <span>{zone.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                          zone.severity === 'CRITICAL'
                            ? 'bg-red-500/30 text-red-200'
                            : zone.severity === 'HIGH'
                            ? 'bg-orange-500/30 text-orange-200'
                            : zone.severity === 'MODERATE'
                            ? 'bg-amber-500/20 text-amber-200'
                            : 'bg-sky-500/20 text-sky-200'
                        }`}
                      >
                        {zone.severity}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleZone(zone.id);
                        }}
                        title={zone.isActive ? 'Deactivate Weather Zone' : 'Activate Weather Zone'}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          zone.isActive
                            ? 'text-sky-400 hover:text-white bg-sky-500/20'
                            : 'text-slate-500 hover:text-slate-300 bg-white/5'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-slate-400" />
                      {zone.windSpeed} km/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      {zone.visibility} km
                    </span>
                    <span className="flex items-center gap-1 text-right justify-end">
                      <Layers className="w-3 h-3 text-slate-400" />
                      FL{Math.round(zone.maxAltitudeFt / 100)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Weather Zone Telemetry Inspector */}
      {selectedZone && (
        <div className="border-t border-white/10 pt-2">
          <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {selectedZone.name} Inspector
              </span>
              <span className="text-[10px] font-mono text-sky-400">
                Radius: {selectedZone.radius} px
              </span>
            </div>

            <p className="text-[10.5px] text-slate-300 font-sans leading-snug">
              {selectedZone.description || 'Convective atmospheric hazard region.'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono text-slate-300 pt-1 border-t border-white/5">
              <div className="bg-black/20 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[8.5px]">ALTITUDE SPAN</span>
                <strong>
                  FL{Math.round(selectedZone.minAltitudeFt / 100)} — FL{Math.round(selectedZone.maxAltitudeFt / 100)}
                </strong>
              </div>
              <div className="bg-black/20 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[8.5px]">AFFECTED TARGETS</span>
                <strong className={interactionsForSelected.length > 0 ? 'text-red-300' : 'text-sky-300'}>
                  {interactionsForSelected.length} Aircraft
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
