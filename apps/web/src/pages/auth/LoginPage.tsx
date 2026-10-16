import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Compass, Sparkles, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@leadpilot.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-card/60 backdrop-blur-2xl">
        {/* Left Side: Brand & Feature highlight */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-950/60 via-slate-900/40 to-slate-950 border-r border-border/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">LeadPilot</span>
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Assisted Lead Acceleration</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug mb-4">
              Turn cold databases into qualified pipelines.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              LeadPilot automates verified lead qualification, deterministic ICP scoring, and
              multi-channel outreach drafts — ensuring your agency focuses strictly on high-intent
              meetings.
            </p>

            <div className="space-y-3">
              {[
                'Deterministic 0–100 Qualification Engine',
                'Multi-channel AI Studio (Email, WhatsApp, IG)',
                'Automated Follow-up Tasks & Activity Tracking',
                'Built-in Tenant Isolation & DNC Suppression',
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 LeadPilot AI Inc.</span>
            <span>Enterprise Grade</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">Sign In</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your credentials to access your workspaces.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@agency.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-lg shadow-primary/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Quick Demo Fill button */}
            <div className="mt-5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-300">Quick Test Credentials</p>
                <p className="text-[11px] text-muted-foreground">demo@leadpilot.com / Password123!</p>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="px-2.5 py-1 text-xs font-medium bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-lg transition"
              >
                Auto-fill
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Create new workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
