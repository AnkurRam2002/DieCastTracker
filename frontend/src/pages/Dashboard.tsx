import React, { useEffect, useState, useMemo } from 'react';
import { dataService } from '../services/api';
import { Table } from '../components/Table';
import { EditModelModal } from '../components/EditModelModal';
import { Search, SlidersHorizontal, Car, TrendingUp, Hash, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'hotwheels' | 'others'>('hotwheels');
  
  // Filters
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mainSeriesFilter, setMainSeriesFilter] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Edit/Delete State
  const [editingModel, setEditingModel] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dataRes, statsRes] = await Promise.all([
        dataService.getAll(),
        dataService.getStats(),
      ]);
      if (dataRes.success) {
        setData(dataRes.data);
      }
      if (statsRes.success) setStats(statsRes.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (serialNumber: number) => {
    if (!window.confirm(`Are you sure you want to delete model #${serialNumber}?`)) return;
    
    try {
      const res = await dataService.deleteModel(serialNumber);
      if (res.success) {
        setFeedback({ type: 'success', msg: res.message || 'Model deleted successfully.' });
        loadData();
      } else {
        setFeedback({ type: 'error', msg: res.error || 'Failed to delete model.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.response?.data?.error || 'Error deleting model.' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleUpdate = async (updatePkg: any) => {
    try {
      const res = await dataService.updateModel(updatePkg);
      if (res.success) {
        setFeedback({ type: 'success', msg: res.message || 'Model updated successfully.' });
        loadData();
      } else {
        throw new Error(res.error || 'Failed to update');
      }
    } catch (err: any) {
      throw new Error(err?.response?.data?.error || 'Error updating model.');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const displayColumns = useMemo(() => {
    if (activeTab === 'others') {
      return ['S.No', 'Model Name', 'Brand', 'Series', 'Subseries'];
    }
    return ['S.No', 'Model Name', 'Subseries'];
  }, [activeTab]);

  const filtered = useMemo(() => {
    let result = [...data];

    // 1. Tab Filtering
    if (activeTab === 'hotwheels') {
      result = result.filter(row => row['Brand'] === 'Hot Wheels');
    } else {
      result = result.filter(row => row['Brand'] !== 'Hot Wheels');
      if (brandFilter) {
        result = result.filter(row => row['Brand'] === brandFilter);
      }
    }

    // 2. Filter by Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(q))
      );
    }

    // 3. Filter by Series
    if (mainSeriesFilter) {
      result = result.filter(row => row['Series'] === mainSeriesFilter);
    }

    // 4. Filter by Subseries
    if (seriesFilter) {
      result = result.filter(row => row['Subseries'] === seriesFilter);
    }

    // 5. Sort
    result.sort((a, b) => {
      const valA = a['S.No'] || 0;
      const valB = b['S.No'] || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [data, activeTab, brandFilter, search, mainSeriesFilter, seriesFilter, sortOrder]);

  const totalModels = stats?.total_models ?? data.length;

  // Extract unique filter options from stats if available, otherwise from data
  const mainSeriesOptions = useMemo(() => {
    if (stats?.column_info?.['Series']?.top_values) {
      return Object.keys(stats.column_info['Series'].top_values).sort();
    }
    return Array.from(new Set(data.map(r => r['Series'] || 'Others'))).sort();
  }, [data, stats]);

  const brandOptions = useMemo(() => {
    const others = data.filter(r => r['Brand'] !== 'Hot Wheels');
    return Array.from(new Set(others.map(r => r['Brand']))).filter(Boolean).sort();
  }, [data]);

  const seriesOptions = useMemo(() => {
    let relevantData = data;
    if (activeTab === 'hotwheels') {
      relevantData = data.filter(r => r['Brand'] === 'Hot Wheels');
    } else {
      relevantData = data.filter(r => r['Brand'] !== 'Hot Wheels');
      if (brandFilter) {
        relevantData = relevantData.filter(r => r['Brand'] === brandFilter);
      }
    }
    
    if (mainSeriesFilter) {
      relevantData = relevantData.filter(r => r['Series'] === mainSeriesFilter);
    }

    // Group subseries by their main series to enable hierarchical sorting
    const subseriesInfo: Record<string, string> = {};
    data.forEach(r => {
      if (r['Subseries'] && r['Series']) {
        subseriesInfo[r['Subseries']] = r['Series'];
      }
    });

    const uniqueSubs = Array.from(new Set(relevantData.map(r => r['Subseries'] || ''))).filter(Boolean);
    
    return uniqueSubs.sort((a, b) => {
      const parentA = subseriesInfo[a] || 'Others';
      const parentB = subseriesInfo[b] || 'Others';
      
      if (parentA !== parentB) return parentA.localeCompare(parentB);
      return a.localeCompare(b);
    });
  }, [data, activeTab, brandFilter, mainSeriesFilter]);

  return (
    <div className="space-y-8 pb-20">

      {/* ── Feedback Toast ── */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-[100] p-4 rounded-2xl border shadow-xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm tracking-tight">{feedback.msg}</span>
        </div>
      )}

      {/* ── Page header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="badge-amber mb-3">
            <span className="pulse-amber" />
            Live Collection
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Die-Cast <span className="text-amber-400">Registry</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Your complete model inventory in one place.</p>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('hotwheels')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'hotwheels' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Hot Wheels
          </button>
          <button
            onClick={() => setActiveTab('others')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'others' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Other Brands
          </button>
        </div>
      </header>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Collection Card (Smaller) */}
        <div className="card card-accent p-6 group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/5">
              <Car className="w-5 h-5 text-amber-400" />
            </div>
            <div className="label-xs text-slate-500">Total</div>
          </div>
          <div className="text-2xl font-black text-amber-400">{totalModels}</div>
          <div className="label-xs mt-1 text-slate-600">Registered Models</div>
        </div>

        {/* Showing Card (Bigger) */}
        <div className="md:col-span-2 lg:col-span-2 card card-accent p-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-start justify-between">
            <div>
              <div className="label-xs mb-1 text-slate-400">Current View</div>
              <div className="text-5xl font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                {filtered.length}
              </div>
              <div className="label-xs mt-2 font-bold text-slate-500 uppercase tracking-[0.2em]">Showing Matched Models</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Tracking Card (Smaller) */}
        <div className="card card-accent p-6 group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/5">
              <Hash className="w-5 h-5 text-purple-400" />
            </div>
            <div className="label-xs text-slate-500">Tracking</div>
          </div>
          <div className="text-2xl font-black text-purple-400">{data[data.length - 1]?.['S.No'] ?? '—'}</div>
          <div className="label-xs mt-1 text-slate-600">Latest Serial</div>
        </div>
      </div>

      {/* ── Search & Filters Bar ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search models, series…"
              className="input pl-11"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost gap-2 ${showFilters ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {(mainSeriesFilter || seriesFilter) && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </button>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn-ghost gap-2"
          >
            <TrendingUp className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>

        {/* ── Expanded Filters ── */}
        {showFilters && (
          <div className="card bg-white/5 border-white/5 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTab === 'others' && (
                <div className="space-y-2">
                  <label className="label-xs text-slate-400 ml-1">Brand</label>
                  <select 
                    className="select bg-slate-900 border-white/10"
                    value={brandFilter}
                    onChange={e => setBrandFilter(e.target.value)}
                  >
                    <option value="">All Brands</option>
                    {brandOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="label-xs text-slate-400 ml-1">Series</label>
                <select 
                  className="select bg-slate-900 border-white/10"
                  value={mainSeriesFilter}
                  onChange={e => {
                    setMainSeriesFilter(e.target.value);
                    setSeriesFilter(''); 
                  }}
                >
                  <option value="">All Series</option>
                  {mainSeriesOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="label-xs text-slate-400 ml-1">Subseries</label>
                <select 
                  className="select bg-slate-900 border-white/10"
                  value={seriesFilter}
                  onChange={e => setSeriesFilter(e.target.value)}
                >
                  <option value="">All Subseries</option>
                  {seriesOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end pb-1 col-span-full">
                <button 
                  onClick={() => {
                    setMainSeriesFilter('');
                    setSeriesFilter('');
                    setBrandFilter('');
                    setSearch('');
                  }}
                  className="text-amber-500/60 hover:text-amber-400 text-xs font-bold transition-colors ml-auto mb-2"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <Table
        columns={displayColumns}
        data={filtered}
        isLoading={loading}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setEditingModel(row)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-slate-500 hover:text-amber-400 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleDelete(row['S.No'])}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/5 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      <EditModelModal 
        isOpen={!!editingModel}
        onClose={() => setEditingModel(null)}
        onSave={handleUpdate}
        model={editingModel}
      />
    </div>
  );
};

