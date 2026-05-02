import React, { useEffect, useState, useMemo } from 'react';
import { preorderService } from '../services/api';
import { Table } from '../components/Table';
import { Plus, Search, Filter, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';
import AddPreorderModal from '../components/AddPreorderModal';
import EditPreorderModal from '../components/EditPreorderModal';

const STATUS_STYLES: Record<string, string> = {
  Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Shipped:   'bg-blue-500/10   text-blue-400   border-blue-500/20',
  Paid:      'bg-violet-500/10 text-violet-400  border-violet-500/20',
  Pending:   'bg-amber-500/10  text-amber-400   border-amber-500/20',
};

export const Preorders: React.FC = () => {
  const [preorders, setPreorders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Pagination & Backend Metadata
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [sellerFilter, setSellerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPreorder, setSelectedPreorder] = useState<any>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sellerFilter, statusFilter, sortOrder, itemsPerPage]);

  const fetchPreorders = async () => {
    setLoading(true);
    try {
      const [dataRes, statsRes] = await Promise.all([
        preorderService.getAll({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          sellerFilter,
          statusFilter,
          sortOrder
        }),
        preorderService.getStats()
      ]);
      if (dataRes.success) {
        setPreorders(dataRes.data);
        setTotalRecords(dataRes.total_records);
        setTotalPages(dataRes.total_pages);
      }
      if (statsRes.success) {
        setStats(statsRes.statistics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreorders();
  }, [currentPage, itemsPerPage, debouncedSearch, sellerFilter, statusFilter, sortOrder]);

  // Removed local useMemo arrays and filtering

  const safeParse = (v: any) => parseFloat(String(v).replace(/[₹,\s]/g, '')) || 0;
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const statsData = useMemo(() => {
    if (!stats) return { totalRecords: 0, totalCommited: 0, totalPO: 0, totalArrival: 0, paymentDone: 0, remaining: 0 };
    return {
      totalRecords: stats.total_preorders,
      totalCommited: stats.total_value,
      totalPO: stats.total_po_amount,
      totalArrival: stats.total_on_arrival,
      paymentDone: stats.total_paid || 0,
      remaining: stats.active_remaining
    };
  }, [stats]);

  const cycleStatus = async (serialNumber: number, currentStatus: string) => {
    const sequence = ['Pending', 'Paid', 'Shipped', 'Delivered'];
    const nextIdx = (sequence.indexOf(currentStatus || 'Pending') + 1) % sequence.length;
    const nextStatus = sequence[nextIdx];

    try {
      const res = await preorderService.update(serialNumber, { delivery_status: nextStatus });
      if (res.success) {
        fetchPreorders();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const formatETA = (eta: string) => {
    if (!eta) return 'TBA';
    const [y, m] = eta.split('-');
    if (y && m) {
      const date = new Date(parseInt(y), parseInt(m) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return eta;
  };

  const handleDelete = async (serialNumber: number) => {
    if (!window.confirm(`Are you sure you want to delete preorder #${serialNumber}?`)) return;
    try {
      const res = await preorderService.delete(serialNumber);
      if (res.success) {
        fetchPreorders();
      } else {
        alert(res.error || 'Failed to delete preorder.');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error deleting preorder.');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <AddPreorderModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchPreorders}
        sellers={[]}
      />
      {selectedPreorder && (
        <EditPreorderModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedPreorder(null); }}
          onSuccess={fetchPreorders}
          preorder={selectedPreorder}
        />
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="badge-amber mb-3">
            <span className="pulse-amber" />
            Preorder Tracker
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Order <span className="text-amber-400">Vault</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Tracking {statsData.totalRecords} upcoming die-cast treasures.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary self-start md:self-auto">
          <Plus className="w-4 h-4" />
          New Preorder
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-4 border-white/5 bg-slate-900/40 flex flex-col justify-between col-span-2">
          <div>
            <div className="label-xs text-slate-500 mb-1">Portfolio Payment Status (Paid / Pending)</div>
            <div className="text-3xl font-black tracking-tighter text-white">{fmt(statsData.totalCommited)}</div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${(statsData.paymentDone / statsData.totalCommited) * 100}%` }}
              />
              <div 
                className="h-full bg-red-500 transition-all duration-1000" 
                style={{ width: `${(statsData.remaining / statsData.totalCommited) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-emerald-500 font-bold">Paid: {fmt(statsData.paymentDone)}</span>
              <span className="text-red-500 font-bold">Pending: {fmt(statsData.remaining)}</span>
            </div>
          </div>
        </div>

        {[
          { label: 'Total Preorders', value: statsData.totalRecords, color: 'text-white' },
          { label: 'Initial PO',    value: fmt(statsData.totalPO), color: 'text-slate-400' },
          { label: 'On Arrival',   value: fmt(statsData.totalArrival), color: 'text-slate-400' },
          { label: 'Pending Total', value: fmt(statsData.remaining), color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 border-white/5 bg-slate-900/40 flex flex-col justify-between">
            <div>
              <div className="label-xs text-slate-500 mb-1">{label}</div>
              <div className={`text-xl font-black tracking-tighter ${color}`}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search models or seller…" className="input pl-11" />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select value={sellerFilter} onChange={e => setSellerFilter(e.target.value)} className="select pl-11 pr-5 w-auto min-w-[160px]">
            <option value="">All Sellers</option>
            {/* dynamic sellers removed since we page them, wait for auto-complete later if needed */}
          </select>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="select pr-5 w-auto min-w-[160px]">
          <option value="">All Statuses</option>
          {['Pending','Paid','Shipped','Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="btn-ghost gap-2 ml-auto"
        >
          <TrendingUp className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      <Table
        columns={['S.No', 'Seller', 'Models', 'ETA', 'Financials', 'Status']}
        data={preorders.map(p => {
          const total = safeParse(p['Total Price']);
          const poAmt = safeParse(p['PO Amount']);
          const status = (p['Delivery Status'] || 'Pending');
          
          const isCleared = ['Paid', 'Shipped', 'Delivered'].includes(status);
          const paid = isCleared ? total : poAmt;
          const pending = total - paid;
          
          return {
            ...p,
            'ETA': (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex flex-col items-center justify-center border border-white/5 text-[10px] font-black uppercase text-amber-500/80">
                  <span className="leading-none">{formatETA(p.ETA).split(' ')[0]}</span>
                  <span className="text-[7px] text-slate-500 leading-none mt-0.5">{formatETA(p.ETA).split(' ')[1]}</span>
                </div>
              </div>
            ),
            'Financials': (
              <div className="space-y-3 py-2 min-w-[160px]">
                <div className="text-xl font-black text-white leading-none tracking-tight">{fmt(total)}</div>
                <div className="space-y-1.5">
                  <div className="flex h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(paid / total) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${(pending / total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-tight opacity-80">
                    <span className="text-emerald-500">Paid: {fmt(paid)}</span>
                    <span className="text-red-500">Rem: {fmt(pending)}</span>
                  </div>
                </div>
              </div>
            ),
            'Status': (
              <button 
                onClick={() => cycleStatus(p['S.No'], status)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-block whitespace-nowrap transition-all hover:scale-105 active:scale-95',
                  STATUS_STYLES[status] ?? STATUS_STYLES['Pending']
                )}>
                {status}
              </button>
            )
          };
        })}
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        actions={(row) => (
          <div className="flex justify-end items-center gap-2">
            <button 
              onClick={() => { setSelectedPreorder(row); setIsEditModalOpen(true); }}
              className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-slate-500 hover:text-amber-400 transition-all">
              <Edit2 className="w-3 h-3" />
            </button>
            <button 
              onClick={() => handleDelete(row['S.No'])}
              className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/5 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      />
    </div>
  );
};
