import React, { useEffect, useState } from 'react';
import { seriesService } from '../services/api';
import { Tags, List, Plus, Edit2, FolderOpen, ChevronRight, Database } from 'lucide-react';
import AddSeriesModal from '../components/AddSeriesModal';
import AddSubseriesModal from '../components/AddSubseriesModal';

export const SeriesManagement: React.FC = () => {
  const [seriesData, setSeriesData] = useState<Record<string, string[]>>({});
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddSeriesOpen, setIsAddSeriesOpen] = useState(false);
  const [isAddSubseriesOpen, setIsAddSubseriesOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<string | undefined>(undefined);

  const fetchSeries = () => {
    setLoading(true);
    seriesService.getAll()
      .then(r => {
        if (r.success) {
          setSeriesData(r.series_options);
          setMetadata(r.series_metadata || {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const totalSub = Object.values(seriesData).reduce((s, l) => s + l.length, 0);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="label-xs text-slate-600">Loading Schema…</p>
        </div>
      </div>
    );
  }

  const seriesOptions = Object.keys(seriesData);

  return (
    <div className="space-y-8 pb-20">
      <AddSeriesModal 
        isOpen={isAddSeriesOpen} 
        onClose={() => setIsAddSeriesOpen(false)} 
        onSuccess={fetchSeries} 
      />
      
      <AddSubseriesModal 
        isOpen={isAddSubseriesOpen} 
        onClose={() => {
          setIsAddSubseriesOpen(false);
          setSelectedSeries(undefined);
        }} 
        onSuccess={fetchSeries}
        seriesOptions={seriesOptions}
        initialSeries={selectedSeries}
      />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="badge-amber mb-3">
            <Database className="w-3 h-3" />
            Structure Authority
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Series <span className="text-amber-400">Taxonomy</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Define and organise the hierarchical relationships of your collection.
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button 
            onClick={() => setIsAddSeriesOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Series
          </button>
          <button 
            onClick={() => setIsAddSubseriesOpen(true)}
            className="btn-ghost"
          >
            <Plus className="w-4 h-4" />
            Add Subseries
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {[
          { icon: Tags,           label: 'Main Series',    value: seriesOptions.length, color: 'text-amber-400',    bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
          { icon: List,           label: 'Total Nodes',    value: totalSub,                        color: 'text-blue-400',     bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className="card card-accent p-7 flex items-center gap-5 group">
            <div className={`w-14 h-14 rounded-2xl ${bg} border ${border} flex items-center justify-center group-hover:scale-105 transition-transform`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <div className={`text-3xl font-black ${color}`}>{value}</div>
              <div className="label-xs mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Registry Map heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white flex items-center gap-2.5">
          <FolderOpen className="w-5 h-5 text-amber-400" />
          Registry Map
        </h2>
        <div className="flex items-center gap-2">
          <span className="pulse-amber" />
          <span className="label-xs">Live Schema</span>
        </div>
      </div>

      {/* Series cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
        {Object.entries(seriesData).reverse().map(([series, subseries]) => {
          const meta = metadata[series] || {};
          return (
            <div key={series} className="card p-7 flex flex-col group min-h-[300px]">
              {/* Card header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FolderOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white leading-tight">{series}</h4>
                    <p className="label-xs mt-0.5">{subseries.length} Subseries</p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metadata badge strip */}
              {(meta.price_range || meta.rarity) && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {meta.price_range && (
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/8 px-2.5 py-1 rounded-lg border border-amber-500/15">
                      {meta.price_range}
                    </span>
                  )}
                  {meta.rarity && (
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/4 px-2.5 py-1 rounded-lg border border-white/8">
                      {meta.rarity}
                    </span>
                  )}
                </div>
              )}

              {meta.description && (
                <p className="text-xs text-slate-500 italic mb-5 leading-relaxed">
                  "{meta.description}"
                </p>
              )}

              <hr className="divider !my-0 mb-5" />

              {/* Scrollable Subseries area */}
              <div className="flex-1 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  {subseries.map(sub => (
                    <div key={sub} className="tag">
                      <ChevronRight className="w-2.5 h-2.5 opacity-40 shrink-0" />
                      <span className="truncate">{sub}</span>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      setSelectedSeries(series);
                      setIsAddSubseriesOpen(true);
                    }}
                    className="tag border-dashed border-amber-400/30 text-amber-600 hover:text-amber-400 hover:border-amber-400/60"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
