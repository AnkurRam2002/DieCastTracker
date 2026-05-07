import React, { useEffect, useState, useMemo, useRef } from 'react';
import { dataService, authService, brandService, seriesService } from '../services/api';
import { Table } from '../components/Table';
import { EditModelModal } from '../components/EditModelModal';
import { Search, SlidersHorizontal, Package, TrendingUp, Hash, Edit2, Trash2, CheckCircle, AlertCircle, Settings } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'secondary' | 'others'>('primary');
  const [user, setUser] = useState<any>(null);
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [allSeries, setAllSeries] = useState<any[]>([]);
  const [allSubseries, setAllSubseries] = useState<any[]>([]);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  
  // Pagination & Backend Metadata
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mainSeriesFilter, setMainSeriesFilter] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Edit/Delete State
  const [editingModel, setEditingModel] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowBrandPicker(false);
      }
    };
    if (showBrandPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBrandPicker]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load user profile and brands
  useEffect(() => {
    const init = async () => {
      try {
        const [uRes, bRes, sRes, subRes] = await Promise.all([
          authService.profile(),
          brandService.getAll(),
          seriesService.getAll(),
          seriesService.getAllSubseries()
        ]);
        if (uRes.success) {
          setUser(uRes.user);
          if (!uRes.user.primary_brand && !uRes.user.secondary_brand) {
            setActiveTab('others');
          } else if (!uRes.user.primary_brand && uRes.user.secondary_brand) {
            setActiveTab('secondary');
          }
        }
        if (bRes.success) setAllBrands(bRes.brands);
        if (sRes.success) setAllSeries(sRes.series);
        if (subRes.success) setAllSubseries(subRes.subseries);
      } catch (err) {
        console.error("Failed to load user info", err);
      }
    };
    init();
  }, []);

  // Reset page when other filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, brandFilter, mainSeriesFilter, seriesFilter, sortOrder, itemsPerPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dataRes, statsRes] = await Promise.all([
        dataService.getAll({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          brandFilter,
          mainSeriesFilter,
          seriesFilter,
          sortOrder,
          tab: activeTab
        }),
        dataService.getStats(),
      ]);
      if (dataRes.success) {
        setData(dataRes.data);
        setTotalRecords(dataRes.total_records);
        setTotalPages(dataRes.total_pages);
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
  }, [currentPage, itemsPerPage, debouncedSearch, brandFilter, mainSeriesFilter, seriesFilter, sortOrder, activeTab]);

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
      return ['S.No', 'Item Name', 'Brand', 'Series', 'Subseries'];
    }
    return ['S.No', 'Item Name', 'Subseries'];
  }, [activeTab]);

  // Removed purely client-side filtering

  const totalModels = stats?.total_models ?? data.length;

  // Extract unique filter options
  const mainSeriesOptions = useMemo(() => {
    let relevantSeries = allSeries;
    
    if (activeTab === 'primary') {
      relevantSeries = allSeries.filter(s => s.brand?.name === user?.primary_brand);
    } else if (activeTab === 'secondary') {
      relevantSeries = allSeries.filter(s => s.brand?.name === user?.secondary_brand);
    } else if (activeTab === 'others' && brandFilter) {
      relevantSeries = allSeries.filter(s => s.brand?.name === brandFilter);
    }

    return Array.from(new Set(relevantSeries.map(s => s.name))).sort();
  }, [allSeries, activeTab, user, brandFilter]);

  const brandOptions = useMemo(() => {
    // Return all brands that are NOT the primary or secondary ones
    return allBrands
      .filter(b => b.name !== user?.primary_brand && b.name !== user?.secondary_brand)
      .map(b => b.name)
      .sort();
  }, [allBrands, user]);

  const seriesOptions = useMemo(() => {
    let relevantSubseries = allSubseries;
    
    // 1. Filter by current brand tab
    if (activeTab === 'primary') {
      relevantSubseries = allSubseries.filter(sub => sub.series?.brand?.name === user?.primary_brand);
    } else if (activeTab === 'secondary') {
      relevantSubseries = allSubseries.filter(sub => sub.series?.brand?.name === user?.secondary_brand);
    } else if (activeTab === 'others' && brandFilter) {
      relevantSubseries = allSubseries.filter(sub => sub.series?.brand?.name === brandFilter);
    }
    
    // 2. Filter by selected series (STRICT)
    if (mainSeriesFilter) {
      relevantSubseries = relevantSubseries.filter(sub => sub.series?.name === mainSeriesFilter);
    } else {
      // If no series selected, return empty (user requested selected series subseries only)
      return [];
    }

    return Array.from(new Set(relevantSubseries.map(sub => sub.name))).sort();
  }, [allSubseries, activeTab, user, brandFilter, mainSeriesFilter]);

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
            Collector <span className="text-amber-400">Registry</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Your complete collection inventory in one place.</p>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
            {user?.primary_brand && (
              <button
                onClick={() => setActiveTab('primary')}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'primary' 
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {user.primary_brand}
              </button>
            )}
            {user?.secondary_brand && (
              <button
                onClick={() => setActiveTab('secondary')}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'secondary' 
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {user.secondary_brand}
              </button>
            )}
            <button
              onClick={() => setActiveTab('others')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'others' 
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {(!user?.primary_brand && !user?.secondary_brand) ? 'Collection' : 'Others'}
            </button>
          </div>

          <div className="relative" ref={pickerRef}>
            <button 
              onClick={() => setShowBrandPicker(!showBrandPicker)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
              title="Manage Tabs"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showBrandPicker && (
              <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">Tab 1 Brand</label>
                    <select 
                      value={user?.primary_brand || ''}
                      onChange={async (e) => {
                        const val = e.target.value === "" ? null : e.target.value;
                        try {
                          const res = await authService.updatePreferences({ primary_brand: val });
                          if (res.success) { 
                            setUser(res.user); 
                            if (!val && activeTab === 'primary') setActiveTab('others');
                            loadData(); 
                          } else {
                            setFeedback({ type: 'error', msg: res.error || 'Failed to update tab' });
                          }
                        } catch (err: any) {
                          setFeedback({ type: 'error', msg: err?.response?.data?.error || 'Error updating tab' });
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="">None (Disabled)</option>
                      {allBrands.map(b => (
                        <option key={b._id} value={b.name} disabled={b.name === user?.secondary_brand}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">Tab 2 Brand</label>
                    <select 
                      value={user?.secondary_brand || ''}
                      onChange={async (e) => {
                        const val = e.target.value === "" ? null : e.target.value;
                        try {
                          const res = await authService.updatePreferences({ secondary_brand: val });
                          if (res.success) { 
                            setUser(res.user); 
                            if (!val && activeTab === 'secondary') setActiveTab('others');
                            loadData(); 
                          } else {
                            setFeedback({ type: 'error', msg: res.error || 'Failed to update tab' });
                          }
                        } catch (err: any) {
                          setFeedback({ type: 'error', msg: err?.response?.data?.error || 'Error updating tab' });
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="">None (Disabled)</option>
                      {allBrands.map(b => (
                        <option key={b._id} value={b.name} disabled={b.name === user?.primary_brand}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => setShowBrandPicker(false)}
                    className="w-full btn-primary py-2 text-[10px] justify-center"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Collection Card (Smaller) */}
        <div className="card card-accent p-6 group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/5">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div className="label-xs text-slate-500">Total</div>
          </div>
          <div className="text-2xl font-black text-amber-400">{totalModels}</div>
          <div className="label-xs mt-1 text-slate-600">Registered Items</div>
        </div>

        {/* Showing Card (Bigger) */}
        <div className="md:col-span-2 lg:col-span-2 card card-accent p-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-start justify-between">
            <div>
              <div className="label-xs mb-1 text-slate-400">Current View</div>
              <div className="text-5xl font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                {totalRecords}
              </div>
              <div className="label-xs mt-2 font-bold text-slate-500 uppercase tracking-[0.2em]">Showing Matched Items</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="card card-accent p-6 group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/5">
              <Hash className="w-5 h-5 text-purple-400" />
            </div>
            <div className="label-xs text-slate-500">Tracking</div>
          </div>
          <div className="text-2xl font-black text-purple-400">{stats?.total_models ?? '—'}</div>
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
              placeholder="Search items, series…"
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
                  {mainSeriesOptions.length > 0 ? (
                    mainSeriesOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))
                  ) : (
                    <option value="" disabled>None</option>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="label-xs text-slate-400 ml-1">Subseries</label>
                <select 
                  className="select bg-slate-900 border-white/10"
                  value={seriesFilter}
                  onChange={e => setSeriesFilter(e.target.value)}
                >
                  <option value="">{mainSeriesFilter ? 'All Subseries' : 'Select Series First'}</option>
                  {seriesOptions.length > 0 ? (
                    seriesOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))
                  ) : (
                    mainSeriesFilter && <option value="" disabled>None</option>
                  )}
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
        data={data}
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
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

