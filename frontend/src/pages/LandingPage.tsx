import React, { useState } from 'react';
import { 
  Sparkles, 
  Video, 
  Cpu, 
  ShieldCheck, 
  Volume2, 
  Languages, 
  Layers, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Camera, 
  Sliders,
  Award,
  Globe2
} from 'lucide-react';
import { SUPPORTED_ISL_SIGNS, SIGN_CATEGORIES } from '../utils/islSigns';

interface LandingPageProps {
  onStartTranslating: () => void;
  onOpenDemo: () => void;
  onOpenTraining: () => void;
  modelReady: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartTranslating,
  onOpenDemo,
  onOpenTraining,
  modelReady,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSigns = SUPPORTED_ISL_SIGNS.filter(s => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.tamil.includes(searchQuery) ||
                          s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 pb-12 overflow-hidden">
        {/* Ambient Sky Blue & Gold glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-skyblue-400/15 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[300px] bg-amber-400/12 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10 px-4">
          
          {/* AI Status Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 border border-stone-200 text-xs font-mono shadow-xs backdrop-blur-xl">
            <span className={`w-2.5 h-2.5 rounded-full ${modelReady ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-sky-700 font-bold tracking-wide">
              {modelReady ? 'AI ENGINE ONLINE & ACTIVE' : 'AI ENGINE INITIALIZING'}
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-slate-600 font-medium">ISL Intelligent Neural Core</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 font-sans leading-[1.08]">
            Indian Sign Language{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-amber-600 drop-shadow-xs">
              Real-Time AI Bridge
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Empowering frictionless communication. Translates Indian Sign Language gestures in real-time to fluent English and Tamil speech with client-side computer vision.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartTranslating}
              className="glass-btn-primary flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-base transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Video className="w-5 h-5 text-white" />
              <span>Launch Live Translator</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={onOpenDemo}
              className="glass-btn-gold flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-base transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-white" />
              <span>Hackathon Live Demo</span>
            </button>

            <button
              onClick={onOpenTraining}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-stone-50 text-slate-700 hover:text-slate-900 text-sm font-semibold border border-stone-200 shadow-xs backdrop-blur-md transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>Training Studio</span>
            </button>
          </div>

          {/* Quick Metrics Bar with Glassmorphic Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
            <div className="p-4 rounded-2xl glass-panel border border-stone-200/80 hover:border-sky-300 transition-all">
              <span className="text-3xl font-black text-slate-900 font-mono block">32+</span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">Trained ISL Signs</span>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-stone-200/80 hover:border-sky-300 transition-all">
              <span className="text-3xl font-black text-emerald-600 font-mono block">&lt; 30ms</span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">Inference Speed</span>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-stone-200/80 hover:border-sky-300 transition-all">
              <span className="text-3xl font-black text-sky-700 font-mono block">21</span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">3D Hand Landmarks</span>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-stone-200/80 hover:border-amber-300 transition-all">
              <span className="text-3xl font-black text-amber-700 font-mono block">EN + தமிழ்</span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">Bilingual Neural Audio</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. THE PROBLEM & ARCHITECTURE SECTION */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="p-8 rounded-3xl glass-panel border border-stone-200/80 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-sky-800 uppercase tracking-wider bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-200">
                Bridging Accessibility
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                Why Indian Sign Language (ISL) Needs Dedicated AI Architecture
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Most sign-language AI tools are engineered exclusively around American Sign Language (ASL). Over 18 million Deaf and hard-of-hearing individuals in India rely on Indian Sign Language (ISL), which features distinct two-handed configurations, unique facial postures, and regional grammars.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                ISLBridge is designed from the ground up to recognize ISL-specific hand kinematics, providing real-time text and speech synthesis in English and regional Indian languages like Tamil.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-500 font-mono border-t border-stone-200">
              <Globe2 className="w-4 h-4 text-sky-600" />
              <span>Designed specifically for Indian Sign Language</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl glass-panel-skyblue border border-sky-300/60 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                <h3 className="text-base font-bold text-slate-900 font-mono uppercase tracking-wider">
                  ISLBridge Neural Pipeline
                </h3>
              </div>
              <ul className="space-y-4 text-xs text-slate-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900">Landmark-Based Computer Vision:</strong> MediaPipe 21-point tracking extracts wrist-relative invariant coordinates rather than raw pixel data.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900">Two-Hand Ambidextrous Support:</strong> Left hand, right hand, or dual-hand gesture classification with 256-dimensional feature representations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900">Temporal Prediction Smoothing:</strong> Fast-consensus voting and debounce window eliminate jitter and ensure smooth livestream performance.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900">In-Browser Training Studio:</strong> Collect custom samples and retrain the model directly on device with zero telemetry loss.</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-white/90 border border-sky-200 flex items-center justify-between text-xs text-slate-600">
              <span>Client-Side Privacy</span>
              <span className="text-sky-800 font-mono font-bold">100% On-Device Inference</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (4-STEP PIPELINE) */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-sky-800 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            System Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How ISLBridge Translates in Real-Time
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              title: 'Camera & Landmark Tracking',
              desc: 'Standard webcam captures video frames. MediaPipe identifies 21 3D joint landmarks for both hands in real time.',
              icon: Camera,
            },
            {
              step: '02',
              title: 'Coordinate Normalization',
              desc: 'Landmarks are centered on the wrist and scaled by palm span, making inference invariant to hand size or distance.',
              icon: Sliders,
            },
            {
              step: '03',
              title: 'ML Classification & Smoothing',
              desc: 'Trained Random Forest model classifies gesture with confidence filtering and temporal debounce.',
              icon: Cpu,
            },
            {
              step: '04',
              title: 'Sentence & Voice Output',
              desc: 'Constructs natural sentences in English and Tamil, spoken aloud via browser Web Speech synthesis.',
              icon: Volume2,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-3 relative overflow-hidden group hover:border-sky-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-stone-300 group-hover:text-sky-300 transition-colors">
                    {item.step}
                  </span>
                  <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SUPPORTED SIGNS VOCABULARY SHOWCASE */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-700 uppercase tracking-wider">
                Configured Vocabulary
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                {SUPPORTED_ISL_SIGNS.length} Active Signs
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Supported ISL Gesture Library</h2>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search sign or Tamil translation..."
            className="glass-input text-xs px-4 py-2.5 rounded-xl w-full sm:w-72"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {SIGN_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white font-bold shadow-xs border border-sky-600'
                  : 'bg-white border border-stone-200 text-slate-600 hover:text-slate-900 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Signs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredSigns.map(sign => (
            <div
              key={sign.name}
              className="p-4 rounded-2xl glass-panel border border-stone-200/80 hover:border-sky-300 hover:bg-white transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 group-hover:text-sky-700 font-mono transition-colors">
                  {sign.name}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  {sign.tamil}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {sign.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRIVACY & ACCESSIBILITY SECTION */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-10 rounded-3xl glass-panel-glow border border-sky-300 bg-gradient-to-br from-white via-sky-50/50 to-amber-50/30 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-md">
          <div className="space-y-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sky-700 text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Zero-Retention Policy</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Your Camera Feed Stays Completely Private</h3>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-normal">
              Video frames are processed locally in your browser memory to extract 21-point geometric landmarks. Raw camera frames are never saved, recorded, or permanently stored on any remote cloud server.
            </p>
          </div>

          <button
            onClick={onStartTranslating}
            className="glass-btn-primary px-7 py-3.5 rounded-2xl font-black text-xs shadow-md flex-shrink-0 uppercase tracking-wider cursor-pointer"
          >
            Launch Live Camera
          </button>
        </div>
      </section>

    </div>
  );
};
