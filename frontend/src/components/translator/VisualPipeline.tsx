import React from 'react';
import { Camera, Eye, Cpu, Sliders, Brain, Activity, MessageSquare, Volume2, CheckCircle2 } from 'lucide-react';

interface VisualPipelineProps {
  activeStage: number; // 0 to 7
}

interface StageInfo {
  id: number;
  step: string;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const VisualPipeline: React.FC<VisualPipelineProps> = ({ activeStage }) => {
  const stages: StageInfo[] = [
    { id: 0, step: '01', title: 'Camera', detail: 'Live Stream', icon: Camera },
    { id: 1, step: '02', title: 'Hand Detect', detail: 'MediaPipe Palm', icon: Eye },
    { id: 2, step: '03', title: '21 Points', detail: '3D Landmarks', icon: Cpu },
    { id: 3, step: '04', title: 'Normalize', detail: 'Vector Invariance', icon: Sliders },
    { id: 4, step: '05', title: 'Classifier', detail: '78 Signs Neural ML', icon: Brain },
    { id: 5, step: '06', title: 'Filter', detail: 'Temporal Smooth', icon: Activity },
    { id: 6, step: '07', title: 'ISL Sign', detail: 'Decoded Output', icon: MessageSquare },
    { id: 7, step: '08', title: 'Speech', detail: '6-Lang Voice TTS', icon: Volume2 },
  ];

  const currentStage = stages[Math.min(activeStage, stages.length - 1)] || stages[0];
  const progressPercent = Math.min(100, Math.max(12.5, ((activeStage + 1) / stages.length) * 100));

  return (
    <div className="p-4 rounded-3xl glass-panel border border-stone-200/80 space-y-3 shadow-xs">
      {/* Header with Title and Stage Counter */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            AI Pipeline Architecture
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 shadow-2xs">
          STAGE {activeStage + 1} / {stages.length} ACTIVE
        </span>
      </div>

      {/* Progress Bar & Current Stage Context */}
      <div className="space-y-1.5 bg-stone-50/80 p-2 rounded-xl border border-stone-200/60">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-600 truncate">
            Active: <strong className="text-sky-700">{currentStage.title}</strong>{' '}
            <span className="text-slate-400 font-normal">({currentStage.detail})</span>
          </span>
          <span className="text-sky-600 font-bold shrink-0">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-1.5 bg-stone-200/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4x2 Grid of Pipeline Stages */}
      <div className="grid grid-cols-4 gap-2">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = idx === activeStage;
          const isPassed = idx < activeStage;

          return (
            <div
              key={stage.id}
              className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all duration-200 min-h-[68px] overflow-hidden ${
                isCurrent
                  ? 'bg-gradient-to-br from-sky-600 to-sky-700 border-sky-500 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/40'
                  : isPassed
                  ? 'bg-sky-50/80 border-sky-200 text-sky-800 shadow-2xs'
                  : 'bg-white/70 border-stone-200 text-slate-400'
              }`}
            >
              {/* Step number badge & status */}
              <div className="w-full flex items-center justify-between px-0.5">
                <span
                  className={`text-[9px] font-mono font-bold leading-none ${
                    isCurrent ? 'text-sky-100' : isPassed ? 'text-sky-600' : 'text-slate-400'
                  }`}
                >
                  {stage.step}
                </span>
                {isPassed ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                ) : isCurrent ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                )}
              </div>

              {/* Icon */}
              <Icon
                className={`w-4 h-4 my-1 shrink-0 ${
                  isCurrent ? 'text-white' : isPassed ? 'text-sky-600' : 'text-slate-400'
                }`}
              />

              {/* Stage Title & Detail */}
              <div className="w-full">
                <span
                  className={`block text-[10px] font-bold leading-tight truncate ${
                    isCurrent ? 'text-white' : isPassed ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {stage.title}
                </span>
                <span
                  className={`block text-[8.5px] font-mono leading-none truncate mt-0.5 ${
                    isCurrent ? 'text-sky-200' : isPassed ? 'text-sky-600/80' : 'text-slate-400'
                  }`}
                >
                  {stage.detail}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
