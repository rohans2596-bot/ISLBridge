import React from 'react';
import { Settings, Sliders, Volume2, ShieldCheck, Eye, Sparkles, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useTheme();

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 flex items-center gap-3.5 shadow-md">
        <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 shadow-sm">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">
            Accessibility &amp; System Settings
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure visual accessibility, recognition thresholds, speech rates, and privacy preferences.
          </p>
        </div>
      </div>

      {/* 1. Accessibility Controls */}
      <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3">
          <Eye className="w-4 h-4 text-sky-700" />
          <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Visual &amp; Display Accessibility
          </h3>
        </div>

        {/* Text Size */}
        <div className="space-y-2">
          <label className="text-xs text-slate-700 font-semibold block">Interface Text Size</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'sm', label: 'Small (14px)' },
              { id: 'md', label: 'Medium (16px)' },
              { id: 'lg', label: 'Large (18px)' },
              { id: 'xl', label: 'Extra Large (20px)' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => updateSettings({ textSize: item.id as any })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  settings.textSize === item.id
                    ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm shadow-sky-500/30'
                    : 'bg-white/80 border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-semibold text-slate-900 block">High Contrast Mode</span>
            <span className="text-[11px] text-slate-500">
              Increases background black level and edge contrast for enhanced legibility.
            </span>
          </div>
          <button
            onClick={() => updateSettings({ highContrast: !settings.highContrast })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              settings.highContrast ? 'bg-sky-600' : 'bg-stone-300'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              settings.highContrast ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-semibold text-slate-900 block">Reduce Animations</span>
            <span className="text-[11px] text-slate-500">
              Disables pulsing ambient effects and transitions for motion sensitivity.
            </span>
          </div>
          <button
            onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              settings.reducedMotion ? 'bg-sky-600' : 'bg-stone-300'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* 2. AI Inference & Camera Parameters */}
      <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3">
          <Sliders className="w-4 h-4 text-sky-700" />
          <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Recognition &amp; Camera Thresholds
          </h3>
        </div>

        {/* Confidence Threshold */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-700 font-semibold">Minimum Confirmation Confidence</span>
            <span className="font-mono text-sky-700 font-bold">
              {(settings.confidenceThreshold * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.50"
            max="0.95"
            step="0.05"
            value={settings.confidenceThreshold}
            onChange={e => updateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
            className="w-full accent-sky-600"
          />
          <p className="text-[11px] text-slate-500">
            Predictions below this threshold are categorized as uncertain and will not auto-commit to the sentence builder.
          </p>
        </div>

        {/* Camera Resolution Preference */}
        <div className="space-y-2 pt-2">
          <label className="text-xs text-slate-700 font-semibold block">Preferred Camera Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '480p', label: '480p (Fastest)' },
              { id: '720p', label: '720p HD (Balanced)' },
              { id: '1080p', label: '1080p Full HD' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => updateSettings({ cameraResolution: item.id as any })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  settings.cameraResolution === item.id
                    ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm shadow-sky-500/30'
                    : 'bg-white/80 border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Text-to-Speech Settings */}
      <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-md">
        <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3">
          <Volume2 className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            Speech Synthesis (TTS) Voice Controls
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span className="font-medium">Speech Rate</span>
              <span className="font-mono text-emerald-700 font-bold">{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.speechRate}
              onChange={e => updateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span className="font-medium">Voice Pitch</span>
              <span className="font-mono text-emerald-700 font-bold">{settings.speechPitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.speechPitch}
              onChange={e => updateSettings({ speechPitch: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
