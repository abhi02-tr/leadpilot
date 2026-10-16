import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Target,
  Sparkles,
  Send,
  CalendarCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Plus,
  Upload,
  CheckCircle,
  Activity as ActivityIcon,
} from 'lucide-react';

interface DashboardSummary {
  totalLeads: number;
  qualifiedLeads: number;
  activeCampaigns: number;
  draftsCreated: number;
  messagesSent: number;
  repliesLogged: number;
  followUpsDueToday: number;
  followUpsOverdue: number;
  recentActivities: Array<{
    id: string;
    activityType: string;
    description: string;
    occurredAt: string;
  }>;
}

export const DashboardPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      if (!currentWorkspace) return;
      setLoading(true);
      try {
        const res = await api.get('/dashboard/summary');
        if (mounted) {
          setSummary(res.data.data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, [currentWorkspace]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary/50 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-secondary/30 rounded-2xl border border-border/50" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
        <p className="font-semibold">Unable to load dashboard metrics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const qualRate =
    summary.totalLeads > 0
      ? Math.round((summary.qualifiedLeads / summary.totalLeads) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pipeline Intelligence Active</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {currentWorkspace?.name} Overview
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Deterministic lead qualification and multi-channel outreach execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/leads"
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 flex items-center space-x-2 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </Link>
            <Link
              to="/outreach"
              className="px-4 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-slate-200 border border-border text-xs font-semibold flex items-center space-x-2 transition"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>Outreach Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="p-5 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {summary.totalLeads}
            </span>
            <span className="text-xs text-emerald-400 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> {qualRate}% qual.
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across all campaigns & uploads
          </p>
        </div>

        {/* Card 2: Qualified Leads */}
        <div className="p-5 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              High Intent (Score &ge; 60)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {summary.qualifiedLeads}
            </span>
            <span className="text-xs text-muted-foreground">qualified</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Verified website, domain & contacts
          </p>
        </div>

        {/* Card 3: Outreach Executed */}
        <div className="p-5 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Outreach Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {summary.messagesSent}
            </span>
            <span className="text-xs text-indigo-300 font-medium">
              / {summary.draftsCreated} drafts
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {summary.repliesLogged} positive replies logged
          </p>
        </div>

        {/* Card 4: Action Tasks */}
        <div className="p-5 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Follow-ups
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {summary.followUpsDueToday}
            </span>
            {summary.followUpsOverdue > 0 && (
              <span className="text-xs text-rose-400 font-semibold flex items-center">
                <AlertTriangle className="w-3 h-3 mr-0.5" />
                {summary.followUpsOverdue} overdue
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Due today or pending review
          </p>
        </div>
      </div>

      {/* Main Grid: Activity Timeline & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2.5">
              <ActivityIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Recent Workspace Activity</h3>
            </div>
            <Link
              to="/leads"
              className="text-xs text-primary hover:underline font-semibold flex items-center"
            >
              <span>View all leads</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {summary.recentActivities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No recent activity recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-200">{act.description}</p>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                        {act.activityType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 flex items-center">
                    <Clock className="w-3 h-3 mr-1 opacity-70" />
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

        {/* Quick Launch & System Health */}
        <div className="space-y-6">
          {/* Quick Launch Widget */}
          <div className="p-6 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl">
            <h3 className="font-bold text-white text-base mb-4">Quick Workflows</h3>
            <div className="space-y-2.5">
              <Link
                to="/leads"
                className="w-full p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 flex items-center justify-between text-xs font-semibold text-slate-200 transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Import Leads CSV</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition" />
              </Link>

              <Link
                to="/campaigns"
                className="w-full p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 flex items-center justify-between text-xs font-semibold text-slate-200 transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>Manage ICP Campaigns</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition" />
              </Link>

              <Link
                to="/follow-ups"
                className="w-full p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 flex items-center justify-between text-xs font-semibold text-slate-200 transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <CalendarCheck className="w-4 h-4 text-amber-400" />
                  <span>View Today's Tasks</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition" />
              </Link>
            </div>
          </div>

          {/* Engine Status */}
          <div className="p-6 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Deterministic Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Provider cascade: <span className="text-indigo-300 font-mono">Template (Active)</span> &rarr; <span className="text-slate-400 font-mono">Ollama Local</span>. No third-party API keys required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
