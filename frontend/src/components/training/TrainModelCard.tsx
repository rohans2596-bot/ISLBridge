import React, { useState } from 'react';
import { Cpu, Zap, CheckCircle, RefreshCw, Award, ArrowUpRight } from 'lucide-react';
import { ApiService } from '../../services/api';
import { ModelMetrics } from '../../types/isl';

interface TrainModelCardProps {
  currentMetrics: ModelMetrics | null;
  onTrainingComplete?: (newMetrics: ModelMetrics) => void;
}

export const TrainModelCard: React.FC<TrainModelCardProps> = ({
  currentMetrics,
  onTrainingComplete
}) => {
  const [modelType, setModelType] = useState<'RandomForest' | 'MLP' | 'GradientBoosting'>('RandomForest');
  const [syntheticSamples, setSyntheticSamples] = useState<number>(45);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);
  const [trainingSuccess, setTrainingSuccess] = useState<boolean>(false);

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingStatus('Extracting biomechanical features & splitting train/test sets...');
    setTrainingSuccess(false);

    try {
      setTimeout(() => {
        setTrainingStatus(`Fitting ${modelType} classifier with cross-validation...`);
      }, 1000);

      const metrics = await ApiService.trainModel({
        model_type: modelType,
        samples_per_synthetic_sign: syntheticSamples
      });

      setTrainingStatus('Evaluating precision, recall, and confusion matrix...');
      setTimeout(() => {
        setIsTraining(false);
        setTrainingStatus(null);
        setTrainingSuccess(true);
        if (onTrainingComplete) onTrainingComplete(metrics);
      }, 1200);

    } catch (err: any) {
      setIsTraining(false);
      setTrainingStatus(`Training failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-sm">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-300">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Model Training &amp; Neural Re-compilation
          </span>
        </div>

        {currentMetrics && (
          <span className="text-xs font-mono text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 shadow-2xs">
            {currentMetrics.version} ACTIVE
          </span>
        )}
      </div>

      {/* Model Selection Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-slate-600 block mb-1 font-medium">Classifier Architecture</label>
          <select
            value={modelType}
            onChange={e => setModelType(e.target.value as any)}
            disabled={isTraining}
            className="w-full glass-input text-xs px-3 py-2 rounded-xl cursor-pointer bg-white text-slate-900 border border-stone-300"
          >
            <option value="RandomForest">Random Forest (120 Trees - Fast &amp; Robust)</option>
            <option value="MLP">Multi-Layer Perceptron (Neural Network 128x64)</option>
            <option value="GradientBoosting">Gradient Boosting Classifier</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-medium">
            <span>Synthetic Variation Density</span>
            <span className="font-mono text-sky-700 font-bold">{syntheticSamples} / sign</span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            step="5"
            value={syntheticSamples}
            onChange={e => setSyntheticSamples(Number(e.target.value))}
            disabled={isTraining}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Training In-Progress State */}
      {isTraining && (
        <div className="p-4 rounded-2xl bg-white border border-sky-300 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-800">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>{trainingStatus}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-sky-600 animate-pulse w-full" />
          </div>
        </div>
      )}

      {/* Training Success Celebration */}
      {trainingSuccess && currentMetrics && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">Model Successfully Trained &amp; Deployed!</h5>
              <p className="text-[11px] text-slate-600 font-mono">
                Accuracy: {(currentMetrics.accuracy * 100).toFixed(1)}% | F1-Score: {(currentMetrics.f1_score * 100).toFixed(1)}% ({currentMetrics.classes_count} Classes)
              </p>
            </div>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
      )}

      {/* Train Button */}
      <button
        onClick={handleTrain}
        disabled={isTraining}
        className="w-full glass-btn-primary flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
      >
        <Zap className="w-4 h-4 text-white" />
        <span>{isTraining ? 'Training ISL Model...' : 'Train Model & Hot-Reload Engine'}</span>
      </button>

    </div>
  );
};
