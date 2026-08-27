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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#090d14] border border-slate-700 rounded max-w-md w-full p-4 shadow-2xl text-slate-200 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              INJECT SSR RADAR TARGET
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-500 mb-1 block text-[10px]">CALLSIGN</label>
              <input
                type="text"
                required
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="w-full bg-[#06090f] border border-slate-800 focus:border-cyan-400 rounded px-2 py-1 text-cyan-300 outline-none uppercase font-bold"
              />
            </div>
            <div>
              <label className="text-slate-500 mb-1 block text-[10px]">ICAO TYPE</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#06090f] border border-slate-800 focus:border-cyan-400 rounded px-2 py-1 text-slate-200 outline-none"
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

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-500 mb-1 block text-[10px]">ORIGIN (ICAO/IATA)</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                maxLength={4}
                className="w-full bg-[#06090f] border border-slate-800 focus:border-cyan-400 rounded px-2 py-1 text-slate-200 outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-slate-500 mb-1 block text-[10px]">DESTINATION (ICAO/IATA)</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                maxLength={4}
                className="w-full bg-[#06090f] border border-slate-800 focus:border-cyan-400 rounded px-2 py-1 text-slate-200 outline-none uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-500 mb-1 block text-[10px]">INITIAL X [0-1000]</label>
              <input
                type="number"
                min="20"
                max="980"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                className="w-full bg-[#06090f] border border-slate-800 focus:border-cyan-400 rounded px-2 py-1 text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 mb-1 block text-[10px]">INITIAL Y [0-750]</label>
              <input
                type="number"
                min="20"
                max="730"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
                className="w-full bg-[#06090f] border border-slate-800 focus:border-cyan-400 rounded px-2 py-1 text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Heading */}
          <div>
            <div className="flex justify-between mb-0.5 text-[11px]">
              <span className="text-slate-500">HEADING (TRACK)</span>
              <span className="text-cyan-300 font-bold">{heading}° MAG</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={heading}
              onChange={(e) => setHeading(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Speed */}
          <div>
            <div className="flex justify-between mb-0.5 text-[11px]">
              <span className="text-slate-500">GROUND SPEED</span>
              <span className="text-cyan-300 font-bold">{speed} KTS</span>
            </div>
            <input
              type="range"
              min="250"
              max="850"
              step="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Altitude */}
          <div>
            <div className="flex justify-between mb-0.5 text-[11px]">
              <span className="text-slate-500">CLEARED FLIGHT LEVEL</span>
              <span className="text-cyan-300 font-bold">
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
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-slate-950 font-bold rounded transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              INJECT TO SCOPE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
