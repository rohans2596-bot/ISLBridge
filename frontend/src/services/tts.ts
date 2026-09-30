export class TTSService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static voices: SpeechSynthesisVoice[] = [];

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

  static speak(
    text: string,
    language: 'en' | 'ta' = 'en',
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
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;

      // Select matching voice
      if (this.voices.length === 0) {
        this.voices = this.synth.getVoices();
      }

      if (language === 'ta') {
        utterance.lang = 'ta-IN';
        const tamilVoice = this.voices.find(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil') || v.name.toLowerCase().includes('india'));
        if (tamilVoice) utterance.voice = tamilVoice;
      } else {
        utterance.lang = 'en-US';
        const engVoice = this.voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.default));
        if (engVoice) utterance.voice = engVoice;
      }

      utterance.onend = () => {
        if (options?.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('TTS error:', e);
        resolve(); // resolve anyway to avoid hanging UI
      };

      this.synth.speak(utterance);
    });
  }

  static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  static isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  TTSService.init();
}
