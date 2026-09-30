import React, { useState, useEffect } from 'react';
import { Layers, Award, BarChart3, CheckCircle2, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';
import { ModelMetrics } from '../types/isl';
import { ConfusionMatrixView } from '../components/training/ConfusionMatrixView';

export const ModelEvaluationPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [modelList, setModelList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const [m, list] = await Promise.all([
        ApiService.getModelMetrics(),
        ApiService.getModelHistory().catch(() => [])
      ]);
      setMetrics(m);
      setModelList(list);
    } catch (e) {
      console.warn('Failed to load metrics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">
              Model Performance &amp; Evaluation
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Strictly calculated validation dataset metrics, per-class F1 scores, and test split evaluation.
            </p>
          </div>
        </div>

        <button
          onClick={loadMetrics}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 border border-stone-200 text-xs text-slate-700 hover:text-slate-900 hover:bg-stone-100 transition-all font-semibold shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide">Test Accuracy</span>
            <h3 className="text-3xl font-black text-slate-900 font-mono mt-1">
              {(metrics.accuracy * 100).toFixed(1)}%
            </h3>
          </div>
          <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide">Weighted Precision</span>
            <h3 className="text-3xl font-black text-sky-700 font-mono mt-1">
              {(metrics.precision * 100).toFixed(1)}%
            </h3>
          </div>
          <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide">Weighted Recall</span>
            <h3 className="text-3xl font-black text-emerald-700 font-mono mt-1">
              {(metrics.recall * 100).toFixed(1)}%
            </h3>
          </div>
          <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide">Weighted F1-Score</span>
            <h3 className="text-3xl font-black text-amber-700 font-mono mt-1">
              {(metrics.f1_score * 100).toFixed(1)}%
            </h3>
          </div>
        </div>
      )}

      {/* Confusion Matrix */}
      {metrics && (
        <ConfusionMatrixView
          matrix={metrics.confusion_matrix}
          classes={metrics.classes || []}
        />
      )}

      {/* Per-Class Accuracy Breakdown Table */}
      {metrics?.per_class_metrics && (
        <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-md">
          <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Per-Class Performance Breakdown ({metrics.classes_count} Sign Classes)
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-stone-200/70 bg-white/70">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-mono uppercase bg-stone-100/90 text-slate-600 border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Class Sign</th>
                  <th className="p-3.5">Precision</th>
                  <th className="p-3.5">Recall</th>
                  <th className="p-3.5">F1 Score</th>
                  <th className="p-3.5">Test Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 font-mono">
                {Object.entries(metrics.per_class_metrics).map(([signName, stat]: [string, any]) => (
                  <tr key={signName} className="hover:bg-sky-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{signName}</td>
                    <td className="p-3.5 text-slate-700">{(stat.precision * 100).toFixed(1)}%</td>
                    <td className="p-3.5 text-slate-700">{(stat.recall * 100).toFixed(1)}%</td>
                    <td className="p-3.5 text-amber-700 font-bold">{(stat.f1_score * 100).toFixed(1)}%</td>
                    <td className="p-3.5 text-slate-500">{stat.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
