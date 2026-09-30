import React, { useEffect, useRef } from 'react';
import { Camera, AlertCircle, RefreshCw, Hand, VideoOff } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  fps: number;
  handDetected: boolean;
  handsCount: number;
  onFrame?: () => void;
  onStartCamera: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  isActive,
  isPaused,
  isLoading,
  error,
  fps,
  handDetected,
  handsCount,
  onStartCamera,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize canvas dimensions with video bounding rectangle
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [canvasRef, isActive]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden glass-panel-glow border-2 border-skyblue-500/30 bg-black flex items-center justify-center scanline group shadow-2xl"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
          isActive && !isLoading ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Transparent Hand Skeleton Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 scale-x-[-1]"
      />

      {/* Target Hand Framing Box (When no hand detected) */}
      {isActive && !isPaused && !handDetected && !isLoading && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center">
          <div className="w-56 h-72 border-2 border-dashed border-skyblue-400/40 rounded-3xl animate-pulse flex flex-col items-center justify-center p-4 backdrop-blur-[2px]">
            <Hand className="w-10 h-10 text-skyblue-400/60 mb-2" />
            <span className="text-xs font-mono text-skyblue-200/80 text-center uppercase tracking-wider font-semibold">
              Position hand in frame
            </span>
          </div>
        </div>
      )}

      {/* Top Overlays: FPS & Hand Status Badges */}
      {isActive && !isLoading && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-30 pointer-events-none">
          {/* Hand Detection Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono backdrop-blur-md border ${
            handDetected 
              ? 'bg-skyblue-950/90 border-skyblue-400/60 text-white shadow-lg shadow-skyblue-950/50' 
              : 'bg-black/80 border-white/10 text-zinc-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${handDetected ? 'bg-skyblue-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-ping' : 'bg-zinc-600'}`} />
            <span>{handDetected ? `${handsCount} HAND${handsCount > 1 ? 'S' : ''} DETECTED` : 'WAITING FOR GESTURE'}</span>
          </div>

          {/* FPS Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-black/80 border border-white/10 text-zinc-300 backdrop-blur-md">
            <span className="text-white font-bold">{fps}</span> FPS
          </div>
        </div>
      )}

      {/* Camera Inactive State */}
      {!isActive && !isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-black/95">
          <div className="w-16 h-16 rounded-2xl bg-skyblue-950 border border-skyblue-600/40 flex items-center justify-center text-skyblue-300 mb-4 shadow-xl shadow-skyblue-950">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Webcam Not Active</h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
            ISLBridge extracts 21 geometric landmarks locally in memory for instant ISL translation.
          </p>
          <button
            onClick={onStartCamera}
            className="glass-btn-primary flex items-center gap-2 px-7 py-3 rounded-2xl font-black text-sm transition-all transform hover:scale-105 active:scale-95"
          >
            <Camera className="w-4 h-4 text-white" />
            <span>Start Live Camera</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-black/95">
          <RefreshCw className="w-10 h-10 text-skyblue-400 animate-spin mb-4" />
          <h4 className="text-base font-bold text-white">Connecting Camera &amp; AI Neural Core...</h4>
          <p className="text-xs text-zinc-400 mt-1">Initializing MediaPipe landmark detectors...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-rose-950/80 backdrop-blur-md border border-rose-500/30">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Camera Permission Required</h4>
          <p className="text-xs text-zinc-200 max-w-sm mb-5">{error}</p>
          <button
            onClick={onStartCamera}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center z-25 bg-black/75 backdrop-blur-sm">
          <div className="px-5 py-2.5 rounded-2xl bg-black/90 border border-amber-500/40 text-amber-300 font-mono text-sm flex items-center gap-2 shadow-xl">
            <VideoOff className="w-4 h-4" />
            <span>STREAM PAUSED</span>
          </div>
        </div>
      )}

    </div>
  );
};
