import React, { useState, useRef, useEffect } from 'react';
import { 
  Film, 
  Upload, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Volume2, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  ArrowRight,
  Clock,
  Activity,
  Layers,
  FileVideo,
  Globe,
  Check
} from 'lucide-react';
import { ApiService } from '../services/api';
import { VideoAnalysisResponse, VideoAnalysisStep, HandData } from '../types/isl';
import { useSpeech } from '../hooks/useSpeech';
import { LANGUAGES, SupportedLanguage, getLanguageInfo } from '../utils/tamilTranslations';
import { MediaPipeHandsService } from '../services/mediapipe';


const TypewriterText: React.FC<{ text: string; progress?: number }> = ({ text, progress }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  React.useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }
    
    const words = text.split(' ');

    // If progress is provided (from local video), strictly sync words to video progress
    if (progress !== undefined && progress >= 0) {
      // Reveal words proportionally based on video completion %
      const wordsToShow = Math.max(1, Math.ceil(progress * words.length));
      // Only if progress is very small (0), show nothing
      if (progress === 0) {
        setDisplayedText('');
      } else {
        setDisplayedText(words.slice(0, wordsToShow).join(' '));
      }
      return;
    }

    // Fallback: Randomize delay for YouTube or cases where progress is not tracked
    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    setDisplayedText('');
    
    const typeNextWord = () => {
      if (currentIndex < words.length) {
        setDisplayedText(words.slice(0, currentIndex + 1).join(' '));
        currentIndex++;
        const randomDelay = Math.floor(Math.random() * 800) + 400;
        timeoutId = setTimeout(typeNextWord, randomDelay);
      }
    };
    
    typeNextWord();
    return () => clearTimeout(timeoutId);
  }, [text, progress]);

  return <span>"{displayedText}"</span>;
};

