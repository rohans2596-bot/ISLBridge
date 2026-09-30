import React from 'react';
import { BookOpen, Layers, Globe, Sparkles, Terminal } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="p-8 rounded-3xl glass-panel-skyblue border border-sky-200/80 space-y-4 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 text-xs font-mono text-sky-800 font-bold">
          <BookOpen className="w-4 h-4 text-sky-600" />
          <span>TECHNICAL ARCHITECTURE &amp; SPECIFICATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-sans tracking-tight">
          About <span className="text-sky-700">ISLBridge</span> AI System
        </h1>
        <p className="text-sm text-slate-700 leading-relaxed max-w-2xl font-normal">
          ISLBridge is a high-performance, AI-driven accessibility platform utilizing computer vision and edge-optimized machine learning to recognize Indian Sign Language gestures in real-time, bridging communication barriers through natural text and speech synthesis.
        </p>
      </div>

      {/* ISL vs ASL Comparison */}
      <div className="p-7 rounded-3xl glass-panel border border-stone-200/80 space-y-5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-sans">
            Indian Sign Language (ISL) vs American Sign Language (ASL)
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          While ASL is largely single-handed for fingerspelling, ISL relies extensively on two-handed bilateral interactions, distinctive knuckle tapping, chest/chin proximity, and cultural idioms. ISLBridge’s 222-dimensional feature extractor explicitly tracks inter-hand spatial relations and rotational invariance.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 shadow-xs">
            <span className="font-bold text-sky-800 font-mono block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" /> ISL Engineered Features:
            </span>
            <ul className="space-y-1.5 text-slate-700 list-disc list-inside">
              <li>Two-hand dominant bilateral gestures</li>
              <li>Wrist-relative coordinate normalization</li>
              <li>Multilingual translation layer (English &amp; தமிழ்)</li>
              <li>Dynamic temporal voting &amp; cooldown debounce</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 shadow-xs">
            <span className="font-bold text-slate-600 font-mono block mb-2">Standard ASL Tools:</span>
            <ul className="space-y-1.5 text-slate-500 list-disc list-inside">
              <li>Predominantly single-handed alphabet models</li>
              <li>Rigid pixel CNNs sensitive to backgrounds</li>
              <li>English-only TTS outputs</li>
              <li>No built-in live custom training mode</li>
            </ul>
          </div>
        </div>
      </div>

      {/* REST API Endpoints Overview */}
      <div className="p-7 rounded-3xl glass-panel border border-stone-200/80 space-y-5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-xs">
            <Terminal className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-sans">
            FastAPI Backend Endpoints Reference
          </h3>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {[
            { method: 'POST', path: '/api/predict', desc: 'Predict ISL sign from 21 MediaPipe coordinates' },
            { method: 'WS', path: '/ws/translate', desc: 'Bidirectional streaming for ultra-low latency real-time inference' },
            { method: 'POST', path: '/api/translate-sentence', desc: 'Synthesizes natural English & Tamil sentences' },
            { method: 'GET', path: '/api/signs', desc: 'Returns all configured vocabulary classes' },
            { method: 'POST', path: '/api/dataset/sample', desc: 'Saves user-recorded landmark samples to database' },
            { method: 'POST', path: '/api/model/train', desc: 'Retrains RandomForest/MLP and evaluates test split' },
            { method: 'GET', path: '/api/model/metrics', desc: 'Calculates true test accuracy, precision, recall & F1' },
            { method: 'POST', path: '/api/translation/save', desc: 'Saves translation session and logs to database' },
            { method: 'GET', path: '/api/analytics', desc: 'Returns usage distribution and top recognized signs' },
          ].map((ep, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 hover:border-sky-300 transition-colors gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider ${
                  ep.method === 'POST' ? 'bg-sky-50 text-sky-800 border border-sky-200' : ep.method === 'WS' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {ep.method}
                </span>
                <span className="text-slate-900 font-semibold">{ep.path}</span>
              </div>
              <span className="text-[11px] text-slate-600 font-sans font-medium">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Future Extensibility */}
      <div className="p-7 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-xs">
            <Globe className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-sans">Future Roadmap &amp; Scope</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The modular design of ISLBridge allows seamless scaling and integration of:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 flex items-center gap-2 shadow-xs">
            <span className="text-sky-600 font-bold">✓</span> Regional Indian Languages: Hindi, Telugu, Malayalam, Kannada
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 flex items-center gap-2 shadow-xs">
            <span className="text-sky-600 font-bold">✓</span> MediaPipe Holistic (Face mesh &amp; shoulder pose tracking)
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 flex items-center gap-2 shadow-xs">
            <span className="text-sky-600 font-bold">✓</span> Temporal Transformer / LSTM for continuous signing
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 flex items-center gap-2 shadow-xs">
            <span className="text-sky-600 font-bold">✓</span> Edge Deployment via ONNX Runtime &amp; WebAssembly
          </div>
        </div>
      </div>

    </div>
  );
};
