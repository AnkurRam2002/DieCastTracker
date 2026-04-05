import React, { useState } from 'react';
import { X, Tag, FileText, IndianRupee, Star } from 'lucide-react';
import { seriesService } from '../services/api';

interface AddSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSeriesModal: React.FC<AddSeriesModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    series_name: '',
    description: '',
    price_range: '',
    rarity: 'Common'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await seriesService.add(formData);
      if (res.success) {
        onSuccess();
        onClose();
        setFormData({ series_name: '', description: '', price_range: '', rarity: 'Common' });
      } else {
        alert(res.error || 'Failed to add series');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error adding series');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
          <h2 className="text-xl font-black text-white tracking-tight">New <span className="text-amber-400">Main Series</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="label-xs text-slate-500 ml-1">Series Name</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="text"
                  value={formData.series_name}
                  onChange={e => setFormData({ ...formData, series_name: e.target.value })}
                  placeholder="e.g. Premiums, Mainlines..."
                  className="input pl-11 bg-white/5 border-white/10 focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label-xs text-slate-500 ml-1">Brief Description</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What makes this series special?"
                  className="input pl-11 py-3 bg-white/5 border-white/10 focus:border-amber-500/50 resize-none min-h-[80px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="label-xs text-slate-500 ml-1">Typical Price</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.price_range}
                    onChange={e => setFormData({ ...formData, price_range: e.target.value })}
                    placeholder="e.g. ₹550"
                    className="input pl-11 bg-white/5 border-white/10 focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label-xs text-slate-500 ml-1">Rarity Class</label>
                <div className="relative">
                  <Star className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={formData.rarity}
                    onChange={e => setFormData({ ...formData, rarity: e.target.value })}
                    className="select pl-11 bg-white/5 border-white/10 focus:border-amber-500/50"
                  >
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Ultra Rare">Ultra Rare</option>
                    <option value="Varies">Varies</option>
                  </select>
                </div>
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
              disabled={loading}
              className="flex-[2] px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-black transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {loading ? 'Creating...' : 'Create Series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSeriesModal;
