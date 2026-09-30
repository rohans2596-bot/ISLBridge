import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Video, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { CameraView } from '../components/camera/CameraView';
import { VisualPipeline } from '../components/translator/VisualPipeline';
import { ConfidenceMeter } from '../components/translator/ConfidenceMeter';
import { useCamera } from '../hooks/useCamera';
import { useISLRecognizer } from '../hooks/useISLRecognizer';
import { useSpeech } from '../hooks/useSpeech';

interface DemoPageProps {
  language: 'en' | 'ta';
  setLanguage: (lang: 'en' | 'ta') => void;
  modelReady: boolean;
}

export const DemoPage: React.FC<DemoPageProps> = ({
  language,
  setLanguage,
  modelReady
}) => {
  const {
    videoRef,
    state: cameraState,
    startCamera,
    stopCamera,
    onFrame,
  } = useCamera('720p');

  const {
    state: recognizerState,
    canvasRef,
    startRecognition,
    stopRecognition,
    clearSentence,
  } = useISLRecognizer();

  const { isSpeaking, speak, stop: stopSpeech } = useSpeech();

  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({
    camera: false,
    hand: false,
    hello: false,
    sentence: false,
    speech: false,
  });

  // Connect MediaPipe when camera is running
  useEffect(() => {
    if (cameraState.isActive && !cameraState.isPaused && videoRef.current) {
      startRecognition(videoRef.current);
      setCompletedSteps(prev => ({ ...prev, camera: true }));
    } else {
      stopRecognition();
    }
  }, [cameraState.isActive, cameraState.isPaused]);

  // Track milestones
  useEffect(() => {
    if (recognizerState.handDetected) {
      setCompletedSteps(prev => ({ ...prev, hand: true }));
    }
    const currentSign = recognizerState.currentPrediction?.sign;
    if (currentSign && currentSign !== 'NO HAND' && currentSign !== 'UNCERTAIN') {
      if (currentSign === 'HELLO' || currentSign === 'THANK YOU') {
        setCompletedSteps(prev => ({ ...prev, hello: true }));
      }
    }
    if (recognizerState.accumulatedSigns.length >= 2) {
      setCompletedSteps(prev => ({ ...prev, sentence: true }));
    }
  }, [recognizerState.handDetected, recognizerState.currentPrediction, recognizerState.accumulatedSigns]);

  const handleDemoSpeak = () => {
    const textToSpeak = language === 'ta' 
      ? (recognizerState.tamilSentence || recognizerState.englishSentence) 
      : (recognizerState.englishSentence || 'Hello');
    speak(textToSpeak, language);
    setCompletedSteps(prev => ({ ...prev, speech: true }));
  };

  const pred = recognizerState.currentPrediction;
  const currentSign = pred?.sign || (recognizerState.handDetected ? 'DETECTING...' : 'WAITING FOR HAND');
  const confidence = pred?.confidence || 0;
  const status = pred?.status || 'low';
  const tamilTrans = pred?.tamil_translation;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Demo Top Banner */}
      <div className="p-5 rounded-3xl glass-panel-glow border border-sky-300 bg-gradient-to-r from-white via-sky-50/70 to-amber-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-sky-100 border border-sky-300 text-sky-700 shadow-2xs">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 font-sans tracking-tight">
                ISLBridge Live Presentation Stage
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
                DEMO MODE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              High-contrast real-time sign recognition with live multi-stage neural pipeline breakdown.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!cameraState.isActive ? (
            <button
              onClick={() => startCamera()}
              className="glass-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Video className="w-4 h-4 text-white" />
              <span>START LIVE DEMO</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer"
            >
              End Demo
            </button>
          )}
        </div>
      </div>

      {/* Main Hackathon Presentation Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Large Video Camera Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
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

          <VisualPipeline activeStage={recognizerState.activePipelineStage} />
        </div>

        {/* Big Prediction Display & Demo Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Giant Prediction Box */}
          <div className="p-6 rounded-3xl glass-panel-skyblue border border-sky-300 text-center space-y-4 shadow-sm">
            <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest block font-medium">
              RECOGNIZED ISL GESTURE
            </span>

            <div className="min-h-[90px] flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
              <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]">
                {currentSign}
              </h2>
              {tamilTrans && (
                <p className="text-xl font-bold text-amber-300 mt-1">
                  {tamilTrans}
                </p>
              )}
            </div>

            <ConfidenceMeter confidence={confidence} status={status} />
          </div>

          {/* Live Accumulated Sentence Box */}
          <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 uppercase font-bold">
                Synthesized Sentence:
              </span>
              <button
                onClick={clearSentence}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-900 min-h-[30px] p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              {recognizerState.englishSentence || 'No gestures recorded yet...'}
            </p>

            {recognizerState.tamilSentence && (
              <p className="text-sm font-semibold text-amber-800 px-3">
                தமிழ்: {recognizerState.tamilSentence}
              </p>
            )}

            <button
              onClick={handleDemoSpeak}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'glass-btn-primary'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'Speaking...' : `Speak Sentence (${language === 'ta' ? 'தமிழ்' : 'English'})`}</span>
            </button>
          </div>

          {/* Hackathon Flow Checklist */}
          <div className="p-4 rounded-3xl glass-panel border border-stone-200/80 space-y-2.5 shadow-xs">
            <span className="text-xs font-mono font-bold text-slate-700 uppercase">
              Interactive Test Checklist:
            </span>

            <div className="space-y-1.5 text-xs">
              {[
                { key: 'camera', label: '1. Connect Webcam stream' },
                { key: 'hand', label: '2. Detect 21 Hand Landmarks' },
                { key: 'hello', label: '3. Perform "HELLO" or "THANK YOU" gesture' },
                { key: 'sentence', label: '4. Form multi-word sentence' },
                { key: 'speech', label: '5. Synthesize multilingual speech' },
              ].map(item => {
                const isDone = completedSteps[item.key];
                return (
                  <div key={item.key} className="flex items-center gap-2">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={isDone ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
