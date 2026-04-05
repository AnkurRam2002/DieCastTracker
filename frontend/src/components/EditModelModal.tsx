import React, { useEffect, useState } from 'react';
import { dataService } from '../services/api';
import { X, Car, Layers, List, Save, AlertCircle } from 'lucide-react';

interface EditModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: any) => Promise<void>;
  model: any;
}

export const EditModelModal: React.FC<EditModelModalProps> = ({ isOpen, onClose, onSave, model }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seriesOptions, setSeriesOptions] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    model_name: '',
    series: '',
    subseries: ''
  });

  useEffect(() => {
    if (isOpen && model) {
      setFormData({
        model_name: model['Model Name'] || '',
        series: model['Main Series'] || '',
        subseries: model['Series'] || ''
      });
      
      dataService.getDropdownOptions()
        .then(r => { if (r.success) setSeriesOptions(r.series); })
        .catch(console.error);
    }
    setError('');
  }, [isOpen, model]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave({
        serial_number: model['S.No'],
        updates: {
          model_name: formData.model_name,
          series: formData.series,
          subseries: formData.subseries
        }
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update model');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card max-w-lg w-full shadow-2xl overflow-hidden border-amber-500/20 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Edit <span className="text-amber-400">Model</span></h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Refactor registry entry</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-slate-900/50">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 label-xs translate-x-1">
              <Car className="w-3 h-3 text-amber-500" />
              Identity
            </label>
            <input
              type="text"
              required
              value={formData.model_name}
              onChange={e => setFormData({ ...formData, model_name: e.target.value })}
              className="input"
              placeholder="Model designation..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 label-xs translate-x-1">
                <Layers className="w-3 h-3 text-amber-500" />
                Series
              </label>
              <select
                required
                value={formData.series}
                onChange={e => setFormData({ ...formData, series: e.target.value, subseries: '' })}
                className="select"
              >
                <option value="">Select Series...</option>
                {Object.keys(seriesOptions).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 label-xs translate-x-1">
                <List className="w-3 h-3 text-amber-500" />
                Subseries
              </label>
              <select
                required
                value={formData.subseries}
                onChange={e => setFormData({ ...formData, subseries: e.target.value })}
                className="select disabled:opacity-40"
                disabled={!formData.series}
              >
                <option value="">Select Sub...</option>
                {(seriesOptions[formData.series] || []).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center gap-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Apply Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost px-8"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
