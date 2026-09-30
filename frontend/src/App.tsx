import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { TranslatorPage } from './pages/TranslatorPage';
import { DemoPage } from './pages/DemoPage';
import { TrainingPage } from './pages/TrainingPage';
import { DatasetPage } from './pages/DatasetPage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { ApiService } from './services/api';
import { SupportedLanguage } from './utils/tamilTranslations';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [language, setLanguage] = useState<SupportedLanguage>('ta');
  const [modelReady, setModelReady] = useState<boolean>(true);

  // Periodic Backend Health Check
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const health = await ApiService.checkHealth();
        setModelReady(health.model_loaded);
      } catch (e) {
        // In local standalone mode, keep ready state
        setModelReady(true);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-slate-900 font-sans selection:bg-skyblue-500/25 selection:text-skyblue-900 relative overflow-x-hidden">
      
      {/* Background Ambient Sky Blue & Warm Ochre / Linen Lighting on Beige White */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[650px] h-[650px] bg-skyblue-400/12 rounded-full blur-[140px] opacity-75" />
        <div className="absolute top-[30%] right-[-5%] w-[550px] h-[550px] bg-amber-400/10 rounded-full blur-[150px] opacity-65" />
        <div className="absolute bottom-[5%] left-[20%] w-[600px] h-[600px] bg-skyblue-200/20 rounded-full blur-[160px] opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-skyblue-100/30 via-transparent to-transparent opacity-80" />
      </div>

      {/* Top Sticky Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        modelReady={modelReady}
      />

      {/* Main Page Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        {activeTab === 'landing' && (
          <LandingPage
            onStartTranslating={() => setActiveTab('translator')}
            onOpenDemo={() => setActiveTab('demo')}
            onOpenTraining={() => setActiveTab('training')}
            modelReady={modelReady}
          />
        )}

        {activeTab === 'translator' && (
          <TranslatorPage
            language={language}
            setLanguage={setLanguage}
            modelReady={modelReady}
          />
        )}

        {activeTab === 'demo' && (
          <DemoPage
            language={language}
            setLanguage={setLanguage}
            modelReady={modelReady}
          />
        )}

        {activeTab === 'training' && (
          <TrainingPage />
        )}

        {activeTab === 'dataset' && (
          <DatasetPage />
        )}

        {activeTab === 'models' && (
          <ModelEvaluationPage />
        )}

        {activeTab === 'history' && (
          <HistoryPage />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}

        {activeTab === 'about' && (
          <AboutPage />
        )}
      </main>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}

export default App;
