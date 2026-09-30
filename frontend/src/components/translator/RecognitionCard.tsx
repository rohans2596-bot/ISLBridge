import React from 'react';
import { Sparkles, Layers, Activity } from 'lucide-react';
import { PredictionResult } from '../../types/isl';
import { ConfidenceMeter } from './ConfidenceMeter';

interface RecognitionCardProps {
  prediction: PredictionResult | null;
  isTranslating: boolean;
}

export const RecognitionCard: React.FC<RecognitionCardProps> = ({ prediction, isTranslating }) => {
  const sign = prediction?.sign || 'WAITING...';
  const rawSign = prediction?.raw_sign || sign;
  const confidence = prediction?.confidence || 0;
  const status = prediction?.status || 'low';
  const tamilTrans = prediction?.tamil_translation;
  const topK = prediction?.top_k || [];
  const handDetected = prediction?.hand_detected ?? false;

  const isNoHand = !handDetected || sign === 'NO HAND';
  const isUncertain = sign === 'UNCERTAIN';

  return (
    <div className="p-5 rounded-3xl glass-panel-skyblue border border-sky-300/80 space-y-4 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-300">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Real-Time Recognition
          </span>
        </div>

        {isTranslating && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
            <span>AI INFERENCE ACTIVE</span>
          </div>
        )}
      </div>

      {/* Main Sign Display Box */}
      <div className="relative py-7 px-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center overflow-hidden shadow-inner">
        {/* Glow ambient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-transparent to-sky-950/40 pointer-events-none" />

        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-medium">
          CURRENT ISL SIGN
        </span>

        {isNoHand ? (
          <div className="py-2">
            <span className="text-2xl font-mono text-slate-400">
              [ NO HAND ]
            </span>
            <p className="text-xs text-slate-500 mt-1">Show hand to start recognition</p>
          </div>
        ) : isUncertain ? (
          <div className="py-2">
            <span className="text-2xl font-bold text-amber-400">
              CALIBRATING GESTURE
            </span>
            <p className="text-xs text-amber-200/80 mt-1">Adjust hand orientation in camera</p>
          </div>
        ) : (
          <div className="py-1 space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]">
              {sign}
            </h2>
            {tamilTrans && (
              <p className="text-base font-bold text-amber-300">
                {tamilTrans}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confidence Meter */}
      <ConfidenceMeter confidence={confidence} status={status} />

      {/* Top 3 Predictions Distribution */}
      {topK.length > 0 && !isNoHand && (
        <div className="pt-3 border-t border-sky-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-700">
            <Layers className="w-3 h-3 text-sky-600" />
            <span className="font-semibold">TOP-3 CLASSIFIER CANDIDATES:</span>
          </div>

          <div className="space-y-1.5">
            {topK.map((item, idx) => {
              const confPct = Math.round(item.confidence * 100);
              return (
                <div key={idx} className="flex items-center justify-between text-xs font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-sky-200/80 shadow-2xs">
                  <span className="text-slate-800 font-semibold">{idx + 1}. {item.sign}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full"
                        style={{ width: `${confPct}%` }}
                      />
                    </div>
                    <span className="text-slate-900 text-[11px] w-8 text-right font-bold">{confPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
