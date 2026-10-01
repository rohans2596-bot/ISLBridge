import React, { useState } from 'react';
import { 
  Sparkles, 
  Video, 
  Play, 
  Database, 
  Cpu, 
  History, 
  BarChart3, 
  Settings, 
  BookOpen, 
  Menu, 
  X,
  Layers,
  Film
} from 'lucide-react';
import { SupportedLanguage } from '../../utils/tamilTranslations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  modelReady: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  modelReady
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Home', icon: Sparkles },
    { id: 'translator', label: 'Translator', icon: Video, badge: 'Live' },
    { id: 'video-translator', label: 'Video Translator', icon: Film, badge: 'New' },
    { id: 'demo', label: 'Demo Mode', icon: Play, highlight: true },
    { id: 'training', label: 'Training', icon: Cpu },
    { id: 'dataset', label: 'Dataset', icon: Database },
    { id: 'models', label: 'Models', icon: Layers },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 bg-[#FAF7F2]/90 backdrop-blur-2xl transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Product Name */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-skyblue-400 via-skyblue-600 to-sky-800 p-[1.5px] shadow-md shadow-skyblue-500/20 group-hover:shadow-skyblue-400/40 transition-all duration-300">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center border border-white/80">
                <span className="text-xl font-black bg-gradient-to-r from-skyblue-600 to-sky-800 bg-clip-text text-transparent">
                  ISL
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900 font-sans">
                  ISL<span className="text-skyblue-600">Bridge</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-skyblue-50 text-skyblue-700 border border-skyblue-200 shadow-xs">
                  AI 2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">
                Indian Sign Language Real-Time AI
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-skyblue-700 bg-skyblue-50 border border-skyblue-300 shadow-xs font-bold'
                      : item.highlight
                      ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/70 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-skyblue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-skyblue-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: AI Status & Language Toggle */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live AI Status Dot */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-stone-200 text-xs backdrop-blur-md shadow-xs">
              <span className={`w-2 h-2 rounded-full ${modelReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-mono text-slate-700 font-medium">
                {modelReady ? 'AI READY' : 'INITIALIZING'}
              </span>
            </div>

            {/* Language Selector Button */}
            <div className="flex items-center bg-white/80 rounded-xl p-0.5 border border-stone-200 text-xs backdrop-blur-md shadow-xs">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-skyblue-600 to-sky-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  language === 'ta'
                    ? 'bg-gradient-to-r from-ochre-600 to-amber-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white border border-stone-200 text-slate-700 hover:text-slate-900 backdrop-blur-md shadow-xs"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#FAF7F2]/98 border-b border-stone-200 px-4 pt-2 pb-6 space-y-1 backdrop-blur-2xl shadow-lg">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    isActive
                      ? 'text-skyblue-700 bg-skyblue-50 border border-skyblue-300 font-bold'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-skyblue-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-200">
            <span className="text-xs text-slate-500 font-medium">Language:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${language === 'en' ? 'bg-skyblue-600 text-white' : 'bg-white text-slate-600 border border-stone-200'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${language === 'ta' ? 'bg-ochre-600 text-white' : 'bg-white text-slate-600 border border-stone-200'}`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
