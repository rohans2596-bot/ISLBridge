import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, Layers, RefreshCw, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { ISLSign } from '../types/isl';

export const DatasetPage: React.FC = () => {
  const [signs, setSigns] = useState<ISLSign[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchDataset = async () => {
    setIsLoading(true);
    try {
      const [signsList, statsData] = await Promise.all([
        ApiService.getSigns(),
        ApiService.getDatasetStats().catch(() => null)
      ]);
      setSigns(signsList);
      setStats(statsData);
    } catch (e) {
      console.warn('Failed to load dataset:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const filtered = signs.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">
              Dataset Management
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Inspect configured ISL sign vocabulary, recorded sample counts, and feature distributions.
            </p>
          </div>
        </div>

        <button
          onClick={fetchDataset}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 border border-stone-200 text-xs text-slate-700 hover:text-slate-900 hover:bg-stone-100 transition-all font-semibold shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wide">Total ISL Classes</span>
          <h3 className="text-3xl font-black text-slate-900 font-mono mt-1">{signs.length}</h3>
        </div>
        <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wide">Custom Captured Samples</span>
          <h3 className="text-3xl font-black text-sky-700 font-mono mt-1">
            {stats?.custom_samples ?? 0}
          </h3>
        </div>
        <div className="p-5 rounded-3xl glass-panel border border-stone-200/80 shadow-sm">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wide">Feature Vector Size</span>
          <h3 className="text-3xl font-black text-emerald-700 font-mono mt-1">222-D</h3>
        </div>
      </div>

      {/* Table & Filter */}
      <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-md">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter signs..."
              className="w-full glass-input text-xs pl-10 pr-3 py-2.5 rounded-2xl"
            />
          </div>
          <span className="text-xs font-mono text-slate-500 font-medium">
            Showing {filtered.length} of {signs.length} signs
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-200/70 bg-white/70">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-mono uppercase bg-stone-100/90 text-slate-600 border-b border-stone-200">
              <tr>
                <th className="p-3.5">Sign Label</th>
                <th className="p-3.5">Display Name</th>
                <th className="p-3.5">Gesture Type</th>
                <th className="p-3.5">Sample Count</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 font-mono">
              {filtered.map(sign => (
                <tr key={sign.id || sign.name} className="hover:bg-sky-50/60 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{sign.name}</td>
                  <td className="p-3.5 text-slate-700 font-sans font-medium">{sign.display_name}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] bg-sky-50 text-sky-800 border border-sky-200 font-medium">
                      {sign.gesture_type}
                    </span>
                  </td>
                  <td className="p-3.5 text-emerald-700 font-bold">{sign.samples_count || 0}</td>
                  <td className="p-3.5">
                    <span className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 text-[11px] max-w-xs truncate font-sans">
                    {sign.description || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
