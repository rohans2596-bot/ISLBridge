import React from 'react';
import { Play, Pause, Square, Camera, RefreshCw, Sliders } from 'lucide-react';

interface CameraControlsProps {
  isActive: boolean;
  isPaused: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onStart: () => void;
  onStop: () => void;
  onTogglePause: () => void;
  onDeviceChange: (deviceId: string) => void;
  onReset: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  isActive,
  isPaused,
  devices,
  selectedDeviceId,
  onStart,
  onStop,
  onTogglePause,
  onDeviceChange,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-stone-200/80 shadow-xs">
      
      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2">
        {!isActive ? (
          <button
            onClick={onStart}
            className="glass-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-white" />
            <span>Start Live Camera</span>
          </button>
        ) : (
          <>
            <button
              onClick={onTogglePause}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isPaused
                  ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                  : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Reset smoother and clear state"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </>
        )}
      </div>

      {/* Device Switcher Dropdown or Camera Status Pill */}
      {devices.length > 1 ? (
        <div className="flex items-center gap-2 text-xs">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedDeviceId}
            onChange={(e) => onDeviceChange(e.target.value)}
            className="glass-input text-xs px-3 py-1.5 rounded-xl text-slate-800 cursor-pointer shadow-2xs"
          >
            {devices.map((device, idx) => (
              <option key={device.deviceId} value={device.deviceId} className="bg-white text-slate-900">
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      ) : isActive ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="text-slate-700 font-semibold">{isPaused ? 'STREAM PAUSED' : 'LIVE 720P'}</span>
        </div>
      ) : null}

    </div>
  );
};
