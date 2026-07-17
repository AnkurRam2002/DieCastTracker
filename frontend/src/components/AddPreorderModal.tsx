import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, Store } from 'lucide-react';
import { preorderService } from '../services/api';

interface AddPreorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sellers: string[];
}

const AddPreorderModal: React.FC<AddPreorderModalProps> = ({ isOpen, onClose, onSuccess, sellers }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    seller: '',
    models: '',
    eta: '',
    total_price: '',
    po_amount: '',
    on_arrival_amount: '',
    delivery_status: 'Pending'
  });

  // Auto-calculate On Arrival Amount
  useEffect(() => {
    const total = parseFloat(formData.total_price) || 0;
    const po = parseFloat(formData.po_amount) || 0;
    if (total > 0 || po > 0) {
      setFormData(prev => ({ ...prev, on_arrival_amount: (total - po).toString() }));
    }
  }, [formData.total_price, formData.po_amount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await preorderService.add(formData);
      if (res.success) {
        onSuccess();
        onClose();
        setFormData({
          seller: '',
          models: '',
          eta: '',
          total_price: '',
          po_amount: '',
          on_arrival_amount: '',
          delivery_status: 'Pending'
        });
      } else {
        alert(res.error || 'Failed to add preorder');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error adding preorder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
          <h2 className="text-xl font-black text-white tracking-tight">Add New <span className="text-amber-400">Preorder</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="label-xs text-slate-500 ml-1">Seller / Shop Name</label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="text"
                  list="add-seller-suggestions"
                  value={formData.seller}
                  onChange={e => setFormData({ ...formData, seller: e.target.value })}
                  placeholder="Enter seller name..."
                  className="input pl-11 bg-white/5 border-white/10 focus:border-amber-500/50"
                />
                <datalist id="add-seller-suggestions">
                  {sellers?.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label-xs text-slate-500 ml-1">Models / Description</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="text"
                  value={formData.models}
                  onChange={e => setFormData({ ...formData, models: e.target.value })}
                  placeholder="Model name, etc..."
                  className="input pl-11 bg-white/5 border-white/10 focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="label-xs text-slate-500 ml-1">ETA (Month/Year)</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    required
                    type="month"
                    value={formData.eta}
                    onChange={e => setFormData({ ...formData, eta: e.target.value })}
                    className={`input pl-11 bg-white/5 border-white/10 focus:border-amber-500/50 [color-scheme:dark] ${!formData.eta ? 'text-slate-500' : 'text-white'}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label-xs text-slate-500 ml-1">Initial Status</label>
                <select
                  value={formData.delivery_status}
                  onChange={e => setFormData({ ...formData, delivery_status: e.target.value })}
                  className="select bg-white/5 border-white/10 focus:border-amber-500/50 [color-scheme:dark]"
                >
                  <option className="bg-slate-900" value="Pending">Pending</option>
                  <option className="bg-slate-900" value="Paid">Paid</option>
                  <option className="bg-slate-900" value="Shipped">Shipped</option>
                  <option className="bg-slate-900" value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-white/5 my-2" />

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="label-xs text-emerald-500/70 ml-1 font-bold">Total Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500/50" />
                  <input
                    required
                    type="number"
                    value={formData.total_price}
                    onChange={e => setFormData({ ...formData, total_price: e.target.value })}
                    className="input pl-8 py-2 text-sm bg-emerald-500/5 border-emerald-500/20 focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label-xs text-amber-500/70 ml-1 font-bold">PO Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500/50" />
                  <input
                    required
                    type="number"
                    value={formData.po_amount}
                    onChange={e => setFormData({ ...formData, po_amount: e.target.value })}
                    className="input pl-8 py-2 text-sm bg-amber-500/5 border-amber-500/20 focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label-xs text-red-500/70 ml-1 font-bold">On Arrival</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-red-500/50" />
                  <input
                    readOnly
                    type="number"
                    value={formData.on_arrival_amount}
                    className="input pl-8 py-2 text-sm bg-red-500/5 border-red-500/20 cursor-not-allowed opacity-80"
                  />
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
              {loading ? 'Adding...' : 'Add Preorder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPreorderModal;
