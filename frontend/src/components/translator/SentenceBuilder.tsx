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
      {accumulatedSigns.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white/60 border border-dashed border-stone-300 text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200 shadow-2xs">
            <Languages className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">Translations Appear Here</p>
          <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
            Perform signs in front of the camera. Instant translations in English, Tamil, Hindi, Telugu, Kannada & Malayalam will accumulate here.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/95 border border-stone-200 space-y-3 shadow-2xs">
          {/* Active / Selected Language Hero Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-sky-50/60 to-amber-50/40 border border-sky-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>{langInfo.flag}</span>
                <span>{langInfo.name} ({langInfo.nativeName})</span>
              </span>
              <span className="text-[9px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-mono font-bold shadow-2xs">
                VOICE TARGET
              </span>
            </div>
            <p className="text-lg font-black text-slate-900 leading-snug">
              {getCurrentSentence(language) || rawSentence}
            </p>
          </div>

          {/* Other Languages in Compact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-100">
            {LANGUAGES.filter(l => l.code !== language).map(l => {
              const transText = l.code === 'en'
                ? (englishSentence || multiLang.en || rawSentence)
                : (l.code === 'ta' ? (tamilSentence || multiLang.ta) : multiLang[l.code]);

              return (
                <div key={l.code} className="p-2 rounded-lg bg-stone-50 border border-stone-200/80 text-left">
                  <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                    {l.flag} {l.name}:
                  </span>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5" title={transText}>
                    {transText || '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Toolbar & Language Selector */}
      <div className="space-y-2 pt-1">
        {/* Multi-Language Selector Tabs (6-column grid) */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold mb-1">
            Target Voice & Translation Language
          </span>
          <div className="grid grid-cols-6 gap-1 w-full bg-stone-100/90 p-1 rounded-xl border border-stone-200 text-xs shadow-2xs">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all truncate text-center cursor-pointer ${
                  language === lang.code
                    ? `${lang.bgColor} text-white shadow-xs`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title={`${lang.name} (${lang.nativeName})`}
              >
                {lang.nativeName.length > 5 ? lang.nativeName.slice(0, 5) : lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Speak Button */}
          <button
            onClick={handleSpeakClick}
            disabled={accumulatedSigns.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
              isSpeaking
                ? 'bg-rose-600 text-white animate-pulse'
                : 'glass-btn-primary'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Stop' : 'Speak'}</span>
          </button>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-1">
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

    </div>
  );
};
