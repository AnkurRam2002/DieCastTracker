import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  TrendingUp, Layers, Brain, 
  History, IndianRupee, PieChart, Activity, ShoppingCart, 
  Calendar
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, 
  ArcElement, PointElement, LineElement
);

const CHART_COLORS = {
  amber: { solid: '#f59e0b', light: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
  blue: { solid: '#3b82f6', light: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
  emerald: { solid: '#10b981', light: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' },
  rose: { solid: '#f43f5e', light: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.2)' },
  slate: { solid: '#64748b', light: 'rgba(255, 255, 255, 0.03)', border: 'rgba(255, 255, 255, 0.05)' }
};

const COMMON_TOOLTIP = {
  backgroundColor: 'rgba(2, 6, 23, 0.95)',
  titleColor: '#94a3b8',
  bodyColor: '#f1f5f9',
  padding: 12,
  cornerRadius: 12,
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  titleFont: { size: 10, weight: 'bold' as const },
  bodyFont: { size: 13, weight: 'bold' as const },
  displayColors: false,
};

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [taxonomicView, setTaxonomicView] = useState<'series' | 'subseries' | 'brands'>('series');

  useEffect(() => {
    analyticsService.getStatistics()
      .then(r => { if (r.success) setData(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/10 border-t-amber-500 animate-spin" />
          <p className="label-xs text-slate-500 animate-pulse">Synthesizing Collection Intelligence…</p>
        </div>
      </div>
    );
  }

  const stats = data.analytics;
  const preorders = data.preorders;

  // Series Distribution Data
  let breakdown = {};
  if (taxonomicView === 'series') breakdown = stats.main_series_breakdown || {};
  else if (taxonomicView === 'subseries') breakdown = stats.subseries_breakdown || {};
  else if (taxonomicView === 'brands') breakdown = stats.brand_breakdown || {};

  const seriesLabels = Object.keys(breakdown);
  const seriesValues = Object.values<number>(breakdown);

  const barData = {
    labels: seriesLabels,
    datasets: [{
      data: seriesValues,
      backgroundColor: seriesLabels.map((_, i) => `hsla(${38 + i * 15}, 90%, 60%, 0.7)`),
      hoverBackgroundColor: seriesLabels.map((_, i) => `hsla(${38 + i * 15}, 100%, 65%, 0.9)`),
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const barOptions: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: COMMON_TOOLTIP
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { weight: 'bold' } } },
      y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { weight: 'bold', size: 11 } } }
    }
  };

  // Financial Health Data

  const financialOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: COMMON_TOOLTIP
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="badge-amber">
              <Activity className="w-3 h-3" />
              Live Core
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">v4.0 Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            Collection <span className="text-amber-400">Intelligence</span>
            <Brain className="w-8 h-8 text-amber-500" />
          </h1>
          <p className="text-slate-500 mt-2 font-medium max-w-xl">
            A high-fidelity analysis of your collectible network, tracking financial commitments, taxonomic spread, and growth milestones.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-md">
          <Calendar className="w-5 h-5 text-slate-500" />
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-600 uppercase">System Time</div>
            <div className="text-sm font-black text-white">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
      </header>

      {/* KPI Nerve Center */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Layers,       label: 'Operational Units', value: stats.total_models,                      color: 'text-amber-400',   bg: 'bg-amber-500/10',    border: 'border-amber-500/20' },
          { icon: IndianRupee,  label: 'Active Equity',     value: `₹${(preorders?.active_paid || 0).toLocaleString()}`, color: 'text-blue-400',    bg: 'bg-blue-500/10',     border: 'border-blue-500/20' },
          { icon: ShoppingCart, label: 'Liability (PO)',    value: `₹${(preorders?.active_remaining || 0).toLocaleString()}`,             color: 'text-rose-400',    bg: 'bg-rose-500/10',     border: 'border-rose-500/20' },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className="card card-accent p-6 group relative overflow-hidden">
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${bg} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
            <div className={`w-11 h-11 rounded-2xl ${bg} border ${border} flex items-center justify-center mb-5 group-hover:rotate-12 transition-transform`}>
              <Icon className={`w-5.5 h-5.5 ${color}`} />
            </div>
            <div className={`text-3xl font-black ${color} tracking-tight`}>{value}</div>
            <div className="label-xs mt-1 text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main: Series Distribution */}
        <div className="lg:col-span-8 card p-8 h-[520px] flex flex-col group relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Taxonomic Distribution
              </h3>
              <p className="label-xs mt-1">High-density series analysis</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={taxonomicView}
                onChange={(e) => setTaxonomicView(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-amber-500/50 transition-colors [color-scheme:dark]"
              >
                <option value="brands" className="bg-slate-900">Brands</option>
                <option value="series" className="bg-slate-900">Series</option>
                <option value="subseries" className="bg-slate-900">Subseries</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="pulse-amber" />
                <span className="label-xs text-amber-500 font-black">Live Capture</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Side: Financial Health */}
        <div className="lg:col-span-4 card p-8 h-[520px] flex flex-col group relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <PieChart className="w-5 h-5 text-rose-500" />
                Financial Health
              </h3>
              <Brain className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-2 mb-6">
              Tracking total paid vs. remaining liability across <span className="text-white font-bold italic underline">all undelivered preorders</span>. 
              Delivered items are settled and excluded from this active health view.
            </p>
          </div>
          
          <div className="relative h-48 flex items-center justify-center">
            <Doughnut 
              data={{
                labels: ['Active Paid', 'Active Pending'],
                datasets: [{
                  data: [preorders?.active_paid || 0, preorders?.active_remaining || 0],
                  backgroundColor: [CHART_COLORS.emerald.solid, CHART_COLORS.rose.solid],
                  borderColor: 'rgba(0,0,0,0.2)',
                  borderWidth: 2,
                  hoverOffset: 10
                }]
              }} 
              options={financialOptions} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Risk</div>
              <div className="text-2xl font-black text-white">₹{(preorders?.active_remaining || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="label-xs text-slate-400">Equity (Paid Parts)</span>
              </div>
              <span className="text-sm font-black text-white">₹{(preorders?.active_paid || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="label-xs text-slate-400">Liability (Remaining)</span>
              </div>
              <span className="text-sm font-black text-white">₹{(preorders?.active_remaining || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Intelligence & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Timeline: Recent Additions */}
        <div className="lg:col-span-12 card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <History className="w-5 h-5 text-blue-500" />
              Intelligence Timeline
            </h3>
            <span className="label-xs">Last 10 Records</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[360px] pr-2 custom-scrollbar">
            {stats.recent_additions?.map((item: any) => (
              <div key={item['S.No']} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 group/row transition-all hover:bg-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest mb-1">{item['Brand']}</div>
                    <div className="text-sm font-black text-white group-hover/row:text-blue-400 transition-colors uppercase leading-tight">{item['Item Name']}</div>
                  </div>
                  <div className="text-[10px] font-black text-slate-600 bg-white/5 px-2 py-1 rounded-lg border border-white/5 italic">
                    #{item['S.No']}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
