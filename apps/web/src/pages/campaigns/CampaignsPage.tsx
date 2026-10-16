import React, { useEffect, useState, useCallback } from 'react';
import { api, getErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Target,
  Plus,
  X,
  Mail,
  Send,
  Sparkles,
  Archive,
  Layers,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  niche: string;
  offer: string;
  status: string;
  objective?: string | null;
  channels?: string[] | null;
  language?: string | null;
  tone?: string | null;
  createdAt: string;
}

export const CampaignsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    niche: '',
    offer: '',
    objective: 'start_conversation',
    language: 'english',
    tone: 'consultative',
    channels: ['email'],
  });
  const [saving, setSaving] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data.data.items || res.data.data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/campaigns', form);
      setIsModalOpen(false);
      setForm({
        name: '',
        niche: '',
        offer: '',
        objective: 'start_conversation',
        language: 'english',
        tone: 'consultative',
        channels: ['email'],
      });
      fetchCampaigns();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const toggleChannel = (ch: string) => {
    if (form.channels.includes(ch)) {
      if (form.channels.length > 1) {
        setForm({ ...form, channels: form.channels.filter((c) => c !== ch) });
      }
    } else {
      setForm({ ...form, channels: [...form.channels, ch] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Campaigns & ICP Criteria</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Define target niches, value propositions, and qualification requirements.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 flex items-center space-x-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaign Cards List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-xs animate-pulse">
          Loading campaigns...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
      ) : campaigns.length === 0 ? (
        <div className="p-16 text-center space-y-3 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Target className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No campaigns created yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create an ICP campaign to start organizing accounts and tailoring outreach messaging.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl flex flex-col justify-between hover:border-indigo-500/30 transition group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-secondary text-muted-foreground border border-border'
                    }`}
                  >
                    {c.status}
                  </span>
                  <button
                    onClick={() => handleArchive(c.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                    title="Archive Campaign"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-bold text-white text-lg tracking-tight mb-1 group-hover:text-primary transition">
                  {c.name}
                </h3>
                <p className="text-xs text-indigo-300 font-medium mb-3">{c.niche}</p>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 text-xs text-slate-300 mb-4">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                    Value Proposition / Offer:
                  </p>
                  <p className="line-clamp-2">{c.offer}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="capitalize">{c.tone || 'Consultative'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {(c.channels || ['email']).map((ch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-secondary text-[10px] text-slate-300 capitalize"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Create ICP Campaign</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Set up targeting criteria and positioning for outreach.
            </p>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. B2B SaaS Founders Q4"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Niche / Industry *
                </label>
                <input
                  type="text"
                  required
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                  placeholder="e.g. Fintech, Healthcare, Digital Marketing"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Offer / Core Proposition *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.offer}
                  onChange={(e) => setForm({ ...form, offer: e.target.value })}
                  placeholder="e.g. AI pipeline automation that doubles qualified booked meetings"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tone of Voice
                  </label>
                  <select
                    value={form.tone}
                    onChange={(e) => setForm({ ...form, tone: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="consultative">Consultative</option>
                    <option value="conversational">Conversational</option>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="gujarati">Gujarati</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Channels
                </label>
                <div className="flex items-center space-x-2">
                  {['email', 'whatsapp', 'instagram'].map((ch) => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition cursor-pointer ${
                        form.channels.includes(ch)
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                          : 'bg-secondary border-border text-muted-foreground'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
