import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  ShieldCheck,
  Cpu,
  Database,
  CheckCircle2,
  Sparkles,
  Lock,
  Globe,
  Sliders,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentWorkspace, user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Workspace Settings</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Organization identity, AI inference configuration, and compliance settings.
        </p>
      </div>

      {/* Workspace Profile */}
      <div className="p-6 md:p-8 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl space-y-5">
        <div className="flex items-center space-x-3 pb-4 border-b border-border/60">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-base">Organization Profile</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Workspace Name
            </span>
            <p className="text-sm font-semibold text-white">{currentWorkspace?.name}</p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Workspace Identifier (Slug)
            </span>
            <p className="text-sm font-mono text-indigo-300">{currentWorkspace?.slug}</p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Your Role
            </span>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold uppercase text-[10px]">
              {currentWorkspace?.role}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Active Member
            </span>
            <p className="text-sm text-slate-300">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* AI Provider Architecture */}
      <div className="p-6 md:p-8 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center space-x-3">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">AI Engine Architecture</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
            HEALTHY
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-secondary/30 border border-indigo-500/30 flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Deterministic Template Engine (Active)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Default zero-dependency AI engine. Operates deterministically with multi-language
                  support (English, Hindi, Gujarati, Hinglish) and fact-checking guards.
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                  Version 1.0.0 &bull; 0 API Keys Required
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex items-start justify-between opacity-80">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 rounded-full border border-muted-foreground/40 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-300 text-sm">Ollama Local Model (Optional)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Local LLM adapter configured at <code className="text-slate-400 font-mono">http://localhost:11434</code> (llama3.2). Used automatically when running.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance & Privacy */}
      <div className="p-6 md:p-8 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-border/60">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base">Tenant Isolation & Privacy</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <p className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Strict tenant boundary: All database queries enforced with <code className="text-indigo-300 font-mono">workspace_id</code> index.</span>
          </p>
          <p className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>DNC / Suppression List: Accounts flagged with Do-Not-Contact automatically blocked from AI message generation.</span>
          </p>
          <p className="flex items-center space-x-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Daily AI Quota: 50 generations / workspace / day.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
