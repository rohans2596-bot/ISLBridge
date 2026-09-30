import React from 'react';
import { ShieldCheck, Eye, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-stone-200/80 bg-[#FAF7F2]/90 backdrop-blur-xl py-8 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-skyblue-50 border border-skyblue-300 flex items-center justify-center text-skyblue-700 font-black text-xs shadow-xs">
              ISL
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              ISLBridge <span className="text-skyblue-600">AI</span>
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline font-normal">
              — Breaking Communication Barriers with Indian Sign Language
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">100% Client-Side Privacy</span>
            </div>
            <div className="flex items-center gap-1.5 text-skyblue-700">
              <Eye className="w-4 h-4 text-skyblue-600" />
              <span className="font-medium">MediaPipe 21 Landmarks</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="font-medium">English &amp; தமிழ் Synthesis</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            Engineered with <Heart className="w-3.5 h-3.5 text-sky-500 fill-sky-500" /> for Accessibility
          </div>

        </div>
      </div>
    </footer>
  );
};
