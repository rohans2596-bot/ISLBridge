import React from 'react';

interface ConfidenceMeterProps {
  confidence: number; // 0.0 to 1.0 or 0 to 100
  status: 'high' | 'medium' | 'low';
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ confidence, status }) => {
  const normConf = confidence > 1 ? confidence : confidence * 100;

  const colorConfigMap = {
    high: {
      bar: 'bg-gradient-to-r from-sky-500 to-sky-600',
      text: 'text-sky-700',
      label: 'HIGH CONFIDENCE',
    },
    medium: {
      bar: 'bg-gradient-to-r from-amber-400 to-amber-600',
      text: 'text-amber-700',
      label: 'MEDIUM CONFIDENCE',
    },
    low: {
      bar: 'bg-gradient-to-r from-slate-400 to-slate-500',
      text: 'text-slate-500',
      label: 'UNCERTAIN',
    },
  };

  const colorConfig = colorConfigMap[status] || colorConfigMap.low;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500 font-semibold">MODEL CONFIDENCE</span>
        <span className={`font-bold ${colorConfig.text}`}>
          {normConf.toFixed(1)}% <span className="text-[10px] text-slate-400 font-normal">({colorConfig.label})</span>
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="relative h-2.5 w-full rounded-full bg-slate-200 border border-slate-300 overflow-hidden shadow-inner">
        {/* Fill */}
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorConfig.bar} shadow-xs`}
          style={{ width: `${Math.min(100, Math.max(0, normConf))}%` }}
        />
        {/* 85% High threshold marker */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-slate-400/80 pointer-events-none"
          style={{ left: '85%' }}
          title="High Confidence Threshold (85%)"
        />
        {/* 60% Medium threshold marker */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-slate-400/50 pointer-events-none"
          style={{ left: '60%' }}
          title="Medium Confidence Threshold (60%)"
        />
      </div>

      {/* Threshold Labels */}
      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
        <span>0%</span>
        <span className="pl-6">60% Medium</span>
        <span className="pl-8">85% High</span>
        <span>100%</span>
      </div>
    </div>
  );
};
