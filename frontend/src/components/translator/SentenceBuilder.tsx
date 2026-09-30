import React, { useState, useEffect, useRef } from 'react';
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
  Space,
  Languages,
  Mic,
  MicOff
} from 'lucide-react';
import { SupportedLanguage, LANGUAGES, SIGN_SENTENCES, getLanguageInfo } from '../../utils/tamilTranslations';
import { TTSService } from '../../services/tts';

interface SentenceBuilderProps {
  accumulatedSigns: string[];
  englishSentence: string;
  tamilSentence: string;
  isSpeaking: boolean;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  onSpeak: (text: string, lang?: SupportedLanguage) => void;
  onStopSpeak: () => void;
  onUndo: () => void;
  onAddSpace: () => void;
  onClear: () => void;
  onSaveSession: () => Promise<any>;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
}

// Get translation for all languages based on the last deduplicated sign
function getMultiLangTranslations(signs: string[]): Record<SupportedLanguage, string> {
  const defaults: Record<SupportedLanguage, string> = { en: '', ta: '', hi: '', te: '', kn: '', ml: '' };
  if (signs.length === 0) return defaults;

  // Deduplicate
  const deduped: string[] = [];
  for (const s of signs) {
    const upper = s.trim().toUpperCase();
    if (upper && (!deduped.length || deduped[deduped.length - 1] !== upper)) {
      deduped.push(upper);
    }
  }

  if (deduped.length === 1) {
    const entry = SIGN_SENTENCES[deduped[0]];
    if (entry) return entry as Record<SupportedLanguage, string>;
  }

  // For multi-sign, combine individual translations per language
  const result = { ...defaults };
  for (const lang of ['en', 'ta', 'hi', 'te', 'kn', 'ml'] as SupportedLanguage[]) {
    result[lang] = deduped.map(s => {
      const e = SIGN_SENTENCES[s];
      return e ? e[lang] : s;
    }).join(' ');
  }
  return result;
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
  autoSpeak,
  onToggleAutoSpeak,
}) => {
  const [viewMode, setViewMode] = useState<'natural' | 'raw'>('natural');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const prevSignCountRef = useRef(0);

  const rawSentence = accumulatedSigns.join(' ');
  const multiLang = getMultiLangTranslations(accumulatedSigns);

  // Get the sentence to display for the current language
  const getCurrentSentence = (lang: SupportedLanguage): string => {
    if (lang === 'en') return englishSentence || multiLang.en || rawSentence;
    if (lang === 'ta') return tamilSentence || multiLang.ta;
    return multiLang[lang] || '';
  };

  const currentActiveSentence = viewMode === 'natural' ? getCurrentSentence(language) : rawSentence;

  // Auto-speak when a new sign is added
  useEffect(() => {
    if (accumulatedSigns.length > prevSignCountRef.current && accumulatedSigns.length > 0) {
      const textToSpeak = getCurrentSentence(language);
      if (textToSpeak && autoSpeak) {
        TTSService.autoSpeak(textToSpeak, language);
      }
    }
    prevSignCountRef.current = accumulatedSigns.length;
  }, [accumulatedSigns.length, language, autoSpeak]);

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
      const textToSpeak = getCurrentSentence(language);
      onSpeak(textToSpeak, language);
    }
  };

  const langInfo = getLanguageInfo(language);

  return (
    <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-sm">
      
      {/* Header with Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Sentence Builder
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-Speak Toggle */}
          <button
            onClick={onToggleAutoSpeak}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              autoSpeak
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-stone-50 border-stone-200 text-stone-400'
            }`}
            title={autoSpeak ? 'Auto-speak is ON' : 'Auto-speak is OFF'}
          >
            {autoSpeak ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span className="text-[10px]">Auto</span>
          </button>

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

      {/* Multi-Language Translation Output */}
      <div className="p-4 rounded-2xl bg-white/90 border border-stone-200 space-y-2.5 shadow-2xs">
        
        {/* English - always visible */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
            🇬🇧 English:
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-900 min-h-[28px] tracking-tight">
            {englishSentence || multiLang.en || (accumulatedSigns.length > 0 ? rawSentence : '—')}
          </p>
        </div>

        {/* Tamil */}
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[10px] font-mono text-amber-700 uppercase tracking-wider block font-semibold">
            🇮🇳 தமிழ் (Tamil):
          </span>
          <p className="text-base sm:text-lg font-bold text-amber-900 min-h-[24px]">
            {tamilSentence || multiLang.ta || '—'}
          </p>
        </div>

        {/* Hindi */}
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[10px] font-mono text-orange-700 uppercase tracking-wider block font-semibold">
            🇮🇳 हिन्दी (Hindi):
          </span>
          <p className="text-base sm:text-lg font-bold text-orange-900 min-h-[24px]">
            {multiLang.hi || '—'}
          </p>
        </div>

        {/* Telugu */}
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-wider block font-semibold">
            🇮🇳 తెలుగు (Telugu):
          </span>
          <p className="text-base sm:text-lg font-bold text-emerald-900 min-h-[24px]">
            {multiLang.te || '—'}
          </p>
        </div>

        {/* Kannada */}
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[10px] font-mono text-violet-700 uppercase tracking-wider block font-semibold">
            🇮🇳 ಕನ್ನಡ (Kannada):
          </span>
          <p className="text-base sm:text-lg font-bold text-violet-900 min-h-[24px]">
            {multiLang.kn || '—'}
          </p>
        </div>

        {/* Malayalam */}
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[10px] font-mono text-rose-700 uppercase tracking-wider block font-semibold">
            🇮🇳 മലയാളം (Malayalam):
          </span>
          <p className="text-base sm:text-lg font-bold text-rose-900 min-h-[24px]">
            {multiLang.ml || '—'}
          </p>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        
        {/* Left Side: Speech Button + Language Selector */}
        <div className="flex items-center gap-2 flex-wrap">
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
            <span>{isSpeaking ? 'Stop' : `Speak`}</span>
          </button>

          {/* Multi-Language Selector */}
          <div className="flex bg-white/90 rounded-xl p-0.5 border border-stone-200 text-xs shadow-2xs flex-wrap gap-0.5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  language === lang.code
                    ? `${lang.bgColor} text-white shadow-xs`
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title={`${lang.name} (${lang.nativeName})`}
              >
                {lang.nativeName.length > 6 ? lang.name.slice(0, 2).toUpperCase() : lang.nativeName}
              </button>
            ))}
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
