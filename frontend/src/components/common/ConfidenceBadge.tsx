import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number; // 0 to 1 or 0 to 100
  status?: 'high' | 'medium' | 'low';
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, status, size = 'md' }) => {
  const normConf = confidence > 1 ? confidence : confidence * 100;
  const determinedStatus = status || (normConf >= 85 ? 'high' : normConf >= 60 ? 'medium' : 'low');

  const colorConfig = {
    high: {
      bg: 'bg-sky-50 border-sky-300 text-sky-800 shadow-2xs',
      dot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]',
      label: 'HIGH CONFIDENCE',
    },
    medium: {
      bg: 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs',
      dot: 'bg-amber-500',
      label: 'MEDIUM CONFIDENCE',
    },
    low: {
      bg: 'bg-stone-100 border-stone-300 text-slate-600',
      dot: 'bg-slate-400',
      label: 'LOW CONFIDENCE',
    },
  }[determinedStatus];

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 space-x-1.5',
    md: 'text-xs px-3 py-1 space-x-2',
    lg: 'text-sm px-4 py-1.5 space-x-2.5 font-semibold',
  }[size];

  return (
    <div className={`inline-flex items-center rounded-full border backdrop-blur-md ${colorConfig.bg} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full animate-pulse ${colorConfig.dot}`} />
      <span className="font-bold">{normConf.toFixed(1)}%</span>
      <span className="opacity-75 font-mono text-[10px] uppercase">({colorConfig.label})</span>
    </div>
  );
};
