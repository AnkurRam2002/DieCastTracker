import React, { useState, useEffect, useRef } from 'react';
import { wishlistService } from '../services/api';
import {
  Heart,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Upload,
  Image as ImageIcon,
  IndianRupee,
  Tag,
  FileText,
  Filter,
  Sparkles,
  Maximize2,
  Layers,
  FolderOpen,
  List,
  Store
} from 'lucide-react';

import { processAndConvertToWebP } from '../utils/imageUtils';

export interface SellerOffer {
  _id?: string;
  seller_name: string;
  price: number | string;
  link?: string;
  notes?: string;
}

export interface WishlistItem {
  _id: string;
  name?: string;
  brand?: string;
  series?: string;
  subseries?: string;
  price?: number;
  link?: string;
  sellers?: SellerOffer[];
  image?: string;
  notes?: string;
  purchased: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistStats {
  totalItems: number;
  pendingCount: number;
  purchasedCount: number;
  wishlistValue: number;
  purchasedValue: number;
  totalValue: number;
  avgPrice: number;
}

export const Wishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [stats, setStats] = useState<WishlistStats>({
    totalItems: 0,
    pendingCount: 0,
    purchasedCount: 0,
    wishlistValue: 0,
    purchasedValue: 0,
    totalValue: 0,
    avgPrice: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'purchased'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSeries, setFormSeries] = useState('');
  const [formSubseries, setFormSubseries] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formSellers, setFormSellers] = useState<SellerOffer[]>([]);
  const [formImage, setFormImage] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPurchased, setFormPurchased] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');

  // Image Lightbox state
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await wishlistService.getAll({
        search,
        statusFilter,
        sortOrder
      });
      if (res.success) {
        setItems(res.data || []);
        if (res.stats) setStats(res.stats);
      } else {
        setError(res.error || 'Failed to load wishlist items.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to connect to wishlist service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [search, statusFilter, sortOrder]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormBrand('');
    setFormSeries('');
    setFormSubseries('');
    setFormPrice('');
    setFormLink('');
    setFormSellers([{ seller_name: '', price: '', link: '', notes: '' }]);
    setFormImage('');
    setFormNotes('');
    setFormPurchased(false);
    setImageTab('upload');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: WishlistItem) => {
    setEditingItem(item);
    setFormName(item.name || '');
    setFormBrand(item.brand || '');
    setFormSeries(item.series || '');
    setFormSubseries(item.subseries || '');
    setFormPrice(item.price !== undefined && item.price !== null ? String(item.price) : '');
    setFormLink(item.link || '');

    if (item.sellers && item.sellers.length > 0) {
      setFormSellers(
        item.sellers.map((s) => ({
          seller_name: s.seller_name || '',
          price: s.price !== undefined && s.price !== null ? String(s.price) : '',
          link: s.link || '',
          notes: s.notes || ''
        }))
      );
    } else {
      setFormSellers([{ seller_name: '', price: item.price ? String(item.price) : '', link: item.link || '', notes: '' }]);
    }

    setFormImage(item.image || '');
    setFormNotes(item.notes || '');
    setFormPurchased(item.purchased || false);
    setImageTab('upload');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleAddSellerRow = () => {
    setFormSellers((prev) => [...prev, { seller_name: '', price: '', link: '', notes: '' }]);
  };

  const handleRemoveSellerRow = (index: number) => {
    setFormSellers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSellerChange = (index: number, field: keyof SellerOffer, value: string) => {
    setFormSellers((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('Please select a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setModalError('Image file is too large (max 10MB)');
      return;
    }

    try {
      const webpDataUrl = await processAndConvertToWebP(file, 800, 800, 0.75);
      setFormImage(webpDataUrl);
      setModalError('');
    } catch (err: any) {
      setModalError(err?.message || 'Failed to process image file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const validSellers = formSellers
        .filter((s) => s.seller_name.trim() || s.price || s.link)
        .map((s) => ({
          seller_name: s.seller_name.trim(),
          price: s.price ? parseFloat(String(s.price)) : 0,
          link: s.link ? s.link.trim() : '',
          notes: s.notes ? s.notes.trim() : ''
        }));

      // Sync top-level link with first valid seller link or formLink
      const firstValidSellerLink = validSellers.find(s => s.link && s.link.trim())?.link || formLink || '';

      const payload = {
        name: formName,
        brand: formBrand,
        series: formSeries,
        subseries: formSubseries,
        price: formPrice ? parseFloat(formPrice) : 0,
        link: firstValidSellerLink,
        sellers: validSellers,
        image: formImage,
        notes: formNotes,
        purchased: formPurchased
      };

      if (editingItem) {
        const res = await wishlistService.update(editingItem._id, payload);
        if (res.success) {
          setIsModalOpen(false);
          fetchWishlist();
        } else {
          setModalError(res.error || 'Failed to update item.');
        }
      } else {
        const res = await wishlistService.add(payload);
        if (res.success) {
          setIsModalOpen(false);
          fetchWishlist();
        } else {
          setModalError(res.error || 'Failed to create wishlist item.');
        }
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleTogglePurchased = async (item: WishlistItem) => {
    try {
      const updatedPurchased = !item.purchased;
      const res = await wishlistService.update(item._id, { purchased: updatedPurchased });
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, purchased: updatedPurchased } : i))
        );
        fetchWishlist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to remove this item from your wishlist?')) return;
    try {
      const res = await wishlistService.delete(itemId);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i._id !== itemId));
        fetchWishlist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-amber">
              <Sparkles className="w-3 h-3 text-amber-400" /> Wishlist & Price Tracker
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Wishlist & Price Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track collectibles you're hunting for, compare multiple seller price quotes, and store purchase links.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn-primary shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add to Wishlist
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Wishlist</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalItems}</div>
          <div className="text-xs text-slate-500 mt-1">Items tracked</div>
        </div>

        <div className="card p-5 border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Target Hunt Value</span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">₹{stats.wishlistValue.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.pendingCount} pending items</div>
        </div>

        <div className="card p-5 border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Acquired / Purchased</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.purchasedCount}</div>
          <div className="text-xs text-slate-500 mt-1">₹{stats.purchasedValue.toLocaleString('en-IN')} spent</div>
        </div>

        <div className="card p-5 border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Average Price</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">₹{stats.avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          <div className="text-xs text-slate-500 mt-1">Per collectible</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card p-4 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, brand, seller, series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 py-2.5 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-900/80 border border-white/5 rounded-2xl p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({stats.totalItems})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hunting ({stats.pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('purchased')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'purchased'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Purchased ({stats.purchasedCount})
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="select text-xs py-2 px-3 bg-slate-900/80 border-white/5 rounded-xl text-slate-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading your wishlist...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center border border-red-500/20 bg-red-500/5 text-red-400">
          <p className="font-semibold">{error}</p>
          <button onClick={fetchWishlist} className="btn-ghost mt-4 text-xs">
            Retry Loading
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center border border-white/5 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Wishlist Items Found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm">
              {search || statusFilter !== 'all'
                ? 'No items match your current filter criteria.'
                : 'Your wishlist is empty. Start adding items you wish to buy or track!'}
            </p>
          </div>
          <button onClick={handleOpenAddModal} className="btn-primary text-xs">
            <Plus className="w-4 h-4 mr-1" /> Add Your First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className={`card group border transition-all duration-300 flex flex-col overflow-hidden relative ${
                item.purchased
                  ? 'border-emerald-500/20 bg-emerald-950/10'
                  : 'border-white/5 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5'
              }`}
            >
              {/* Top Banner Badges */}
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                {item.purchased ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/90 text-slate-950 backdrop-blur shadow-md flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Acquired
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/90 text-slate-950 backdrop-blur shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Wishlist
                  </span>
                )}

                {item.price ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-950/80 text-amber-400 border border-amber-500/30 backdrop-blur shadow-md">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                ) : null}
              </div>

              {/* Image Box */}
              <div className="relative aspect-square w-full bg-slate-950/60 overflow-hidden group/img">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name || 'Wishlist item'}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => setActiveLightboxImage(item.image || null)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-4">
                    <ImageIcon className="w-12 h-12 mb-2 stroke-[1.5]" />
                    <span className="text-xs font-semibold">No Image Uploaded</span>
                  </div>
                )}

                {item.image && (
                  <button
                    onClick={() => setActiveLightboxImage(item.image || null)}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur border border-white/10 hover:text-amber-400"
                    title="Enlarge Image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  {(item.brand || item.series || item.subseries) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.brand && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Layers className="w-3 h-3" />
                          {item.brand}
                        </span>
                      )}
                      {item.series && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                          <FolderOpen className="w-3 h-3 text-slate-400" />
                          {item.series}
                        </span>
                      )}
                      {item.subseries && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                          <List className="w-3 h-3 text-slate-500" />
                          {item.subseries}
                        </span>
                      )}
                    </div>
                  )}

                  <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                    {item.name || 'Untitled Collectible'}
                  </h3>

                  {/* Sellers Quotes List */}
                  {item.sellers && item.sellers.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Store className="w-3 h-3 text-amber-400" /> Sellers & Price Quotes
                      </div>
                      <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-white/5 text-xs">
                        {item.sellers.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-white/5 last:border-0">
                            <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                              {s.seller_name || 'Seller'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-amber-400">
                                {s.price ? `₹${Number(s.price).toLocaleString('en-IN')}` : 'N/A'}
                              </span>
                              {s.link && (
                                <a
                                  href={s.link.startsWith('http') ? s.link : `https://${s.link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-400 hover:text-amber-300"
                                  title={`View offer on ${s.seller_name}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <div>
                    {(() => {
                      const isValidUrl = (url?: string): boolean => {
                        if (!url) return false;
                        const clean = url.trim();
                        if (!clean || clean === 'undefined' || clean === 'null') return false;
                        return clean.includes('.') || clean.startsWith('http://') || clean.startsWith('https://');
                      };

                      const effectiveLink = (item.sellers && item.sellers.length > 0)
                        ? item.sellers.find(s => isValidUrl(s.link))?.link?.trim()
                        : (isValidUrl(item.link) ? item.link?.trim() : null);

                      if (!effectiveLink) return null;

                      return (
                        <a
                          href={effectiveLink.startsWith('http') ? effectiveLink : `https://${effectiveLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/5 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors border border-amber-500/20 text-xs font-bold flex items-center gap-1"
                          title="Open Source Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Source</span>
                        </a>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Purchased */}
                    <button
                      onClick={() => handleTogglePurchased(item)}
                      className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1 ${
                        item.purchased
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      title={item.purchased ? 'Mark as Hunting' : 'Mark as Purchased'}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors border border-white/5"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-white/5"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="card card-accent w-full max-w-4xl p-6 sm:p-8 relative my-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className="mb-6">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-400" />
                {editingItem ? 'Edit Wishlist Item' : 'Add Item to Wishlist'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Upload image, specify item details, add multiple sellers with price quotes, and track purchase links.
              </p>
            </div>

            {/* Modal Error */}
            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-5 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Horizontal 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Column: Image Upload & Preview (5 cols) */}
                <div className="md:col-span-5 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 label-xs">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      Collectible Image
                    </label>

                    <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setImageTab('upload')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          imageTab === 'upload' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageTab('url')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          imageTab === 'url' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        Paste URL
                      </button>
                    </div>
                  </div>

                  {imageTab === 'upload' ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border-2 border-dashed border-white/10 hover:border-amber-500/50 bg-slate-950/60 rounded-2xl p-4 text-center cursor-pointer transition-colors relative flex flex-col items-center justify-center min-h-[240px]"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {formImage ? (
                        <div className="relative group/preview w-full h-full min-h-[220px] flex items-center justify-center">
                          <img
                            src={formImage}
                            alt="Preview"
                            className="max-h-56 w-auto rounded-xl object-contain border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormImage('');
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-red-400 hover:text-red-300 backdrop-blur"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-slate-400 p-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-2">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-200">
                            Click to upload or drag & drop image
                          </p>
                          <p className="text-[11px] text-slate-500">PNG, JPG, WEBP or GIF (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 flex flex-col">
                      <input
                        type="url"
                        placeholder="https://example.com/item-image.jpg"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        className="input text-xs py-2.5"
                      />
                      {formImage ? (
                        <div className="relative flex-1 bg-slate-950 p-2 rounded-2xl border border-white/5 flex items-center justify-center min-h-[200px]">
                          <img src={formImage} alt="URL preview" className="max-h-48 rounded-lg object-contain" />
                        </div>
                      ) : (
                        <div className="flex-1 bg-slate-950/40 rounded-2xl border border-white/5 flex items-center justify-center text-slate-600 text-xs min-h-[200px]">
                          Paste image URL above to preview
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Fields (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  
                  {/* Brand & Item Name Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Brand (Optional) */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 label-xs">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        Brand <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hot Wheels, Mini GT, Inno64"
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        className="input text-xs py-2.5"
                      />
                    </div>

                    {/* Item Name (Optional) */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 label-xs">
                        <Tag className="w-3.5 h-3.5 text-amber-500" />
                        Item Name <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nissan Skyline GT-R R34"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="input text-xs py-2.5"
                      />
                    </div>
                  </div>

                  {/* Series & Subseries Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Series (Optional) */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 label-xs">
                        <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                        Series <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Car Culture, Mainline 2024"
                        value={formSeries}
                        onChange={(e) => setFormSeries(e.target.value)}
                        className="input text-xs py-2.5"
                      />
                    </div>

                    {/* Subseries (Optional) */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 label-xs">
                        <List className="w-3.5 h-3.5 text-amber-500" />
                        Subseries <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HW Exotics, Circuit Legends"
                        value={formSubseries}
                        onChange={(e) => setFormSubseries(e.target.value)}
                        className="input text-xs py-2.5"
                      />
                    </div>
                  </div>

                  {/* Dynamic Sellers List */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 label-xs text-amber-400">
                        <Store className="w-4 h-4 text-amber-400" />
                        Sellers & Price Quotes <span className="text-slate-500">(Multiple Sellers Supported)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSellerRow}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Seller
                      </button>
                    </div>

                    <div className="space-y-3 pt-1">
                      {formSellers.map((seller, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 p-3 rounded-xl border border-white/5 relative group">
                          {/* Seller Name */}
                          <div className="col-span-5">
                            <input
                              type="text"
                              placeholder="Seller Name (e.g. Trayansh, eBay)"
                              value={seller.seller_name}
                              onChange={(e) => handleSellerChange(idx, 'seller_name', e.target.value)}
                              className="input text-xs py-2"
                            />
                          </div>

                          {/* Price */}
                          <div className="col-span-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                placeholder="Price"
                                value={seller.price}
                                onChange={(e) => handleSellerChange(idx, 'price', e.target.value)}
                                className="input text-xs py-2 pl-6"
                              />
                            </div>
                          </div>

                          {/* Source Link */}
                          <div className="col-span-3">
                            <input
                              type="text"
                              placeholder="Link URL"
                              value={seller.link}
                              onChange={(e) => handleSellerChange(idx, 'link', e.target.value)}
                              className="input text-xs py-2"
                            />
                          </div>

                          {/* Delete Seller Row */}
                          <div className="col-span-1 text-right">
                            {formSellers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSellerRow(idx)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                title="Remove Seller"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 label-xs">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      Notes / Condition Info <span className="text-slate-500">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Seller quoted ₹1500 shipped, mint condition on card..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="input text-xs py-2 resize-none"
                    />
                  </div>

                  {/* Purchased Toggle */}
                  <div className="flex items-center justify-between bg-slate-900/90 border border-white/5 p-3.5 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className={`w-4 h-4 ${formPurchased ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">Mark as Purchased</div>
                        <div className="text-[11px] text-slate-500">Item already acquired into collection</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formPurchased}
                      onChange={(e) => setFormPurchased(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                </div>
              </div>

              {/* Buttons Row */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost flex-1 text-xs py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-primary flex-[2] justify-center text-xs py-3"
                >
                  {modalLoading ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : editingItem ? (
                    'Save Changes'
                  ) : (
                    'Add to Wishlist'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-2xl bg-black/60 text-white hover:text-amber-400 border border-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeLightboxImage}
              alt="Wishlist collectible enlarged"
              className="max-h-[85vh] w-auto object-contain mx-auto rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
