import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  loginStaff: (username: string, password: string) => Promise<User>;
  loginStudent: (studentId: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth session by checking token with backend authority
  const initAuth = async () => {
    const token = api.getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Backend validates token and returns fresh user with role
      const currentUser = await api.getMe();
      setUser(currentUser);
    } catch {
      // If token expired or invalid, clear session
      api.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const loginStaff = async (username: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { user: authedUser } = await api.loginStaff(username, password);
      // Backend sets verified user role
      setUser(authedUser);
      return authedUser;
    } finally {
      setLoading(false);
    }
  };

  const loginStudent = async (studentId: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { user: authedUser } = await api.loginStudent(studentId, password);
      setUser(authedUser);
      return authedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const refreshed = await api.getMe();
      setUser(refreshed);
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        loading,
        loginStaff,
        loginStudent,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
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
