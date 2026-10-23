import React, { createContext, useContext, useState, useEffect } from 'react';
import { DirectorService } from '../services/mockService';
import { apiClient } from '../../../teacher/src/services/apiClient';

export interface DirectorUser {
  id: string;
  username: string;
  fullName: string;
  role: 'DIRECTOR';
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: DirectorUser | null;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePassword: (currentPass: string, newPass: string) => Promise<boolean>;
}

const AUTH_STORAGE_KEY = 'avlod_director_auth_session_v1';
const PASSWORD_STORAGE_KEY = 'avlod_director_password_v1';

const DEFAULT_DIRECTOR: DirectorUser = {
  id: 'dir-1',
  username: 'director',
  fullName: 'Sardor Rahmonov',
  role: 'DIRECTOR',
  email: 'director@avlod.uz'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('avlod_access_token') && localStorage.getItem(AUTH_STORAGE_KEY) === 'true');
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<DirectorUser | null>(() => {
    try {
      const stored = localStorage.getItem('avlod_auth_user');
      if (!stored) return null;
      const account = JSON.parse(stored);
      if (account.role !== 'director') return null;
      return {
        ...DEFAULT_DIRECTOR,
        id: String(account.id),
        username: account.username,
        fullName: `${account.first_name || ''} ${account.last_name || ''}`.trim() || account.username,
        email: account.email || DEFAULT_DIRECTOR.email,
      };
    } catch {
      return null;
    }
  });

  const login = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data } = await apiClient.post('/auth/staff/login/', { username: username.trim(), password: pass });
      if (data.user.role !== 'director') throw new Error('Ushbu panelga faqat direktor hisobi kira oladi.');
      localStorage.setItem('avlod_access_token', data.access);
      localStorage.setItem('avlod_refresh_token', data.refresh);
      localStorage.setItem('avlod_auth_user', JSON.stringify(data.user));
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      const director = { ...DEFAULT_DIRECTOR, id: String(data.user.id), username: data.user.username, fullName: `${data.user.first_name} ${data.user.last_name}`.trim() };
      setIsAuthenticated(true); setUser(director);
      return { success: true };
    } catch (error: any) { return { success: false, error: error.response?.data?.detail || error.message || 'Kirish amalga oshmadi.' }; }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('avlod_access_token');
      localStorage.removeItem('avlod_refresh_token');
      localStorage.removeItem('avlod_auth_user');
    } catch {
      // ignore
    }
  };

  const updatePassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    await apiClient.post('/auth/password/change/', { old_password: currentPass, new_password: newPass });
    return true;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
