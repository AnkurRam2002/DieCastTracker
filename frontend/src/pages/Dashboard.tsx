import React, { useEffect, useState, useMemo } from 'react';
import { dataService } from '../services/api';
import { Table } from '../components/Table';
import { EditModelModal } from '../components/EditModelModal';
import { Search, SlidersHorizontal, Car, TrendingUp, Hash, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  
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
        const cols = dataRes.columns?.length ? dataRes.columns : ['S.No', 'Model Name', 'Series'];
        setColumns(cols.filter((c: string) => c !== 'Main Series'));
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

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  const totalModels = stats?.total_models ?? data.length;

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
      </header>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Car,        label: 'Total Models',   value: totalModels,                  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
          { icon: TrendingUp, label: 'Showing',        value: filtered.length,              color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { icon: Hash,       label: 'Last S.No',      value: data[data.length - 1]?.['S.No'] ?? '—', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className="card card-accent p-6 group">
            <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className={`text-3xl font-black ${color}`}>{value}</div>
            <div className="label-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
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
        <button className="btn-ghost gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* ── Table ── */}
      <Table
        columns={columns}
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

