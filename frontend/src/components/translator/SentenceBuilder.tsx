import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  BookmarkCheck, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Space
} from 'lucide-react';

interface SentenceBuilderProps {
  accumulatedSigns: string[];
  englishSentence: string;
  tamilSentence: string;
  isSpeaking: boolean;
  language: 'en' | 'ta';
  setLanguage: (lang: 'en' | 'ta') => void;
  onSpeak: (text: string, lang?: 'en' | 'ta') => void;
  onStopSpeak: () => void;
  onUndo: () => void;
  onAddSpace: () => void;
  onClear: () => void;
  onSaveSession: () => Promise<any>;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  accumulatedSigns,
  englishSentence,
  tamilSentence,
  isSpeaking,
  language,
  setLanguage,
  onSpeak,
  onStopSpeak,
  onUndo,
  onAddSpace,
  onClear,
  onSaveSession,
}) => {
  const [viewMode, setViewMode] = useState<'natural' | 'raw'>('natural');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const rawSentence = accumulatedSigns.join(' ');
  const currentActiveSentence = viewMode === 'natural' ? (language === 'ta' ? tamilSentence : englishSentence) : rawSentence;

  const handleCopy = () => {
    if (!currentActiveSentence) return;
    navigator.clipboard.writeText(currentActiveSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (accumulatedSigns.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const res = await onSaveSession();
      if (res) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpeakClick = () => {
    if (isSpeaking) {
      onStopSpeak();
    } else {
      const textToSpeak = language === 'ta' 
        ? (tamilSentence || rawSentence) 
        : (englishSentence || rawSentence);
      onSpeak(textToSpeak, language);
    }
  };

  return (
    <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-sm">
      
      {/* Header with Mode Toggle & Language Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Sentence Construction
          </span>
        </div>

        {/* Natural vs Raw Toggle */}
        <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-xl border border-stone-200 text-xs shadow-2xs">
          <span className={`text-[11px] ${viewMode === 'raw' ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
            Raw
          </span>
          <button
            onClick={() => setViewMode(prev => prev === 'natural' ? 'raw' : 'natural')}
            className="text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
          >
            {viewMode === 'natural' ? (
              <ToggleRight className="w-5 h-5 text-sky-600" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-300" />
            )}
          </button>
          <span className={`text-[11px] ${viewMode === 'natural' ? 'text-sky-700 font-bold' : 'text-slate-400'}`}>
            Natural
          </span>
        </div>
      </div>

      {/* Accumulated Sign Badges */}
      <div className="min-h-[52px] p-3 rounded-2xl bg-white/70 border border-stone-200/80 flex flex-wrap items-center gap-1.5 shadow-inner">
        {accumulatedSigns.length === 0 ? (
          <span className="text-xs text-slate-400 italic font-medium">
            Recognized signs will accumulate here automatically...
          </span>
        ) : (
          accumulatedSigns.map((sign, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-sky-600 text-white shadow-xs"
            >
              {sign}
            </span>
          ))
        )}
      </div>

      {/* Translated Output Box */}
      <div className="p-4 rounded-2xl bg-white/90 border border-stone-200 space-y-2.5 shadow-2xs">
        {/* English View */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
            English Translation:
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-900 min-h-[28px] tracking-tight">
            {englishSentence || (accumulatedSigns.length > 0 ? accumulatedSigns.join(' ') : '—')}
          </p>
        </div>

        {/* Tamil View */}
        <div className="pt-2.5 border-t border-stone-200">
          <span className="text-[10px] font-mono text-amber-700 uppercase tracking-wider block font-semibold">
            Tamil Translation (தமிழ்):
          </span>
          <p className="text-base sm:text-lg font-bold text-amber-900 min-h-[28px]">
            {tamilSentence || '—'}
          </p>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        
        {/* Left Side: Speech Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeakClick}
            disabled={accumulatedSigns.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
              isSpeaking
                ? 'bg-rose-600 text-white animate-pulse'
                : 'glass-btn-primary'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Stop' : `Speak (${language === 'ta' ? 'தமிழ்' : 'English'})`}</span>
          </button>

          {/* Language Switch */}
          <div className="flex bg-white/90 rounded-xl p-0.5 border border-stone-200 text-xs shadow-2xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'ta' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Right Side Controls: Undo, Space, Clear, Copy, Save */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onUndo}
            disabled={accumulatedSigns.length === 0}
            className="p-2 rounded-xl bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 text-xs disabled:opacity-40 shadow-2xs cursor-pointer"
            title="Undo last sign"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onAddSpace}
            className="p-2 rounded-xl bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 text-xs shadow-2xs cursor-pointer"
            title="Add space"
          >
            <Space className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClear}
            disabled={accumulatedSigns.length === 0}
            className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs disabled:opacity-40 shadow-2xs cursor-pointer"
            title="Clear all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            disabled={accumulatedSigns.length === 0}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 text-xs disabled:opacity-40 shadow-2xs cursor-pointer"
            title="Copy text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-semibold">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={accumulatedSigns.length === 0 || isSaving}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold disabled:opacity-40 shadow-xs cursor-pointer"
            title="Save session"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span className="text-[11px]">{saved ? 'Saved!' : 'Save'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
