import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/api';
import { PlusCircle, ArrowLeft, Package, Layers, List, CheckCircle, Hash } from 'lucide-react';

export const AddModel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [seriesOptions, setSeriesOptions] = useState<Record<string, Record<string, string[]>>>({});
  const [form, setForm] = useState({ model_name: '', model_no: '', series: '', subseries: '', brand: 'Hot Wheels', scale: '1:64' });

  useEffect(() => {
    dataService.getDropdownOptions()
      .then(r => { if (r.success) setSeriesOptions(r.series); })
      .catch(console.error);
  }, []);

  const availableSeries = useMemo(() => {
    const brandData = seriesOptions[form.brand] || {};
    return Object.keys(brandData).sort();
  }, [seriesOptions, form.brand]);

  const availableSubseries = useMemo(() => {
    const brandData = seriesOptions[form.brand] || {};
    return (brandData[form.series] || []).sort();
  }, [seriesOptions, form.brand, form.series]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSuccess(''); setError('');
    try {
      const res = await dataService.addModel(form);
      if (res.success) {
        setSuccess(res.message || 'Model added to collection!');
        setForm({ model_name: '', model_no: '', series: '', subseries: '', brand: form.brand, scale: '1:64' });
      } else {
        setError(res.error || 'Failed to add model.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-amber-500 font-bold mb-8 text-sm hover:text-amber-400 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="card card-accent p-10 relative overflow-hidden">

        {/* Decorative amber top line is handled by card-accent::before */}

        {/* Title block */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <PlusCircle className="w-8 h-8 text-amber-400" />
          </div>
          <div className="badge-amber mx-auto inline-flex mb-4">
            <span className="pulse-amber" />
            New Entry
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">Add to Collection</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Register a new collectible in the registry.</p>
        </div>

        {/* Feedback */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl mb-6 font-bold text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 font-bold text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Model Name & Model No Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Model Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 label-xs">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                Item Name <span className="text-amber-500">*</span>
              </label>
              <input
                type="text" required
                value={form.model_name}
                onChange={e => setForm({ ...form, model_name: e.target.value })}
                placeholder="e.g. '17 Ford F-150 Raptor"
                className="input"
              />
            </div>

            {/* Model No (Optional) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 label-xs">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                Model No <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={form.model_no}
                onChange={e => setForm({ ...form, model_no: e.target.value })}
                placeholder="e.g. HW-2024-015"
                className="input"
              />
            </div>

            {/* Scale */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 label-xs">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                Scale
              </label>
              <input
                type="text"
                value={form.scale}
                onChange={e => setForm({ ...form, scale: e.target.value })}
                placeholder="e.g. 1:64"
                className="input"
              />
            </div>
          </div>

          {/* Brand / Series / Subseries Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Brand */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 label-xs">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                Brand <span className="text-amber-500">*</span>
              </label>
              <select
                required
                value={form.brand}
                onChange={e => setForm({ ...form, brand: e.target.value, series: '', subseries: '' })}
                className="select"
              >
                {Object.keys(seriesOptions).sort().map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Series */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 label-xs">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Series
              </label>
              <select
                value={form.series}
                onChange={e => setForm({ ...form, series: e.target.value, subseries: '' })}
                className="select disabled:opacity-40"
                disabled={!form.brand || availableSeries.length === 0}
              >
                <option value="">{availableSeries.length === 0 ? 'No series available' : 'Select Series…'}</option>
                {availableSeries.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Subseries */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 label-xs">
                <List className="w-3.5 h-3.5 text-amber-500" />
                Subseries
              </label>
              <select
                disabled={!form.series || availableSubseries.length === 0}
                value={form.subseries}
                onChange={e => setForm({ ...form, subseries: e.target.value })}
                className="select disabled:opacity-40"
              >
                <option value="">{form.series ? (availableSubseries.length === 0 ? 'No subseries available' : 'Select Subseries…') : 'Select a series first'}</option>
                {availableSubseries.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="divider" />

          <div className="flex gap-4">
            <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="btn-primary flex-[2] justify-center"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                : <><PlusCircle className="w-4 h-4" /> Add to Registry</>
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
