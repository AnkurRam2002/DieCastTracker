import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { seriesService, brandService } from '../services/api';
import { Database, Plus, Edit2, ArrowRight, Save, X } from 'lucide-react';
import { Table } from '../components/Table';
import { useMemo } from 'react';

type TabType = 'brands' | 'series' | 'subseries';

export const SeriesManagement: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const activeTab = (type || 'brands') as TabType;

  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [subseries, setSubseries] = useState<any[]>([]);
  
  // Edit State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, sRes, subRes] = await Promise.all([
        brandService.getAll(),
        seriesService.getAll(),
        seriesService.getAllSubseries()
      ]);
      if (bRes.success) setBrands(bRes.brands);
      if (sRes.success) setSeries(sRes.series);
      if (subRes.success) setSubseries(subRes.subseries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setIsAdding(false);
    setEditingItem(null);
  }, [activeTab]);

  const handleSave = async () => {
    try {
      if (activeTab === 'brands') {
        if (isAdding) await brandService.add({ name: newName });
        else await brandService.update(editingItem._id, newName);
      } else if (activeTab === 'series') {
        if (isAdding) await seriesService.add({ name: newName, brandId: selectedParentId });
        else await seriesService.update(editingItem._id, { name: newName, brandId: selectedParentId });
      } else if (activeTab === 'subseries') {
        if (isAdding) await seriesService.addSubseries({ name: newName, seriesId: selectedParentId });
        else await seriesService.updateSubseries(editingItem._id, { name: newName, seriesId: selectedParentId });
      }
      
      setIsAdding(false);
      setEditingItem(null);
      setNewName('');
      setSelectedParentId('');
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save");
    }
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    setIsAdding(false);
    setNewName(item.name);
    if (activeTab === 'series') setSelectedParentId(item.brand?._id || '');
    if (activeTab === 'subseries') setSelectedParentId(item.series?._id || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingItem(null);
    setNewName('');
    setSelectedParentId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tableColumns = useMemo(() => {
    if (activeTab === 'brands') return ['Name'];
    if (activeTab === 'series') return ['Name', 'Brand'];
    return ['Name', 'Series'];
  }, [activeTab]);

  const tableData = useMemo(() => {
    const raw = activeTab === 'brands' ? brands : activeTab === 'series' ? series : subseries;
    return raw.map(item => ({
      ...item,
      Name: item.name,
      Brand: item.brand?.name || item.brand || '—',
      Series: item.series?.brand?.name 
        ? `${item.series.brand.name} - ${item.series.name}` 
        : item.series?.name || '—'
    }));
  }, [activeTab, brands, series, subseries]);

  if (loading && !brands.length) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="label-xs text-slate-600">Loading Data Tools…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="badge-amber mb-3">
            <Database className="w-3 h-3" />
            Infrastructure
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white capitalize">
            {activeTab} <span className="text-amber-400">Management</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Configure collection registry and relationships.</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2.5 capitalize">
              {activeTab} Registry
            </h2>
            <button onClick={startAdd} className="btn-primary py-2 px-4 text-xs h-auto">
              <Plus className="w-3.5 h-3.5" />
              Add {activeTab === 'series' ? 'Series' : activeTab === 'subseries' ? 'Subseries' : 'Brand'}
            </button>
          </div>

          <Table 
            columns={tableColumns}
            data={tableData}
            isLoading={loading}
            actions={(item) => (
              <div className="flex justify-end pr-2">
                <button 
                  onClick={() => startEdit(item)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          />
        </div>

        {/* Edit/Add Section */}
        <div className="space-y-4">
          {(isAdding || editingItem) ? (
            <div className="card p-6 border-amber-500/20 bg-amber-500/[0.02] animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  {isAdding ? 'New' : 'Edit'} {activeTab === 'series' ? 'Series' : activeTab === 'subseries' ? 'Subseries' : 'Brand'}
                </h3>
                <button 
                  onClick={() => { setIsAdding(false); setEditingItem(null); }}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="label-xs text-slate-400 ml-1">Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="input bg-slate-950" 
                    placeholder="Enter name..."
                  />
                </div>

                {activeTab !== 'brands' && (
                  <div className="space-y-2">
                    <label className="label-xs text-slate-400 ml-1">
                      {activeTab === 'series' ? 'Parent Brand' : 'Parent Series'}
                    </label>
                    <select 
                      value={selectedParentId}
                      onChange={e => setSelectedParentId(e.target.value)}
                      className="select bg-slate-950"
                    >
                      <option value="">Select Parent...</option>
                      {(activeTab === 'series' ? brands : series).map(p => (
                        <option key={p._id} value={p._id}>
                          {activeTab === 'subseries' && p.brand?.name ? `${p.brand.name} - ${p.name}` : p.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-600 px-1 italic">
                      Changing this will "move" the {activeTab === 'series' ? 'Series' : 'Subseries'} to the new parent.
                    </p>
                  </div>
                )}

                <button 
                  onClick={handleSave}
                  disabled={!newName || (activeTab !== 'brands' && !selectedParentId)}
                  className="btn-primary w-full gap-2 mt-4"
                >
                  <Save className="w-4 h-4" />
                  {isAdding ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-8 border-dashed border-white/10 bg-transparent text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 text-slate-600">
                <ArrowRight className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-500 max-w-[150px]">
                Select an item to edit or click add to create a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
