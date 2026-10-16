import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  timezone?: string;
}

interface AuthContextType {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (ws: Workspace) => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCurrentWorkspace = useCallback((ws: Workspace) => {
    setCurrentWorkspaceState(ws);
    localStorage.setItem('leadpilot_workspace_id', ws.id);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/me');
      const data = res.data.data;
      setUser(data.user);
      setWorkspaces(data.workspaces || []);

      if (data.workspaces && data.workspaces.length > 0) {
        const savedWsId = localStorage.getItem('leadpilot_workspace_id');
        const match = data.workspaces.find((w: Workspace) => w.id === savedWsId);
        const selected = match || data.workspaces[0];
        setCurrentWorkspaceState(selected);
        localStorage.setItem('leadpilot_workspace_id', selected.id);
      }
    } catch {
      setUser(null);
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setUser(null);
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      localStorage.removeItem('leadpilot_workspace_id');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        isLoading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