export const VideoTranslatorPage: React.FC = () => {
  const [videoProgress, setVideoProgress] = useState<number>(0);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Processing state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results & Translation language selection
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mpServiceRef = useRef<MediaPipeHandsService | null>(null);
  const isVideoLoopRunningRef = useRef<boolean>(false);

  // MediaPipe detection overlay states
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const showSkeletonRef = useRef<boolean>(true);
  showSkeletonRef.current = showSkeleton;
  const [detectedHandsCount, setDetectedHandsCount] = useState<number>(0);

  const { speak, isSpeaking } = useSpeech();

  // Initialize MediaPipe Hands for video preview tracking
  useEffect(() => {
    let isMounted = true;
    const initMP = async () => {
      try {
        const mpService = new MediaPipeHandsService();
        const success = await mpService.initialize();
        if (success && isMounted) {
          mpServiceRef.current = mpService;

          mpService.setOnResults((hands: HandData[]) => {
            if (!isMounted) return;
            setDetectedHandsCount(hands.length);

            const canvas = canvasRef.current;
            const video = videoPlayerRef.current;
            if (!canvas || !video) return;

            // Keep internal canvas dimensions in sync with CSS layout pixels
            const rect = canvas.getBoundingClientRect();
            const newWidth = Math.round(rect.width);
            const newHeight = Math.round(rect.height);
            if (canvas.width !== newWidth || canvas.height !== newHeight) {
              canvas.width = newWidth;
              canvas.height = newHeight;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!showSkeletonRef.current || hands.length === 0) return;

            // Compute exact video aspect ratio offset for letterbox/pillarbox
            const containerW = canvas.width;
            const containerH = canvas.height;
            const videoW = video.videoWidth || containerW;
            const videoH = video.videoHeight || containerH;
            const containerRatio = containerW / (containerH || 1);
            const videoRatio = videoW / (videoH || 1);

            let renderW = containerW;
            let renderH = containerH;
            let offsetX = 0;
            let offsetY = 0;

            if (containerRatio > videoRatio) {
              // Pillarbox: black bars left and right
              renderH = containerH;
              renderW = containerH * videoRatio;
              offsetX = (containerW - renderW) / 2;
            } else {
              // Letterbox: black bars top and bottom
              renderW = containerW;
              renderH = containerW / videoRatio;
              offsetY = (containerH - renderH) / 2;
            }

            ctx.save();
            ctx.translate(offsetX, offsetY);
            MediaPipeHandsService.drawSkeleton(ctx, hands, renderW, renderH);
            ctx.restore();
          });
        }
      } catch (err) {
        console.warn('MediaPipe initialization warning in VideoTranslatorPage:', err);
      }
    };

    initMP();

    return () => {
      isMounted = false;
      isVideoLoopRunningRef.current = false;
      if (mpServiceRef.current) {
        mpServiceRef.current.close();
        mpServiceRef.current = null;
      }
    };
  }, []);

  // Frame pumping loop while video is actively playing
  const startVideoTracking = () => {
    if (isVideoLoopRunningRef.current) return;
    isVideoLoopRunningRef.current = true;

    const pumpFrame = async () => {
      if (!isVideoLoopRunningRef.current) return;
      const video = videoPlayerRef.current;
      if (video && !video.paused && !video.ended && video.readyState >= 2 && mpServiceRef.current) {
        await mpServiceRef.current.sendFrame(video);
      }
      if (isVideoLoopRunningRef.current) {
        requestAnimationFrame(pumpFrame);
      }
    };

    requestAnimationFrame(pumpFrame);
  };

  const stopVideoTracking = () => {
    isVideoLoopRunningRef.current = false;
  };

  const handleVideoPlay = () => {
    startVideoTracking();
  };

  const handleVideoPause = () => {
    stopVideoTracking();
  };

  const handleVideoSeeked = () => {
    const video = videoPlayerRef.current;
    if (video && video.readyState >= 2 && mpServiceRef.current) {
      mpServiceRef.current.sendFrame(video);
    }
  };

  const handleVideoLoadedData = () => {
    const video = videoPlayerRef.current;
    if (video && video.readyState >= 2 && mpServiceRef.current) {
      mpServiceRef.current.sendFrame(video);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectFile(file);
    }
  };

  const handleSelectFile = (file: File) => {
    const validExtensions = ['mp4', 'mov', 'webm', 'mkv', 'avi'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(fileExt) && !file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file (.mp4, .mov, or .webm).');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('Video file is larger than 100MB. Please use a shorter clip for fast analysis.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setAnalysisResult(null);

    // Create object URL for local video preview
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  };

  // Run analysis pipeline
  const handleAnalyze = async () => {
    setErrorMessage(null);
    setAnalysisResult(null);
    setIsAnalyzing(true);
    setActiveStepIndex(1);

    try {
      if (!selectedFile) {
        throw new Error('Please select or upload a video file first.');
      }
      const result = await ApiService.analyzeVideoFile(selectedFile);

      setAnalysisResult(result);
      if (result.status === 'error') {
        const failedStep = result.steps.find(s => s.status === 'error');
        setErrorMessage(failedStep?.detail || 'Video analysis encountered an error. Please try a clearer sign video.');
      } else {
        // Autoplay video on success
        setTimeout(() => {
          if (videoPlayerRef.current) {
            videoPlayerRef.current.play().catch(e => console.log('Autoplay prevented:', e));
          }
        }, 500);
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'Analysis failed. Please check backend connection and video format.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset to analyze another video
  const handleReset = () => {
    setSelectedFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    setIsAnalyzing(false);
    setVideoProgress(0); // Reset progress on reset
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration > 0) {
      setVideoProgress(video.currentTime / video.duration);
    }
  };

  // Get active translation text according to selected language
  const getCurrentTranslationText = () => {
    if (!analysisResult) return '';
    switch (selectedLang) {
      case 'ta':
        return analysisResult.tamil_text || analysisResult.english_text;
      case 'hi':
        return analysisResult.hindi_text || analysisResult.english_text;
      case 'te':
        return analysisResult.telugu_text || analysisResult.english_text;
      case 'kn':
        return analysisResult.kannada_text || analysisResult.english_text;
      case 'ml':
        return analysisResult.malayalam_text || analysisResult.english_text;
      case 'en':
      default:
        return analysisResult.english_text;
    }
  };

  // Speak current translation
  const handleSpeak = () => {
    const text = getCurrentTranslationText();
    if (text) {
      speak(text, selectedLang);
    }
  };

  // Copy translation to clipboard
  const handleCopy = () => {
    const text = getCurrentTranslationText();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Standard pipeline steps representation
  const defaultSteps: { title: string; desc: string }[] = [
    { title: 'Video loaded', desc: 'Decoding video container & FPS metadata' },
    { title: 'Frames extracted', desc: 'Uniform temporal sampling at 3 FPS' },
    { title: 'Hands detected', desc: 'MediaPipe palm and hand ROI localization' },
    { title: 'Landmarks extracted', desc: '21 3D normalized coordinates extraction' },
    { title: 'ISL signs analyzed', desc: 'Temporal landmark sequence model classification' },
    { title: 'Translation completed', desc: 'Multilingual NLP sentence construction' },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-stone-200/80 shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-skyblue-500/10 text-skyblue-700 text-xs font-semibold mb-2">
            <Film className="w-3.5 h-3.5 text-skyblue-600" />
            <span>Add-On Feature</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Video Translator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Upload prerecorded Indian Sign Language video clips to transcribe signs into text and synthesized speech.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            MediaPipe + ISL AI Active
          </span>
        </div>
      </div>

      {/* Video Upload Box */}
      <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 shadow-sm space-y-6">
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleSelectFile(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-sky-300/80 hover:border-skyblue-500 bg-sky-50/40 hover:bg-sky-50/70 transition-all rounded-3xl p-8 sm:p-12 text-center cursor-pointer flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-skyblue-600 group-hover:scale-105 transition-transform border border-sky-100">
                <FileVideo className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Click to browse or drop an ISL video here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports MP4, MOV, WebM formats (up to 100MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-sky-50/60 border border-sky-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-skyblue-600 text-white flex items-center justify-center shadow-xs">
                  <FileVideo className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Video'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-skyblue-700 hover:text-skyblue-900 px-3 py-1.5 rounded-lg hover:bg-sky-100/60 transition-colors self-start sm:self-auto"
              >
                Change Video
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between border-t border-stone-200/60">
          <p className="text-xs text-slate-500">
            Video processed locally on your machine.
          </p>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !selectedFile}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md ${
              isAnalyzing || !selectedFile
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-skyblue-600 to-sky-700 hover:from-skyblue-700 hover:to-sky-800 text-white shadow-skyblue-500/20 hover:scale-[1.01]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Video...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Analyze Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-grow">
            <h4 className="font-bold">Analysis Notice</h4>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN: Video Preview & Progress */}
        <div className="space-y-6">
      {/* Video Preview Section */}
      {videoPreviewUrl && (
        <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-skyblue-600" />
              <span>Video Preview</span>
            </h3>

            <div className="flex items-center gap-2">
              {/* MediaPipe Hands Tracking Indicator */}
              <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                detectedHandsCount > 0 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${detectedHandsCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="w-[145px] text-left truncate">MediaPipe: {detectedHandsCount > 0 ? `${detectedHandsCount} Hand${detectedHandsCount > 1 ? 's' : ''} Tracked` : 'Detecting...'}</span>
              </span>

              {/* Skeleton Overlay Toggle Button */}
              <button
                type="button"
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                  showSkeleton
                    ? 'bg-skyblue-600 text-white border-skyblue-700 shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-slate-700 border-stone-200'
                }`}
                title="Toggle MediaPipe Skeleton Overlay"
              >
                🦴 Skeleton {showSkeleton ? 'ON' : 'OFF'}
              </button>

              {analysisResult && (
                <span className="text-xs text-slate-500 font-mono">
                  {analysisResult.total_frames} frames • {analysisResult.processing_time_sec}s
                </span>
              )}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black/90 aspect-video max-h-[380px] flex items-center justify-center border border-stone-800">
            <video
              ref={videoPlayerRef}
              src={videoPreviewUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoPause}
              onSeeked={handleVideoSeeked}
              onLoadedData={handleVideoLoadedData}
            />
            {/* Real-Time MediaPipe Skeleton Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none w-full h-full z-10"
            />
          </div>
        </div>
      )}

      {/* Analysis Progress Checklist */}
      {(isAnalyzing || analysisResult) && (
        <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Analysis Progress</span>
            </h3>
            {isAnalyzing && (
              <span className="text-xs text-skyblue-600 font-semibold flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Pipeline running...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {defaultSteps.map((stepItem, idx) => {
              // Determine status from result steps if completed
              const matchedStep = analysisResult?.steps.find(s => s.step.toLowerCase().includes(stepItem.title.toLowerCase()));
              const isDone = Boolean(matchedStep && matchedStep.status === 'done');
              const isRunning = isAnalyzing && idx <= activeStepIndex;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : isRunning
                      ? 'bg-sky-50/80 border-sky-300 text-sky-900'
                      : 'bg-stone-50/60 border-stone-200/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 text-skyblue-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
                    )}
                    <h5 className="text-xs font-bold">{stepItem.title}</h5>
                  </div>
                  <p className="text-[11px] opacity-80 mt-1 pl-6">
                    {matchedStep?.detail || stepItem.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </div>

        {/* RIGHT COLUMN: Analysis Results */}
        <div className="space-y-6">
      {/* Analysis Results Display */}
      {analysisResult && analysisResult.status === 'completed' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Detected Signs Section */}
          <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Detected Signs</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {analysisResult.deduplicated_signs.length} sign{analysisResult.deduplicated_signs.length !== 1 ? 's' : ''} recognized
              </span>
            </div>

            {analysisResult.deduplicated_signs.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2.5 py-2">
                {analysisResult.deduplicated_signs.map((sign, i) => (
                  <React.Fragment key={i}>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-skyblue-100 border border-sky-200 text-skyblue-900 font-mono font-bold text-xs sm:text-sm shadow-xs">
                      {sign}
                    </span>
                    {i < analysisResult.deduplicated_signs.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                No distinct sign gestures detected above confidence threshold in this video.
              </p>
            )}

            {/* Individual sign detections breakdown */}
            {analysisResult.detected_signs.length > 0 && (
              <div className="pt-2">
                <details className="text-xs text-slate-600 cursor-pointer">
                  <summary className="font-semibold text-slate-700 hover:text-skyblue-700 transition-colors">
                    View detailed frame-by-frame timeline ({analysisResult.detected_signs.length} occurrences)
                  </summary>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-stone-200/60">
                    {analysisResult.detected_signs.slice(0, 16).map((det, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-white/70 border border-stone-200 font-mono text-[11px] flex justify-between items-center">
                        <span className="font-bold text-slate-800">{det.sign}</span>
                        <span className="text-emerald-700 font-semibold">{Math.round(det.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Final Translation Result Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-sky-50/30 to-amber-50/20 border border-stone-200 shadow-md space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-skyblue-600" />
                <span>Final Translated Sentence</span>
              </h3>

              {/* Language Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedLang === lang.code
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white/80 hover:bg-white text-slate-600 border border-stone-200'
                    }`}
                  >
                    {lang.name} ({lang.nativeName})
                  </button>
                ))}
              </div>
            </div>

            {/* Translation Output Box */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-500 uppercase tracking-wide">
                  {getLanguageInfo(selectedLang).name} Translation:
                </span>
                <span className="font-mono text-[11px] animate-pulse text-skyblue-600">
                  ⚡ Live NLP Synthesizing...
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-relaxed min-h-[100px]">
                <TypewriterText 
                  text={getCurrentTranslationText() || analysisResult.english_text || 'No text detected'} 
                  progress={videoProgress}
                />
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSpeak}
                  disabled={isSpeaking || !getCurrentTranslationText()}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
                    isSpeaking
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-skyblue-600 hover:bg-skyblue-700 text-white shadow-skyblue-500/20'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeaking ? 'Speaking...' : '🔊 Speak Translation'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm bg-white hover:bg-stone-50 text-slate-700 border border-stone-200 transition-all shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>📋 Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm bg-stone-100 hover:bg-stone-200 text-slate-700 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>↻ Analyze Again</span>
              </button>
            </div>
          </div>

          {/* Telemetry Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-2xl glass-panel border border-stone-200/80">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Total Video Frames</span>
              <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">{analysisResult.total_frames}</p>
            </div>
            <div className="p-3.5 rounded-2xl glass-panel border border-stone-200/80">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Sampled Frames</span>
              <p className="text-lg font-bold text-sky-700 font-mono mt-0.5">{analysisResult.sampled_frames}</p>
            </div>
            <div className="p-3.5 rounded-2xl glass-panel border border-stone-200/80">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Hands Detected</span>
              <p className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{analysisResult.hands_detected_frames}</p>
            </div>
            <div className="p-3.5 rounded-2xl glass-panel border border-stone-200/80">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Processing Time</span>
              <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">{analysisResult.processing_time_sec}s</p>
            </div>
          </div>

        </div>
      )}
        </div>
      </div>

    </div>
  );
};
