import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Target,
  Send,
  CalendarCheck,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Compass,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, workspaces, currentWorkspace, setCurrentWorkspace, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', path: '/leads', icon: Users },
    { label: 'Campaigns', path: '/campaigns', icon: Target },
    { label: 'Outreach Studio', path: '/outreach', icon: Send, badge: 'AI' },
    { label: 'Follow-ups', path: '/follow-ups', icon: CalendarCheck },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const item = navItems.find((n) => location.pathname.startsWith(n.path));
    if (location.pathname.startsWith('/leads/')) return 'Lead Details';
    return item ? item.label : 'LeadPilot';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
            LeadPilot
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-secondary transition"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col w-full md:w-64 border-r border-border bg-card/60 backdrop-blur-xl shrink-0 z-40 fixed md:sticky top-0 md:top-0 h-auto md:h-screen transition-all`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-white">LeadPilot</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Pipeline & Outreach Engine</p>
            </div>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3 border-b border-border/60 relative">
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/60 transition group text-left"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {currentWorkspace?.name || 'Select Workspace'}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {currentWorkspace?.role || 'Member'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-white transition shrink-0 ml-1" />
          </button>

          {wsDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 py-1.5 bg-slate-900 border border-border/80 rounded-xl shadow-2xl z-50 backdrop-blur-xl">
              <p className="px-3 py-1 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Workspaces
              </p>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setCurrentWorkspace(ws);
                    setWsDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-indigo-600/10 hover:text-indigo-300 transition ${
                    currentWorkspace?.id === ws.id
                      ? 'text-indigo-400 font-semibold bg-indigo-500/10'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-secondary rounded text-muted-foreground">
                    {ws.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/25 font-semibold'
                      : 'text-muted-foreground hover:text-white hover:bg-secondary/70'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex items-center space-x-1 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-400/20 text-indigo-300 rounded border border-indigo-400/30">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{item.badge}</span>
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-border/80">
          <div className="p-2 rounded-xl bg-secondary/40 border border-border/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || 'LP'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border/60 bg-card/30 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Workspace Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
