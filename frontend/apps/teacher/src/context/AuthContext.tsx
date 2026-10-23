import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('avlod_access_token');
    if (!token) { setIsLoading(false); return; }
    apiClient.get('/auth/me/').then(({ data }) => setUser(data)).catch(() => {
      localStorage.removeItem('avlod_access_token');
      localStorage.removeItem('avlod_refresh_token');
      localStorage.removeItem('avlod_auth_user');
    }).finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/auth/staff/login/', { username: username.trim(), password });
      if (data.user.role !== 'teacher') throw new Error('Ushbu panelga faqat o‘qituvchi hisobi kira oladi.');
      localStorage.setItem('avlod_access_token', data.access);
      localStorage.setItem('avlod_refresh_token', data.refresh);
      localStorage.setItem('avlod_auth_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || error.message || 'Kirish amalga oshmadi.' };
    } finally { setIsLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('avlod_auth_user');
    localStorage.removeItem('avlod_access_token');
    localStorage.removeItem('avlod_refresh_token');
    localStorage.setItem('avlod_explicit_logout', 'true');
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user && user.role === 'teacher',
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
