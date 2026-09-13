import React, { useState, useEffect } from 'react';
import { sellerService } from '../services/api';
import { Users } from 'lucide-react';

interface LinkItem {
  name: string;
  link: string;
}

interface Seller {
  _id: string;
  alias: string;
  firstName: string;
  lastName: string;
  number: string;
  email: string;
  modeOfSale: string;
  links: LinkItem[];
}

const Sellers: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [currentSeller, setCurrentSeller] = useState<Partial<Seller>>({
    alias: '',
    firstName: '',
    lastName: '',
    number: '',
    email: '',
    modeOfSale: '',
    links: [{ name: '', link: '' }]
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await sellerService.getAll();
      if (res.success) {
        setSellers(res.data);
      } else {
        setError(res.error || 'Failed to load sellers');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (seller?: Seller) => {
    if (seller) {
      setCurrentSeller(seller);
      setIsEditing(true);
    } else {
      setCurrentSeller({
        alias: '',
        firstName: '',
        lastName: '',
        number: '',
        email: '',
        modeOfSale: '',
        links: [{ name: '', link: '' }]
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleLinkChange = (index: number, field: keyof LinkItem, value: string) => {
    const newLinks = [...(currentSeller.links || [])];
    if (!newLinks[index]) newLinks[index] = { name: '', link: '' };
    newLinks[index][field] = value;
    setCurrentSeller({ ...currentSeller, links: newLinks });
  };

  const addLink = () => {
    setCurrentSeller({
      ...currentSeller,
      links: [...(currentSeller.links || []), { name: '', link: '' }]
    });
  };

  const removeLink = (index: number) => {
    const newLinks = [...(currentSeller.links || [])];
    newLinks.splice(index, 1);
    setCurrentSeller({ ...currentSeller, links: newLinks });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty links
      const dataToSubmit = {
        ...currentSeller,
        links: currentSeller.links?.filter(l => l.name || l.link) || []
      };

      if (isEditing && currentSeller._id) {
        await sellerService.update(currentSeller._id, dataToSubmit);
      } else {
        await sellerService.add(dataToSubmit);
      }
      
      setShowModal(false);
      fetchSellers();
    } catch (err: any) {
      alert(err.message || 'Error saving seller');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this seller?')) {
      try {
        await sellerService.delete(id);
        fetchSellers();
      } catch (err: any) {
        alert(err.message || 'Error deleting seller');
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="badge-amber mb-3">
            <span className="pulse-amber" />
            Seller Management
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Sellers <span className="text-amber-400">Directory</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage all your diecast sellers and contacts in one place.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary self-start md:self-auto"
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Seller
        </button>
      </header>

      <div>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading sellers...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">No sellers yet</h3>
            <p className="text-slate-500 text-sm mt-1">Add your first seller to keep track of your contacts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers.map(seller => (
              <div key={seller._id} className="card p-5 border-white/5 bg-slate-900/40 flex flex-col hover:border-amber-500/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-white">{seller.alias}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(seller)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-slate-500 hover:text-amber-400 transition-all">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(seller._id)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/5 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-all">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
                
                { (seller.firstName || seller.lastName) && (
                  <p className="text-sm text-slate-400 mb-1">
                    <span className="font-medium text-slate-500">Name:</span> {seller.firstName} {seller.lastName}
                  </p>
                )}
                { seller.email && (
                  <p className="text-sm text-slate-400 mb-1">
                    <span className="font-medium text-slate-500">Email:</span> <a href={`mailto:${seller.email}`} className="text-amber-500 hover:underline">{seller.email}</a>
                  </p>
                )}
                { seller.number && (
                  <p className="text-sm text-slate-400 mb-1">
                    <span className="font-medium text-slate-500">Phone:</span> {seller.number}
                  </p>
                )}
                
                { seller.links && seller.links.length > 0 && (
                  <div className="mt-auto pt-3 border-t border-white/5">
                    <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Links</p>
                    <div className="flex flex-wrap gap-2">
                      {seller.links.map((link, i) => (
                        <a 
                          key={i} 
                          href={link.link.startsWith('http') ? link.link : `https://${link.link}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-lg transition-colors border border-white/5 hover:border-white/10"
                        >
                          {link.name || 'Link'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleCloseModal} />
          
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur z-10">
              <h3 className="text-xl font-black text-white tracking-tight">{isEditing ? 'Edit' : 'Add New'} <span className="text-amber-400">Seller</span></h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="label-xs text-slate-500 ml-1">Alias / Display Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentSeller.alias} 
                    onChange={e => setCurrentSeller({...currentSeller, alias: e.target.value})}
                    className="input bg-white/5 border-white/10 focus:border-amber-500/50 mt-1.5"
                    placeholder="e.g., HobbySearch, John's Diecast"
                  />
                </div>
                
                <div>
                  <label className="label-xs text-slate-500 ml-1">First Name</label>
                  <input 
                    type="text" 
                    value={currentSeller.firstName} 
                    onChange={e => setCurrentSeller({...currentSeller, firstName: e.target.value})}
                    className="input bg-white/5 border-white/10 focus:border-amber-500/50 mt-1.5"
                  />
                </div>
                
                <div>
                  <label className="label-xs text-slate-500 ml-1">Last Name</label>
                  <input 
                    type="text" 
                    value={currentSeller.lastName} 
                    onChange={e => setCurrentSeller({...currentSeller, lastName: e.target.value})}
                    className="input bg-white/5 border-white/10 focus:border-amber-500/50 mt-1.5"
                  />
                </div>
                
                <div>
                  <label className="label-xs text-slate-500 ml-1">Email</label>
                  <input 
                    type="email" 
                    value={currentSeller.email} 
                    onChange={e => setCurrentSeller({...currentSeller, email: e.target.value})}
                    className="input bg-white/5 border-white/10 focus:border-amber-500/50 mt-1.5"
                  />
                </div>
                
                <div>
                  <label className="label-xs text-slate-500 ml-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={currentSeller.number} 
                    onChange={e => setCurrentSeller({...currentSeller, number: e.target.value})}
                    className="input bg-white/5 border-white/10 focus:border-amber-500/50 mt-1.5"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="label-xs text-slate-500 ml-1">Platforms & Links</label>
                  <button type="button" onClick={addLink} className="text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400">
                    + Add Link
                  </button>
                </div>
                
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  {currentSeller.links?.map((link, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        {['Website', 'WhatsApp', 'Facebook', 'Instagram', 'Reddit', 'eBay', 'X / Twitter', ''].includes(link.name) ? (
                          <select 
                            value={link.name || ''}
                            onChange={e => handleLinkChange(index, 'name', e.target.value)}
                            className="input bg-white/5 border-white/10 focus:border-amber-500/50 text-sm w-full appearance-none"
                          >
                            <option value="" disabled className="bg-slate-900 text-slate-500">Select Platform...</option>
                            <option value="Website" className="bg-slate-900 text-white">Website</option>
                            <option value="WhatsApp" className="bg-slate-900 text-white">WhatsApp</option>
                            <option value="Facebook" className="bg-slate-900 text-white">Facebook</option>
                            <option value="Instagram" className="bg-slate-900 text-white">Instagram</option>
                            <option value="Reddit" className="bg-slate-900 text-white">Reddit</option>
                            <option value="eBay" className="bg-slate-900 text-white">eBay</option>
                            <option value="X / Twitter" className="bg-slate-900 text-white">X / Twitter</option>
                            <option value="Other" className="bg-slate-900 text-white">Other...</option>
                          </select>
                        ) : (
                          <div className="flex gap-2">
                            <select 
                              value="Other"
                              onChange={e => handleLinkChange(index, 'name', e.target.value)}
                              className="input bg-white/5 border-white/10 focus:border-amber-500/50 text-sm w-1/3 appearance-none"
                            >
                              <option value="Website" className="bg-slate-900 text-white">Website</option>
                              <option value="WhatsApp" className="bg-slate-900 text-white">WhatsApp</option>
                              <option value="Facebook" className="bg-slate-900 text-white">Facebook</option>
                              <option value="Instagram" className="bg-slate-900 text-white">Instagram</option>
                              <option value="Reddit" className="bg-slate-900 text-white">Reddit</option>
                              <option value="eBay" className="bg-slate-900 text-white">eBay</option>
                              <option value="X / Twitter" className="bg-slate-900 text-white">X / Twitter</option>
                              <option value="Other" className="bg-slate-900 text-white">Other...</option>
                            </select>
                            <input 
                              type="text" 
                              placeholder="Custom Platform Name" 
                              value={link.name === 'Other' ? '' : link.name}
                              onChange={e => handleLinkChange(index, 'name', e.target.value)}
                              className="input bg-white/5 border-white/10 focus:border-amber-500/50 text-sm flex-1"
                              autoFocus
                            />
                          </div>
                        )}
                        <input 
                          type="text" 
                          placeholder="URL (e.g., https://...)" 
                          value={link.link}
                          onChange={e => handleLinkChange(index, 'link', e.target.value)}
                          className="input bg-white/5 border-white/10 focus:border-amber-500/50 text-sm"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeLink(index)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/5 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-all mt-1 flex-shrink-0"
                        title="Remove link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))}
                  {(!currentSeller.links || currentSeller.links.length === 0) && (
                    <p className="text-sm text-slate-500 text-center py-2">No links added.</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  {isEditing ? 'Save Changes' : 'Add Seller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sellers;
