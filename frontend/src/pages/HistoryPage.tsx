import React, { useState, useEffect } from 'react';
import { History, Search, Trash2, Volume2, Calendar, Clock, RefreshCw, Bookmark } from 'lucide-react';
import { ApiService } from '../services/api';
import { TranslationSession } from '../types/isl';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { useSpeech } from '../hooks/useSpeech';

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<TranslationSession[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { speak } = useSpeech();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getHistory();
      setSessions(data);
    } catch (e) {
      console.warn('Failed to load translation history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await ApiService.deleteHistory(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.warn('Failed to delete session:', e);
    }
  };

  const filtered = sessions.filter(s =>
    s.final_text.toLowerCase().includes(search.toLowerCase()) ||
    (s.tamil_translation && s.tamil_translation.includes(search)) ||
    (s.raw_signs && s.raw_signs.join(' ').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 shadow-sm">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">
              Translation Session History
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Review recorded sign sequences, reconstructed sentences, timestamps, and average model confidence.
            </p>
          </div>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 border border-stone-200 text-xs text-slate-700 hover:text-slate-900 hover:bg-stone-100 transition-all font-semibold shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl glass-panel border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search saved translations..."
            className="w-full glass-input text-xs pl-10 pr-3 py-2.5 rounded-2xl"
          />
        </div>
        <span className="text-xs font-mono text-slate-500 font-medium">
          {filtered.length} Recorded Sessions
        </span>
      </div>

      {/* History Items List */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel text-center space-y-3 bg-white/80 border border-stone-200/80 shadow-sm">
          <Bookmark className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Translation History Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the Translator or Demo Mode to translate ISL gestures and click "Save Session" to record history.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const dateStr = session.started_at ? new Date(session.started_at).toLocaleString() : 'Recent';
            return (
              <div
                key={session.id}
                className="p-5 rounded-3xl glass-panel border border-stone-200/80 hover:border-sky-300 transition-all space-y-3 shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-900 font-bold">{session.session_id}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {dateStr}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-slate-500 font-mono">{session.signs_count} signs</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ConfidenceBadge confidence={session.average_confidence} size="sm" />
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Raw Sign Sequence Badges */}
                {session.raw_signs && session.raw_signs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {session.raw_signs.map((sign, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono bg-sky-50 text-sky-800 border border-sky-200 font-medium"
                      >
                        {sign}
                      </span>
                    ))}
                  </div>
                )}

                {/* English & Tamil Output */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">English:</span>
                      <p className="text-sm font-bold text-slate-900">{session.final_text}</p>
                    </div>
                    <button
                      onClick={() => speak(session.final_text, 'en')}
                      className="p-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 shadow-xs transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {session.tamil_translation && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] font-mono text-amber-800 uppercase font-bold block">தமிழ் (Tamil):</span>
                        <p className="text-sm font-bold text-amber-950">{session.tamil_translation}</p>
                      </div>
                      <button
                        onClick={() => speak(session.tamil_translation || '', 'ta')}
                        className="p-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 shadow-xs transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
