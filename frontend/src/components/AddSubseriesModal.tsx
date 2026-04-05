import React, { useState, useEffect } from 'react';
import { X, Layers, Tag } from 'lucide-react';
import { seriesService } from '../services/api';

interface AddSubseriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  seriesOptions: string[];
  initialSeries?: string;
}

const AddSubseriesModal: React.FC<AddSubseriesModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  seriesOptions,
  initialSeries 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    main_series: '',
    subseries: ''
  });

  useEffect(() => {
    if (initialSeries) {
      setFormData(prev => ({ ...prev, main_series: initialSeries }));
    } else if (seriesOptions.length > 0 && !formData.main_series) {
      setFormData(prev => ({ ...prev, main_series: seriesOptions[0] }));
    }
  }, [initialSeries, seriesOptions]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.main_series || !formData.subseries) return;
    
    setLoading(true);
    try {
      const res = await seriesService.update({
        action: 'add',
        main_series: formData.main_series,
        subseries: formData.subseries
      });
      if (res.success) {
        onSuccess();
        onClose();
        setFormData(prev => ({ ...prev, subseries: '' }));
      } else {
        alert(res.error || 'Failed to add subseries');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error adding subseries');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
          <h2 className="text-xl font-black text-white tracking-tight">Add <span className="text-blue-400">Subseries</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="label-xs text-slate-500 ml-1">Parent Series</label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  required
                  value={formData.main_series}
                  onChange={e => setFormData({ ...formData, main_series: e.target.value })}
                  className="select pl-11 bg-white/5 border-white/10 focus:border-blue-500/50"
                  disabled={!!initialSeries}
                >
                  {seriesOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label-xs text-slate-500 ml-1">Subseries Name</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  autoFocus
                  type="text"
                  value={formData.subseries}
                  onChange={e => setFormData({ ...formData, subseries: e.target.value })}
                  placeholder="e.g. Boulevard, Neon Speeders..."
                  className="input pl-11 bg-white/5 border-white/10 focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.subseries}
              className="flex-[2] px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 disabled:opacity-30 text-white font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {loading ? 'Adding...' : 'Add Subseries'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubseriesModal;
