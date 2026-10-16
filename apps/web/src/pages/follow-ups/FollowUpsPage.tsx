import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building,
  X,
} from 'lucide-react';

interface FollowUp {
  id: string;
  leadId: string;
  campaignId?: string | null;
  title: string;
  notes?: string | null;
  dueAt: string;
  status: 'open' | 'completed' | 'cancelled';
  completedAt?: string | null;
}

interface LeadOption {
  id: string;
  businessName: string;
}

export const FollowUpsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [tasks, setTasks] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [view, setView] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const res = await api.get('/follow-ups', { params: { view } });
      setTasks(res.data.data.items || res.data.data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, view]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!currentWorkspace) return;
    api
      .get('/leads?limit=100')
      .then((res) => {
        setLeads(res.data.data);
        if (res.data.data.length > 0) setLeadId(res.data.data[0].id);
      })
      .catch(() => {});
  }, [currentWorkspace]);

  const handleComplete = async (taskId: string) => {
    try {
      await api.post(`/follow-ups/${taskId}/complete`);
      fetchTasks();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleCancel = async (taskId: string) => {
    try {
      await api.post(`/follow-ups/${taskId}/cancel`);
      fetchTasks();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !title) return;
    setSaving(true);
    try {
      await api.post('/follow-ups', {
        leadId,
        title,
        dueAt: new Date(dueAt).toISOString(),
      });
      setIsModalOpen(false);
      setTitle('');
      fetchTasks();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Follow-up Tasks</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Never lose momentum with scheduled touches, check-ins, and reminders.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 flex items-center space-x-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border/80 pb-2">
        {(['today', 'overdue', 'upcoming', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
              view === tab
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-white hover:bg-secondary/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-xs animate-pulse">
          Loading tasks...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="p-16 text-center space-y-3 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No tasks in this view</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You're all caught up! Create a new task or switch views to review upcoming follow-ups.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-xl flex items-center justify-between gap-4 hover:border-indigo-500/30 transition group"
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <button
                  onClick={() => handleComplete(task.id)}
                  disabled={task.status === 'completed'}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                    task.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-muted-foreground hover:border-primary text-transparent hover:text-primary'
                  }`}
                  title="Mark Task Completed"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>

                <div className="truncate">
                  <p
                    className={`font-semibold text-sm ${
                      task.status === 'completed'
                        ? 'line-through text-muted-foreground'
                        : 'text-white'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>
                    </span>
                    <Link
                      to={`/leads/${task.leadId}`}
                      className="text-primary hover:underline flex items-center space-x-1"
                    >
                      <Building className="w-3 h-3" />
                      <span>View Account</span>
                    </Link>
                  </div>
                </div>
              </div>

              {task.status === 'open' && (
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition cursor-pointer"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleCancel(task.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition cursor-pointer"
                    title="Cancel Task"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Add Follow-up Task</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Schedule a reminder to contact or review an account.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Account *
                </label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.businessName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Call CEO to follow up on cold email"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
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
                  {saving ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
