import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard,
  ShoppingCart, 
  BarChart3, 
  Layers,
  PlusCircle, 
  Car,
  ChevronRight,
  Menu,
  X,
  Tags,
  FolderOpen
} from 'lucide-react';
import { cn } from '../utils/cn';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/',          section: null },
  { icon: PlusCircle,      label: 'Add Model',   path: '/add',       section: null },
  { icon: ShoppingCart,    label: 'Preorders',   path: '/preorders', section: 'Tracking' },
  { icon: BarChart3,       label: 'Analytics',   path: '/analytics', section: null },
  { icon: Tags,            label: 'Brands',      path: '/manage/brands',    section: 'Management' },
  { icon: FolderOpen,      label: 'Series',      path: '/manage/series',    section: 'Management' },
  { icon: Layers,          label: 'Subseries',   path: '/manage/subseries', section: 'Management' },
];

export const Sidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const inner = (
    <div className="flex flex-col h-full relative z-10">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-white font-black tracking-tight text-base leading-tight">Model</div>
            <div className="text-amber-500 text-[9px] font-black uppercase tracking-[0.25em] leading-tight">Tracker Pro</div>
          </div>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {navItems.map((item, idx) => {
          const showSection = item.section && (idx === 0 || navItems[idx - 1].section !== item.section);
          return (
            <React.Fragment key={item.path}>
              {showSection && (
                <div className="px-3 pt-4 pb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-600">
                    {item.section}
                  </span>
                </div>
              )}
              <NavLink
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 group relative",
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 w-0.5 h-5 bg-amber-500 rounded-r-full shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                    )}
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4", isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300 transition-colors")} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-amber-500/50" />}
                  </>
                )}
              </NavLink>
            </React.Fragment>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-5 left-5 z-50 w-10 h-10 bg-slate-900/90 backdrop-blur border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-xl"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "md:hidden fixed left-0 top-0 bottom-0 w-72 z-50 transition-transform duration-300",
        "bg-[#020617]/95 backdrop-blur-xl border-r border-white/5",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
        {inner}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-64 z-50 flex-col rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {inner}
      </aside>
    </>
  );
};
