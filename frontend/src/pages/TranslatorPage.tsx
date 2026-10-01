import React, { useEffect } from 'react';
import { CameraView } from '../components/camera/CameraView';
import { CameraControls } from '../components/camera/CameraControls';
import { RecognitionCard } from '../components/translator/RecognitionCard';
import { SentenceBuilder } from '../components/translator/SentenceBuilder';
import { VisualPipeline } from '../components/translator/VisualPipeline';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { useCamera } from '../hooks/useCamera';
import { useISLRecognizer } from '../hooks/useISLRecognizer';
import { useSpeech } from '../hooks/useSpeech';
import { SupportedLanguage } from '../utils/tamilTranslations';

interface TranslatorPageProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  modelReady: boolean;
}

export const TranslatorPage: React.FC<TranslatorPageProps> = ({
  language,
  setLanguage,
  modelReady,
}) => {
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
    addSpace,
    undoLastSign,
    clearSentence,
    saveCurrentSession,
  } = useISLRecognizer();

  const { isSpeaking, autoSpeak, speak, stop: stopSpeech, toggleAutoSpeak } = useSpeech();

  // Connect camera to MediaPipe recognizer when camera turns active
  useEffect(() => {
    if (cameraState.isActive && !cameraState.isPaused && videoRef.current) {
      startRecognition(videoRef.current, onFrame);
    } else {
      stopRecognition();
    }
  }, [cameraState.isActive, cameraState.isPaused, onFrame, startRecognition, stopRecognition]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & AI Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans flex items-center gap-2">
            <span>ISL Real-Time Translator</span>
            <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 shadow-xs">
              Live Neural Vision
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Perform sign gesture in camera view. Auto-speaks recognized signs in 6 Indian languages with real-time translation.
          </p>
        </div>

        <StatusIndicator
          cameraReady={cameraState.isActive}
          handDetected={recognizerState.handDetected}
          modelReady={modelReady}
          fps={cameraState.fps}
        />
      </div>

      {/* Main 3-Column Balanced Translator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Live Camera Feed & Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
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
            estimatedDistanceCm={recognizerState.handDistanceCm}
            distanceStatus={recognizerState.handDistanceStatus}
            interHandDistanceCm={recognizerState.interHandDistanceCm}
            onFrame={onFrame}
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
            onDeviceChange={(id) => startCamera(id)}
            onReset={clearSentence}
          />
        </div>

        {/* CENTER COLUMN: Real-Time Recognition & Confidence (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <RecognitionCard
            prediction={recognizerState.currentPrediction}
            isTranslating={recognizerState.isTranslating}
          />

          <VisualPipeline
            activeStage={recognizerState.activePipelineStage}
          />
        </div>

        {/* RIGHT COLUMN: Sentence Construction & TTS (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <SentenceBuilder
            accumulatedSigns={recognizerState.accumulatedSigns}
            englishSentence={recognizerState.englishSentence}
            tamilSentence={recognizerState.tamilSentence}
            isSpeaking={isSpeaking}
            language={language}
            setLanguage={setLanguage}
            onSpeak={(text, lang) => speak(text, lang)}
            onStopSpeak={stopSpeech}
            onUndo={undoLastSign}
            onAddSpace={addSpace}
            onClear={clearSentence}
            onSaveSession={() => saveCurrentSession('Live User')}
            autoSpeak={autoSpeak}
            onToggleAutoSpeak={toggleAutoSpeak}
          />
        </div>

      </div>

    </div>
  );
};
