import React, { useState, useEffect } from 'react';
import { Cpu, Video, Sparkles, Database, Award } from 'lucide-react';
import { CameraView } from '../components/camera/CameraView';
import { CameraControls } from '../components/camera/CameraControls';
import { SignRecorder } from '../components/training/SignRecorder';
import { TrainModelCard } from '../components/training/TrainModelCard';
import { ConfusionMatrixView } from '../components/training/ConfusionMatrixView';
import { useCamera } from '../hooks/useCamera';
import { useISLRecognizer } from '../hooks/useISLRecognizer';
import { ApiService } from '../services/api';
import { ISLSign, ModelMetrics } from '../types/isl';

export const TrainingPage: React.FC = () => {
  const [signs, setSigns] = useState<ISLSign[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'record' | 'train' | 'matrix'>('record');

  const {
    videoRef,
    state: cameraState,
    startCamera,
    stopCamera,
    togglePause,
    onFrame,
  } = useCamera('720p');

  const {
    state: recognizerState,
    canvasRef,
    startRecognition,
    stopRecognition,
    currentHandsRef,
  } = useISLRecognizer();

  // Load signs and active model metrics
  const loadData = async () => {
    try {
      const [signsList, modelMetrics] = await Promise.all([
        ApiService.getSigns(),
        ApiService.getModelMetrics().catch(() => null)
      ]);
      setSigns(signsList);
      if (modelMetrics) setMetrics(modelMetrics);
    } catch (e) {
      console.warn('Failed to load training page data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (cameraState.isActive && !cameraState.isPaused && videoRef.current) {
      startRecognition(videoRef.current);
    } else {
      stopRecognition();
    }
  }, [cameraState.isActive, cameraState.isPaused, startRecognition, stopRecognition]);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-sky-100 border border-sky-300 text-sky-700 shadow-2xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">
              ISL Neural Training Studio
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record custom gesture samples, extract 3D landmarks, train classifiers, and evaluate test performance.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1.5 bg-white/90 p-1.5 rounded-2xl border border-stone-200 text-xs font-mono shadow-2xs">
          <button
            onClick={() => setActiveSubTab('record')}
            className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold cursor-pointer ${
              activeSubTab === 'record' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Collect Samples
          </button>
          <button
            onClick={() => setActiveSubTab('train')}
            className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold cursor-pointer ${
              activeSubTab === 'train' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Train Model
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold cursor-pointer ${
              activeSubTab === 'matrix' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Confusion Matrix
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Camera & Visual Hands Skeleton (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            isActive={cameraState.isActive}
            isPaused={cameraState.isPaused}
            isLoading={cameraState.isLoading}
            error={cameraState.error}
            fps={cameraState.fps}
            handDetected={recognizerState.handDetected}
            handsCount={recognizerState.handsCount}
            onStartCamera={() => startCamera()}
          />

          <CameraControls
            isActive={cameraState.isActive}
            isPaused={cameraState.isPaused}
            devices={cameraState.devices}
            selectedDeviceId={cameraState.selectedDeviceId}
            onStart={() => startCamera()}
            onStop={stopCamera}
            onTogglePause={togglePause}
            onDeviceChange={id => startCamera(id)}
            onReset={() => {}}
          />
        </div>

        {/* Right: Selected Training Action (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeSubTab === 'record' && (
            <SignRecorder
              signs={signs}
              currentHands={currentHandsRef.current}
              onSampleRecorded={loadData}
            />
          )}

          {activeSubTab === 'train' && (
            <TrainModelCard
              currentMetrics={metrics}
              onTrainingComplete={(newMetrics) => {
                setMetrics(newMetrics);
                loadData();
              }}
            />
          )}

          {activeSubTab === 'matrix' && (
            <ConfusionMatrixView
              matrix={metrics?.confusion_matrix}
              classes={metrics?.classes || []}
            />
          )}
        </div>

      </div>

    </div>
  );
};
