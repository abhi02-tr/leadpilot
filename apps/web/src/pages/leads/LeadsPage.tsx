import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Send,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';

interface Lead {
  id: string;
  businessName: string;
  niche?: string | null;
  websiteUrl?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  status: string;
  qualificationScore?: number | null;
  createdAt: string;
}

export const LeadsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    businessName: '',
    websiteUrl: '',
    niche: '',
    city: '',
    region: '',
    countryCode: 'US',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    inserted: number;
    duplicates: number;
    errors: string[];
  } | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params['search'] = search;
      if (statusFilter) params['status'] = statusFilter;

      const res = await api.get('/leads', { params });
      setLeads(res.data.data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await api.post('/leads', addForm);
      setIsAddModalOpen(false);
      setAddForm({
        businessName: '',
        websiteUrl: '',
        niche: '',
        city: '',
        region: '',
        countryCode: 'US',
      });
      fetchLeads();
      navigate(`/leads/${res.data.data.id}`);
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setAddLoading(false);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportLoading(true);
    setImportSummary(null);

    // Simple client-side parse of comma-separated or tab-separated text
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      setImportSummary({
        totalRows: 0,
        inserted: 0,
        duplicates: 0,
        errors: ['CSV must have a header line and at least 1 data row.'],
      });
      setImportLoading(false);
      return;
    }

    const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('business'));
    const urlIdx = headers.findIndex((h) => h.includes('url') || h.includes('website'));
    const nicheIdx = headers.findIndex((h) => h.includes('niche') || h.includes('industry'));
    const cityIdx = headers.findIndex((h) => h.includes('city'));
    const emailIdx = headers.findIndex((h) => h.includes('email'));
    const phoneIdx = headers.findIndex((h) => h.includes('phone'));

    if (nameIdx === -1) {
      setImportSummary({
        totalRows: 0,
        inserted: 0,
        duplicates: 0,
        errors: ['Could not detect a business name column (expected "business_name" or "name").'],
      });
      setImportLoading(false);
      return;
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]!.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols[nameIdx]) {
        rows.push({
          businessName: cols[nameIdx]!,
          websiteUrl: urlIdx !== -1 ? cols[urlIdx] : undefined,
          niche: nicheIdx !== -1 ? cols[nicheIdx] : undefined,
          city: cityIdx !== -1 ? cols[cityIdx] : undefined,
          contactEmail: emailIdx !== -1 ? cols[emailIdx] : undefined,
          contactPhone: phoneIdx !== -1 ? cols[phoneIdx] : undefined,
        });
      }
    }

    try {
      const res = await api.post('/leads/import/csv', { rows });
      setImportSummary(res.data.data);
      fetchLeads();
    } catch (err) {
      setImportSummary({
        totalRows: rows.length,
        inserted: 0,
        duplicates: 0,
        errors: [getErrorMessage(err)],
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportCsv = () => {
    const wsId = currentWorkspace?.id;
    if (!wsId) return;
    window.open(`/api/v1/leads/export/csv`, '_blank');
  };

  const getScoreColor = (score?: number | null) => {
    if (score == null) return 'text-muted-foreground bg-secondary border-border';
    if (score >= 75) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (score >= 50) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Leads & Pipeline</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage target accounts, verified decision-makers, and qualification scores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by business name or domain..."
            className="w-full pl-10 pr-4 py-2 bg-secondary/40 border border-border/60 rounded-xl text-white text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter leads by pipeline status"
            className="px-3 py-2 bg-secondary/50 border border-border/60 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="ready_to_contact">Ready to Contact</option>
            <option value="contacted">Contacted</option>
            <option value="replied">Replied</option>
            <option value="not_qualified">Not Qualified</option>
            <option value="do_not_contact">Do Not Contact</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs animate-pulse">
            Loading leads...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No leads match your criteria</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add your first account manually or import a batch from a CSV file.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
            >
              Add New Lead
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold bg-secondary/20">
                  <th className="py-3.5 px-6">Company / Account</th>
                  <th className="py-3.5 px-4">Niche</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">ICP Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-xs">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="hover:bg-secondary/40 transition cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-bold">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-primary transition">
                            {lead.businessName}
                          </p>
                          {lead.websiteUrl && (
                            <a
                              href={lead.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-muted-foreground hover:text-indigo-300 flex items-center space-x-1 mt-0.5"
                            >
                              <span className="truncate max-w-[180px]">{lead.websiteUrl}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-300">
                      {lead.niche || <span className="text-muted-foreground">—</span>}
                    </td>

                    <td className="py-4 px-4 text-slate-300">
                      {[lead.city, lead.region, lead.countryCode].filter(Boolean).join(', ') || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {lead.qualificationScore != null ? (
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getScoreColor(
                            lead.qualificationScore,
                          )}`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{lead.qualificationScore}/100</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Unscored</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-secondary border border-border text-slate-300">
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/outreach?leadId=${lead.id}`}
                          className="p-1.5 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                          title="Generate AI Outreach"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/leads/${lead.id}`}
                          className="p-1.5 text-muted-foreground hover:text-white hover:bg-secondary rounded-lg transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-5 top-5 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Add Account</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add a new target account to your workspace pipeline.
            </p>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.businessName}
                  onChange={(e) => setAddForm({ ...addForm, businessName: e.target.value })}
                  placeholder="e.g. Apex Marketing Co."
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={addForm.websiteUrl}
                  onChange={(e) => setAddForm({ ...addForm, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Niche / Industry
                </label>
                <input
                  type="text"
                  value={addForm.niche}
                  onChange={(e) => setAddForm({ ...addForm, niche: e.target.value })}
                  placeholder="e.g. B2B SaaS, Digital Marketing"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    placeholder="Austin"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    State/Region
                  </label>
                  <input
                    type="text"
                    value={addForm.region}
                    onChange={(e) => setAddForm({ ...addForm, region: e.target.value })}
                    placeholder="TX"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={addForm.countryCode}
                    onChange={(e) =>
                      setAddForm({ ...addForm, countryCode: e.target.value.toUpperCase() })
                    }
                    placeholder="US"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
                >
                  {addLoading ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                setImportSummary(null);
              }}
              className="absolute right-5 top-5 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 mb-1">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Import Leads from CSV</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Paste CSV records below. Automatically deduplicates by normalized domain & name.
            </p>

            {importSummary && (
              <div
                className={`mb-4 p-3.5 rounded-xl border text-xs ${
                  importSummary.errors.length > 0
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold">
                  {importSummary.errors.length > 0 ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    Import result: {importSummary.inserted} inserted, {importSummary.duplicates}{' '}
                    duplicates skipped.
                  </span>
                </div>
                {importSummary.errors.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-0.5 text-[11px]">
                    {importSummary.errors.slice(0, 3).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form onSubmit={handleCsvImport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CSV Data (comma-separated with header)
                </label>
                <textarea
                  rows={8}
                  required
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`business_name,website_url,niche,city,email,phone\nAcme Cloud,https://acmecloud.io,B2B SaaS,San Francisco,contact@acmecloud.io,+1-415-555-0100\nBright Horizon,https://brighthorizon.org,EdTech,Boston,info@brighthorizon.org,`}
                  className="w-full px-3 py-2 bg-secondary/60 border border-border rounded-xl text-white font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-slate-300">Supported columns in header:</p>
                <p>
                  <code className="text-indigo-300">business_name</code> (required),{' '}
                  <code className="text-indigo-300">website_url</code>,{' '}
                  <code className="text-indigo-300">niche</code>,{' '}
                  <code className="text-indigo-300">city</code>,{' '}
                  <code className="text-indigo-300">email</code>,{' '}
                  <code className="text-indigo-300">phone</code>
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
                >
                  {importLoading ? 'Processing CSV...' : 'Process & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
