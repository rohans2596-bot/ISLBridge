import React from 'react';
import { Camera, Eye, Cpu, Sliders, Brain, Activity, MessageSquare, Volume2 } from 'lucide-react';

interface VisualPipelineProps {
  activeStage: number; // 0 to 7
}

export const VisualPipeline: React.FC<VisualPipelineProps> = ({ activeStage }) => {
  const stages = [
    { id: 0, label: 'Camera Stream', icon: Camera },
    { id: 1, label: 'Hand Detection', icon: Eye },
    { id: 2, label: '21 Landmarks', icon: Cpu },
    { id: 3, label: 'Normalization', icon: Sliders },
    { id: 4, label: 'ML Classifier', icon: Brain },
    { id: 5, label: 'Temporal Filter', icon: Activity },
    { id: 6, label: 'ISL Sign', icon: MessageSquare },
    { id: 7, label: 'Speech & Translation', icon: Volume2 },
  ];

  return (
    <div className="p-4 rounded-3xl glass-panel border border-stone-200/80 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
          AI PIPELINE ARCHITECTURE
        </span>
        <span className="text-[10px] font-mono text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 shadow-2xs">
          STAGE {activeStage + 1} / {stages.length} ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx <= activeStage;
          const isCurrent = idx === activeStage;

          return (
            <div
              key={stage.id}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all duration-200 ${
                isCurrent
                  ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/20 scale-105'
                  : isActive
                  ? 'bg-sky-50 border-sky-200 text-sky-800'
                  : 'bg-white/60 border-stone-200 text-slate-400'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1.5 ${isCurrent ? 'animate-bounce text-white' : ''}`} />
              <span className="text-[10px] font-mono font-medium leading-tight">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
