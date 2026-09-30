import { useState, useEffect } from 'react';
import { AccessibilitySettings } from '../types/isl';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textSize: 'md',
  highContrast: false,
  reducedMotion: false,
  confidenceThreshold: 0.70,
  speechRate: 1.0,
  speechPitch: 1.0,
  cameraResolution: '720p',
  storeConsent: false,
};

export function useTheme() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('islbridge_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('islbridge_settings', JSON.stringify(settings));

    // Update body classes for accessibility
    const body = document.body;
    
    // High contrast
    if (settings.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Text size
    body.classList.remove('text-size-sm', 'text-size-md', 'text-size-lg', 'text-size-xl');
    body.classList.add(`text-size-${settings.textSize}`);

    // Reduced motion
    if (settings.reducedMotion) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }
  }, [settings]);

  const updateSettings = (partial: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return { settings, updateSettings };
}
