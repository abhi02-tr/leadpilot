import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import {
  ArrowLeft,
  Building,
  Globe,
  MapPin,
  ExternalLink,
  Sparkles,
  Send,
  CalendarCheck,
  UserPlus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface Contact {
  id: string;
  contactType: string;
  value: string;
  verificationStatus: string;
}

interface Signal {
  name: string;
  passed: boolean;
  score: number;
  reason: string;
}

interface QualificationResult {
  score: number;
  signals: Signal[];
  reasoningSummary: string;
  createdAt: string;
}

interface Activity {
  id: string;
  activityType: string;
  description: string;
  occurredAt: string;
}

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [qualification, setQualification] = useState<QualificationResult | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [qualifying, setQualifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Contact form
  const [contactType, setContactType] = useState('email');
  const [contactValue, setContactValue] = useState('');

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );

  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [leadRes, contactsRes, qualRes, actsRes] = await Promise.allSettled([
        api.get(`/leads/${id}`),
        api.get(`/leads/${id}/contacts`),
        api.get(`/leads/${id}/qualification`),
        api.get(`/leads/${id}/activities`),
      ]);

      if (leadRes.status === 'fulfilled') setLead(leadRes.value.data.data);
      if (contactsRes.status === 'fulfilled') setContacts(contactsRes.value.data.data || []);
      if (qualRes.status === 'fulfilled') setQualification(qualRes.value.data.data);
      if (actsRes.status === 'fulfilled') setActivities(actsRes.value.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRunQualification = async () => {
    if (!id) return;
    setQualifying(true);
    try {
      const res = await api.post(`/leads/${id}/qualification`, {});
      setQualification(res.data.data);
      // Reload lead and activities to reflect updated score
      loadAll();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setQualifying(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !contactValue) return;
    try {
      await api.post(`/leads/${id}/contacts`, {
        contactType,
        value: contactValue,
      });
      setIsContactModalOpen(false);
      setContactValue('');
      loadAll();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!id) return;
    try {
      await api.delete(`/leads/${id}/contacts/${contactId}`);
      loadAll();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !taskTitle) return;
    try {
      await api.post(`/follow-ups`, {
        leadId: id,
        title: taskTitle,
        dueAt: new Date(taskDueDate).toISOString(),
      });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      loadAll();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteLead = async () => {
    if (!id || !confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      navigate('/leads');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground text-xs animate-pulse">
        Loading lead details...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-8 text-center text-rose-400 text-xs">
        {error || 'Lead not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top back nav & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/leads"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-muted-foreground hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leads</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Task</span>
          </button>

          <Link
            to={`/outreach?leadId=${lead.id}`}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 flex items-center space-x-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Outreach Studio</span>
          </Link>

          <button
            onClick={handleDeleteLead}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition cursor-pointer"
            title="Delete Account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 font-bold">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">{lead.businessName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-secondary border border-border text-slate-300">
                  {lead.status.replace(/_/g, ' ')}
                </span>
                {lead.doNotContact && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    DNC / Suppressed
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                {lead.websiteUrl && (
                  <a
                    href={lead.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-indigo-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{lead.websiteUrl}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {(lead.city || lead.region) && (
                  <span className="flex items-center space-x-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{[lead.city, lead.region, lead.countryCode].filter(Boolean).join(', ')}</span>
                  </span>
                )}
                {lead.niche && (
                  <span className="text-slate-300 px-2 py-0.5 bg-secondary/60 rounded-md border border-border/50 text-[11px]">
                    {lead.niche}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Qualification Score Gauge */}
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-secondary/30 border border-border/60 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Qualification Score
              </span>
              <span
                className={`text-2xl font-extrabold ${
                  (lead.qualificationScore ?? 0) >= 70
                    ? 'text-emerald-400'
                    : (lead.qualificationScore ?? 0) >= 50
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {lead.qualificationScore != null ? `${lead.qualificationScore} / 100` : 'Not Scored'}
              </span>
            </div>
            <button
              onClick={handleRunQualification}
              disabled={qualifying}
              className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-50"
              title="Re-run Deterministic Qualification"
            >
              <RefreshCw className={`w-4 h-4 ${qualifying ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Qualification Breakdown & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Qualification Breakdown (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-base">ICP Qualification Signals</h3>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                Model: Deterministic 1.0
              </span>
            </div>

            {qualification ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 text-xs text-slate-300">
                  <p className="font-semibold text-white mb-1">Reasoning Summary:</p>
                  <p>{qualification.reasoningSummary}</p>
                </div>

                <div className="space-y-2.5">
                  {(qualification.signals || []).map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-secondary/20 border border-border/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        {sig.passed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-white">{sig.name}</p>
                          <p className="text-[11px] text-muted-foreground">{sig.reason}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-indigo-300">+{sig.score} pts</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Deterministic qualification estimate based on evidence signals. Not an automated guarantee of conversion.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                <p>This lead has not yet been qualified through the ICP engine.</p>
                <button
                  onClick={handleRunQualification}
                  disabled={qualifying}
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
                >
                  {qualifying ? 'Evaluating...' : 'Run Qualification Engine'}
                </button>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="p-6 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl">
            <h3 className="font-bold text-white text-base mb-4">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activities logged yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-secondary/30 border border-border/40 flex items-start justify-between text-xs"
                  >
                    <div>
                      <p className="font-medium text-slate-200">{act.description}</p>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        {act.activityType.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1 opacity-60" />
                      {new Date(act.occurredAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contacts (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Key Contacts</h3>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-primary text-xs flex items-center space-x-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs space-y-2">
                <p>No verified contacts yet.</p>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="text-primary hover:underline font-semibold"
                >
                  Add primary decision maker
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-secondary/40 border border-border/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        {c.contactType === 'email' ? (
                          <Mail className="w-3.5 h-3.5" />
                        ) : (
                          <Phone className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-slate-200 truncate">{c.value}</p>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {c.contactType} &bull; {c.verificationStatus}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteContact(c.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition ml-2 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute right-5 top-5 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-3">Add Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Type
                </label>
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Value</label>
                <input
                  type="text"
                  required
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={contactType === 'email' ? 'name@company.com' : '+1-555-0199'}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute right-5 top-5 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-3">Add Follow-up Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Follow up on proposal sent"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
