import { useState, useCallback } from 'react';
import { TTSService } from '../services/tts';
import { SupportedLanguage } from '../utils/tamilTranslations';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const speak = useCallback(async (text: string, lang?: SupportedLanguage, options?: { rate?: number; pitch?: number }) => {
    setIsSpeaking(true);
    try {
      await TTSService.speak(text, lang || 'en', {
        ...options,
        onEnd: () => setIsSpeaking(false)
      });
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    TTSService.stop();
    setIsSpeaking(false);
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak(prev => {
      const next = !prev;
      TTSService.setAutoSpeak(next);
      return next;
    });
  }, []);

  /** Trigger auto-speak (will only speak if text changed and auto-speak is enabled) */
  const triggerAutoSpeak = useCallback((text: string, lang: SupportedLanguage) => {
    if (!autoSpeak) return;
    TTSService.autoSpeak(text, lang);
  }, [autoSpeak]);

  return {
    isSpeaking,
    autoSpeak,
    speak,
    stop,
    toggleAutoSpeak,
    triggerAutoSpeak,
  };
}
