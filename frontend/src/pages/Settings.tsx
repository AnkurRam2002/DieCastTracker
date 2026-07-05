import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { User, Mail, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, login, token } = useAuth();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.profile();
        if (res.success && res.user) {
          setEmail(res.user.email || '');
          // Update context with latest user data if we want to
          if (token) login(token, { ...user, ...res.user });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await authService.updatePreferences({ email });
      if (res.success) {
        setMessage({ text: 'Settings saved successfully!', type: 'success' });
        if (token && res.user) {
          login(token, { ...user, ...res.user });
        }
      } else {
        setMessage({ text: res.error || 'Failed to save settings.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.error || 'An error occurred.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col gap-2">
        <div className="badge-amber self-start mb-2">
          <span className="pulse-amber" />
          Account Settings
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">
          Your <span className="text-amber-400">Profile</span>
        </h1>
        <p className="text-slate-500 font-medium">Manage your personal information and preferences.</p>
      </header>

      <div className="card p-6 border-white/5 bg-slate-900/40 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-white/5">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-2xl">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.username || 'User'}</h2>
            <p className="text-sm text-slate-400">Member</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="input pl-11 bg-slate-900/60 text-slate-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-500 ml-1">Your username cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="input pl-11"
              />
            </div>
            <p className="text-xs text-slate-500 ml-1">We'll use this for account recovery and notifications.</p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {message.text}
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
