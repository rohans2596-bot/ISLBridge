import { SupportedLanguage, getLanguageInfo } from '../utils/tamilTranslations';

export class TTSService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static voices: SpeechSynthesisVoice[] = [];
  private static autoSpeakEnabled: boolean = true;
  private static lastSpokenText: string = '';

  static init() {
    if (!this.synth) return;
    const loadVoices = () => {
      this.voices = this.synth?.getVoices() || [];
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  static setAutoSpeak(enabled: boolean) {
    this.autoSpeakEnabled = enabled;
  }

  static getAutoSpeak(): boolean {
    return this.autoSpeakEnabled;
  }

  // BCP-47 language tag mapping for Indian languages
  private static getLangTag(lang: SupportedLanguage): string {
    const map: Record<SupportedLanguage, string> = {
      'en': 'en-IN',
      'ta': 'ta-IN',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
    };
    return map[lang] || 'en-IN';
  }

  // Find the best matching voice for a language
  private static findVoice(lang: SupportedLanguage): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.voices = this.synth?.getVoices() || [];
    }

    const langTag = this.getLangTag(lang);
    const langPrefix = langTag.split('-')[0]; // 'ta', 'hi', etc.

    // Priority: exact match → prefix match → Google voice → any matching
    const exactMatch = this.voices.find(v => v.lang === langTag);
    if (exactMatch) return exactMatch;

    const prefixMatch = this.voices.find(v => v.lang.startsWith(langPrefix));
    if (prefixMatch) return prefixMatch;

    const googleMatch = this.voices.find(
      v => v.lang.startsWith(langPrefix) && v.name.includes('Google')
    );
    if (googleMatch) return googleMatch;

    // For English, pick a natural-sounding default
    if (lang === 'en') {
      const engVoice = this.voices.find(
        v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.default)
      );
      if (engVoice) return engVoice;
    }

    return null;
  }

  static speak(
    text: string,
    language: SupportedLanguage = 'en',
    options?: { rate?: number; pitch?: number; onEnd?: () => void }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        console.warn('Speech synthesis not supported in this browser environment');
        resolve();
        return;
      }

      // Cancel previous pending speech
      this.synth.cancel();

      if (!text || text.trim() === '') {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate || 0.95;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = 1.0;

      // Set the language tag
      utterance.lang = this.getLangTag(language);

      // Find and set the best voice
      const voice = this.findVoice(language);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (options?.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('TTS error:', e);
        resolve(); // resolve anyway to avoid hanging UI
      };

      this.lastSpokenText = text;
      this.synth.speak(utterance);
    });
  }

  /** Auto-speak: only speaks if the text is different from last spoken text */
  static autoSpeak(text: string, language: SupportedLanguage = 'en'): void {
    if (!this.autoSpeakEnabled) return;
    if (!text || text.trim() === '' || text === '—') return;
    if (text === this.lastSpokenText) return;
    // Don't speak if already speaking
    if (this.synth?.speaking) return;

    this.speak(text, language, { rate: 0.9 }).catch(() => {});
  }

  static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  static isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  static getAvailableVoicesForLanguage(lang: SupportedLanguage): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.voices = this.synth?.getVoices() || [];
    }
    const prefix = this.getLangTag(lang).split('-')[0];
    return this.voices.filter(v => v.lang.startsWith(prefix));
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  TTSService.init();
}
