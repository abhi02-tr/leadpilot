import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  Mail,
  Instagram,
  Phone,
  AlertCircle,
  ShieldCheck,
  Building,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface LeadOption {
  id: string;
  businessName: string;
  niche?: string | null;
  websiteUrl?: string | null;
  city?: string | null;
  countryCode?: string | null;
}

interface CampaignOption {
  id: string;
  name: string;
  offer: string;
  niche: string;
}

interface GeneratedMessage {
  id?: string;
  subject?: string;
  body: string;
  channel: string;
  language: string;
  tone: string;
  provider?: string;
}

export const OutreachStudioPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedLeadId = searchParams.get('leadId');

  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(preselectedLeadId || '');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  // Generation options
  const [channel, setChannel] = useState<'email' | 'instagram' | 'whatsapp'>('email');
  const [language, setLanguage] = useState<'english' | 'hindi' | 'gujarati' | 'hinglish'>('english');
  const [tone, setTone] = useState<'conversational' | 'consultative' | 'professional' | 'friendly' | 'direct'>('consultative');
  const [length, setLength] = useState<'short' | 'standard' | 'detailed'>('standard');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMessage, setActiveMessage] = useState<GeneratedMessage | null>(null);
  const [copied, setCopied] = useState(false);
  const [sentConfirmed, setSentConfirmed] = useState(false);

  // Load leads and campaigns
  useEffect(() => {
    if (!currentWorkspace) return;
    const loadData = async () => {
      try {
        const [leadsRes, campsRes] = await Promise.all([
          api.get('/leads?limit=100'),
          api.get('/campaigns?limit=50'),
        ]);
        const leadList = leadsRes.data.data;
        setLeads(leadList);
        if (!selectedLeadId && leadList.length > 0) {
          setSelectedLeadId(leadList[0].id);
        }

        const campList = campsRes.data.data.items || campsRes.data.data;
        setCampaigns(campList);
        if (!selectedCampaignId && campList.length > 0) {
          setSelectedCampaignId(campList[0].id);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    loadData();
  }, [currentWorkspace, selectedLeadId, selectedCampaignId]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  const handleGenerate = async () => {
    if (!selectedLeadId) {
      setError('Please select a target lead');
      return;
    }

    setGenerating(true);
    setError(null);
    setCopied(false);
    setSentConfirmed(false);

    try {
      // 1. Request generation from AI endpoint
      const genRes = await api.post('/ai/generate-outreach', {
        leadId: selectedLeadId,
        campaignId: selectedCampaignId || undefined,
        channel,
        language,
        tone,
        objective: 'start_conversation',
        length,
      });

      const message = genRes.data.data.message;

      setActiveMessage({
        id: message.id,
        subject: message.subject,
        body: message.content,
        channel: message.channel,
        language: message.language || language,
        tone: message.tone || tone,
        provider: message.provider,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!activeMessage) return;
    const fullText = activeMessage.subject
      ? `Subject: ${activeMessage.subject}\n\n${activeMessage.body}`
      : activeMessage.body;

    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    // Explicit copy event logging
    if (activeMessage.id) {
      try {
        await api.post(`/outreach/messages/${activeMessage.id}/copy-log`);
      } catch {
        // ignore
      }
    }
  };

  const handleMarkSent = async () => {
    if (!activeMessage?.id) return;
    try {
      await api.post(`/outreach/messages/${activeMessage.id}/mark-sent`);
      setSentConfirmed(true);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deterministic + AI Outreach Studio</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">AI Outreach Studio</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Generate fact-verified, multi-channel personalized outreach drafts without hallucination.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl space-y-4">
            <h3 className="font-bold text-white text-base">Configuration & Target</h3>

            {/* Lead Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Lead / Company *
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.businessName} {l.niche ? `(${l.niche})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Campaign / Offer Context
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
              >
                <option value="">None (Use general value proposition)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} &bull; {c.niche}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Outreach Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'whatsapp', label: 'WhatsApp', icon: Phone },
                  { id: 'instagram', label: 'Instagram', icon: Instagram },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = channel === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setChannel(item.id as any)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition cursor-pointer text-xs ${
                        isSel
                          ? 'bg-indigo-500/20 border-indigo-500 text-white font-semibold shadow-sm'
                          : 'bg-secondary/60 border-border text-muted-foreground hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language & Tone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary capitalize"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="gujarati">Gujarati</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary capitalize"
                >
                  <option value="consultative">Consultative</option>
                  <option value="conversational">Conversational</option>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
            </div>

            {/* Length */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message Length</label>
              <div className="grid grid-cols-3 gap-2">
                {['short', 'standard', 'detailed'].map((len) => (
                  <button
                    type="button"
                    key={len}
                    onClick={() => setLength(len as any)}
                    className={`py-1.5 rounded-xl border capitalize text-xs transition cursor-pointer ${
                      length === len
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-secondary/60 border-border text-muted-foreground'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Trigger Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedLeadId}
              className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-xl shadow-primary/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer pt-3"
            >
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Composing verified message...' : 'Generate Outreach Draft'}</span>
            </button>
          </div>

          {/* Fact Guarantee Card */}
          <div className="p-5 rounded-3xl bg-secondary/30 border border-border/60 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Fact-Verified Generation Contract</span>
            </div>
            <p className="leading-relaxed">
              Every message strictly utilizes verified lead facts (business name, niche, location, active website). No fabricated numbers or claims are ever inserted.
            </p>
          </div>
        </div>

        {/* Right Output Panel (7 cols) */}
        <div className="lg:col-span-7">
          <div className="p-6 md:p-8 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl h-full flex flex-col justify-between shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-6">
                <div>
                  <h3 className="font-bold text-white text-base">Message Workspace & Preview</h3>
                  <p className="text-xs text-muted-foreground">
                    Review and personalize before copying or sending.
                  </p>
                </div>

                {activeMessage && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleMarkSent}
                      disabled={sentConfirmed}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                        sentConfirmed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{sentConfirmed ? 'Marked as Sent' : 'Mark as Sent'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Display */}
              {activeMessage ? (
                <div className="space-y-4">
                  {/* Subject if channel is email */}
                  {channel === 'email' && (
                    <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                        Subject Line
                      </span>
                      <input
                        type="text"
                        value={activeMessage.subject || ''}
                        onChange={(e) =>
                          setActiveMessage({ ...activeMessage, subject: e.target.value })
                        }
                        className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Body Editor */}
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-2">
                      Message Content ({channel.toUpperCase()} &bull; {language.toUpperCase()})
                    </span>
                    <textarea
                      rows={12}
                      value={activeMessage.body}
                      onChange={(e) =>
                        setActiveMessage({ ...activeMessage, body: e.target.value })
                      }
                      className="w-full bg-transparent text-white text-sm leading-relaxed resize-none focus:outline-none font-sans"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                    <Send className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h4 className="text-base font-bold text-white">No draft generated yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Select a target account on the left and click "Generate Outreach Draft" to compose a personalized opening pitch.
                  </p>
                </div>
              )}
            </div>

            {/* Footer with lead preview */}
            {selectedLead && (
              <div className="pt-4 border-t border-border/60 mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-300">{selectedLead.businessName}</span>
                  {selectedLead.city && <span>&bull; {selectedLead.city}</span>}
                </div>
                <Link
                  to={`/leads/${selectedLead.id}`}
                  className="text-primary hover:underline flex items-center space-x-1"
                >
                  <span>View lead details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
