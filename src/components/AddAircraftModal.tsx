import React, { useState } from 'react';
import type { Aircraft } from '../types/aircraft';
import { createAircraft } from '../simulation/aircraft';
import { X, PlusCircle } from 'lucide-react';

interface AddAircraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAircraft: (aircraft: Aircraft) => void;
}

export const AddAircraftModal: React.FC<AddAircraftModalProps> = ({
  isOpen,
  onClose,
  onAddAircraft,
}) => {
  const [callsign, setCallsign] = useState('SKY ' + Math.floor(100 + Math.random() * 899));
  const [model, setModel] = useState('B787-9');
  const [x, setX] = useState(160);
  const [y, setY] = useState(360);
  const [altitude, setAltitude] = useState(33000);
  const [speed, setSpeed] = useState(520);
  const [heading, setHeading] = useState(85);
  const [origin, setOrigin] = useState('BOS');
  const [destination, setDestination] = useState('SFO');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAircraft = createAircraft({
      id: `AC_${Date.now()}`,
      callsign: callsign.trim().toUpperCase(),
      model,
      x: Number(x),
      y: Number(y),
      altitude: Number(altitude),
      speed: Number(speed),
      heading: Number(heading),
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      status: 'NORMAL',
    });

    onAddAircraft(newAircraft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl p-4 font-sans select-none animate-fade-in">
      <div className="liquid-glass rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-200 text-xs border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Inject SSR Radar Target
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 mb-1 block text-[10px] font-mono">CALLSIGN</label>
              <input
                type="text"
                required
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="w-full liquid-glass-subtle rounded-2xl px-3 py-2 text-white font-mono font-bold uppercase outline-none focus:border-white/40 transition-colors border border-white/10"
              />
            </div>
            <div>
              <label className="text-slate-400 mb-1 block text-[10px] font-mono">ICAO TYPE</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full liquid-glass-subtle rounded-2xl px-3 py-2 text-slate-200 outline-none focus:border-white/40 transition-colors border border-white/10"
              >
                <option value="B787-9">B787-9 (Heavy)</option>
                <option value="A350-900">A350-900 (Heavy)</option>
                <option value="B777-300ER">B777-300ER (Heavy)</option>
                <option value="A321neo">A321neo (Medium)</option>
                <option value="B737-800">B737-800 (Medium)</option>
                <option value="A380-800">A380-800 (Super)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 mb-1 block text-[10px] font-mono">ORIGIN (ICAO/IATA)</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                maxLength={4}
                className="w-full liquid-glass-subtle rounded-2xl px-3 py-2 text-sky-300 font-mono font-bold uppercase outline-none focus:border-sky-400 transition-colors border border-white/10"
              />
            </div>
            <div>
              <label className="text-slate-400 mb-1 block text-[10px] font-mono">DESTINATION (ICAO/IATA)</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                maxLength={4}
                className="w-full liquid-glass-subtle rounded-2xl px-3 py-2 text-sky-300 font-mono font-bold uppercase outline-none focus:border-sky-400 transition-colors border border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 mb-1 block text-[10px] font-mono">INITIAL X [0-1000]</label>
              <input
                type="number"
                min="20"
                max="980"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                className="w-full liquid-glass-subtle rounded-2xl px-3 py-2 text-white font-mono outline-none focus:border-white/40 transition-colors border border-white/10"
              />
            </div>
            <div>
              <label className="text-slate-400 mb-1 block text-[10px] font-mono">INITIAL Y [0-750]</label>
              <input
                type="number"
                min="20"
                max="730"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
                className="w-full liquid-glass-subtle rounded-2xl px-3 py-2 text-white font-mono outline-none focus:border-white/40 transition-colors border border-white/10"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="liquid-glass-subtle p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-slate-300 font-medium">Heading (Track)</span>
              <span className="text-white font-mono font-bold">{heading}° MAG</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={heading}
              onChange={(e) => setHeading(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Speed */}
          <div className="liquid-glass-subtle p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-slate-300 font-medium">Ground Speed</span>
              <span className="text-white font-mono font-bold">{speed} KTS</span>
            </div>
            <input
              type="range"
              min="250"
              max="850"
              step="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Altitude */}
          <div className="liquid-glass-subtle p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-slate-300 font-medium">Cleared Flight Level</span>
              <span className="text-white font-mono font-bold">
                FL{Math.round(altitude / 100)} ({altitude.toLocaleString()} FT)
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="45000"
              step="1000"
              value={altitude}
              onChange={(e) => setAltitude(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white liquid-glass-subtle rounded-full transition-colors cursor-pointer border border-white/10 font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 liquid-glass-active text-white font-bold rounded-full transition-all duration-200 cursor-pointer shadow-lg active:scale-95 font-mono"
            >
              <PlusCircle className="w-4 h-4 text-sky-400" />
              <span>Inject Target</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
