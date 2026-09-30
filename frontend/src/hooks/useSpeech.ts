import { useState, useCallback } from 'react';
import { TTSService } from '../services/tts';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');

  const speak = useCallback(async (text: string, lang?: 'en' | 'ta', options?: { rate?: number; pitch?: number }) => {
    const targetLang = lang || language;
    setIsSpeaking(true);
    try {
      await TTSService.speak(text, targetLang, {
        ...options,
        onEnd: () => setIsSpeaking(false)
      });
    } finally {
      setIsSpeaking(false);
    }
  }, [language]);

  const stop = useCallback(() => {
    TTSService.stop();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    language,
    setLanguage,
    speak,
    stop
  };
}
