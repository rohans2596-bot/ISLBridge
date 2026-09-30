import React from 'react';

interface StatusIndicatorProps {
  cameraReady: boolean;
  handDetected: boolean;
  modelReady: boolean;
  fps?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  cameraReady,
  handDetected,
  modelReady,
  fps = 0,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
      {/* Model Ready */}
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md shadow-2xs ${
        modelReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}>
        <span className={`w-2 h-2 rounded-full ${modelReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-rose-500'}`} />
        <span className="font-semibold text-[11px]">{modelReady ? 'AI ONLINE' : 'AI LOADING'}</span>
      </div>

      {/* Camera Connected */}
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md shadow-2xs ${
        cameraReady ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-white border-stone-200 text-slate-500'
      }`}>
        <span className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-pulse' : 'bg-slate-400'}`} />
        <span className="font-semibold text-[11px]">{cameraReady ? 'CAMERA LIVE' : 'CAM OFF'}</span>
      </div>

      {/* Hand Detected */}
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md shadow-2xs ${
        handDetected ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-stone-200 text-slate-500'
      }`}>
        <span className={`w-2 h-2 rounded-full ${handDetected ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse' : 'bg-slate-400'}`} />
        <span className="font-semibold text-[11px]">{handDetected ? 'HAND IN FRAME' : 'NO HAND'}</span>
      </div>

      {/* FPS Counter */}
      {cameraReady && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-200 bg-white text-slate-700 font-mono text-[11px] backdrop-blur-md shadow-2xs">
          <span className="text-slate-900 font-bold">{fps}</span> FPS
        </div>
      )}
    </div>
  );
};
