import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentUser, Role } from '../types';
import { StudentApiService } from '../services/studentApi';
import { ApiClient } from '../services/apiClient';

export interface DirectorUser {
  id: string;
  username: string;
  fullName: string;
  role: 'DIRECTOR';
  email: string;
  avatarUrl?: string;
}

export type AuthUser = DirectorUser | StudentUser;

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: 'DIRECTOR' | 'STUDENT' | null;
  isStudent: boolean;
  isDirector: boolean;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginStudent: (studentIdOrUsername: string, pass: string) => Promise<{ success: boolean; user?: StudentUser; error?: string }>;
  logout: () => void;
  updatePassword: (currentPass: string, newPass: string) => Promise<boolean>;
  updateStudentProfile: (updates: { bio?: string; telegramUsername?: string; preferredContact?: 'Telegram' | 'Phone' | 'Email'; avatarUrl?: string }) => Promise<void>;
  updateStudentPassword: (currentPass: string, newPass: string) => Promise<boolean>;
  refreshStudentUser: () => Promise<void>;
  switchRole: (newRole: 'DIRECTOR' | 'STUDENT', targetId?: string) => Promise<void>;
}

const DIRECTOR_AUTH_KEY = 'avlod_director_auth_session_v1';
const CURRENT_ROLE_KEY = 'avlod_current_auth_role_v1';
const CURRENT_STUDENT_ID_KEY = 'avlod_current_student_id_v1';

const DEFAULT_DIRECTOR: DirectorUser = {
  id: 'dir-1',
  username: 'director',
  fullName: 'Sardor Rahmonov',
  role: 'DIRECTOR',
  email: 'director@avlod.uz'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<'DIRECTOR' | 'STUDENT' | null>(() => {
    try {
      const storedRole = localStorage.getItem(CURRENT_ROLE_KEY);
      if (storedRole === 'DIRECTOR') return 'DIRECTOR';
      if (storedRole === 'STUDENT') return 'STUDENT';
      if (localStorage.getItem(DIRECTOR_AUTH_KEY) === 'true') return 'DIRECTOR';
      if (localStorage.getItem(CURRENT_STUDENT_ID_KEY)) return 'STUDENT';
      return 'STUDENT';
    } catch {
      return 'STUDENT';
    }
  });

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize or reload user based on role and stored session
  const initUser = useCallback(async () => {
    try {
      let currentRole = localStorage.getItem(CURRENT_ROLE_KEY) as 'DIRECTOR' | 'STUDENT' | null;
      if (currentRole !== 'DIRECTOR' && currentRole !== 'STUDENT') {
        currentRole = role || 'STUDENT';
      }

      if (currentRole === 'DIRECTOR') {
        if (!ApiClient.getAccessToken()) { setUser(null); setIsAuthenticated(false); return; }
        const { data } = await ApiClient.request<any>('/auth/me/');
        if (data.role !== 'director') { setUser(null); setIsAuthenticated(false); return; }
        const director = { ...DEFAULT_DIRECTOR, id: String(data.id), username: data.username, fullName: `${data.first_name} ${data.last_name}`.trim() };
        setUser(director); setIsAuthenticated(true); setRole('DIRECTOR');
      } else {
        // STUDENT
        if (!ApiClient.getAccessToken()) { setUser(null); setIsAuthenticated(false); return; }
        const { data } = await ApiClient.request<any>('/auth/me/');
        if (data.role !== 'student') { setUser(null); setIsAuthenticated(false); return; }
        const student = await StudentApiService.getCurrentStudent(String(data.id));
        setUser(student); setIsAuthenticated(!!student); setRole('STUDENT');
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    initUser();
  }, [initUser]);

  // Listen to cross-panel updates
  useEffect(() => {
    const handleStudentUpdate = async () => {
      const currentRole = localStorage.getItem(CURRENT_ROLE_KEY);
      if (currentRole === 'STUDENT' || (!currentRole && role === 'STUDENT')) {
        const studentId = localStorage.getItem(CURRENT_STUDENT_ID_KEY);
        if (!studentId || !ApiClient.getAccessToken()) return;
        const refreshed = await StudentApiService.getCurrentStudent(studentId);
        if (refreshed) {
          setUser(refreshed);
        }
      }
    };

    window.addEventListener('students-updated', handleStudentUpdate);
    window.addEventListener('student-profile-updated', handleStudentUpdate);
    window.addEventListener('coin-transactions-updated', handleStudentUpdate);
    return () => {
      window.removeEventListener('students-updated', handleStudentUpdate);
      window.removeEventListener('student-profile-updated', handleStudentUpdate);
      window.removeEventListener('coin-transactions-updated', handleStudentUpdate);
    };
  }, [role]);

  const refreshStudentUser = async () => {
    const studentId = localStorage.getItem(CURRENT_STUDENT_ID_KEY);
    if (!studentId || !ApiClient.getAccessToken()) return;
    const refreshed = await StudentApiService.getCurrentStudent(studentId);
    if (refreshed) {
      setUser(refreshed);
    }
  };

  const login = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await ApiClient.request<any>('/auth/staff/login/', { method: 'POST', body: JSON.stringify({ username: username.trim(), password: pass }) });
      const data = response.data;
      if (data.user.role !== 'director') throw new Error('Ushbu sahifaga faqat direktor hisobi kira oladi.');
      localStorage.setItem('avlod_access_token', data.access); localStorage.setItem('avlod_refresh_token', data.refresh);
      const director = { ...DEFAULT_DIRECTOR, id: String(data.user.id), username: data.user.username, fullName: `${data.user.first_name} ${data.user.last_name}`.trim() };
      setIsAuthenticated(true); setRole('DIRECTOR'); setUser(director);
      localStorage.setItem(DIRECTOR_AUTH_KEY, 'true');
      localStorage.setItem(CURRENT_ROLE_KEY, 'DIRECTOR');
      localStorage.removeItem(CURRENT_STUDENT_ID_KEY);
      return { success: true };
    } catch (error: any) { return { success: false, error: error.response?.data?.detail || error.message || 'Kirish amalga oshmadi.' }; }
  };

  const loginStudent = async (
    studentIdOrUsername: string,
    pass: string
  ): Promise<{ success: boolean; user?: StudentUser; error?: string }> => {
    const res = await StudentApiService.login(studentIdOrUsername, pass);
    if (res.success && res.user) {
      setIsAuthenticated(true);
      setRole('STUDENT');
      setUser(res.user);
      try {
        localStorage.setItem(CURRENT_ROLE_KEY, 'STUDENT');
        localStorage.setItem(CURRENT_STUDENT_ID_KEY, res.user.id);
        localStorage.removeItem(DIRECTOR_AUTH_KEY);
      } catch {
        // ignore
      }
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    ApiClient.clearTokens();
    try {
      localStorage.removeItem(DIRECTOR_AUTH_KEY);
      localStorage.removeItem(CURRENT_ROLE_KEY);
      localStorage.removeItem(CURRENT_STUDENT_ID_KEY);
    } catch {
      // ignore
    }
  };

  const updatePassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    await ApiClient.request('/auth/password/change/', { method: 'POST', body: JSON.stringify({ old_password: currentPass, new_password: newPass }) });
    return true;
  };

  const updateStudentProfile = async (updates: {
    bio?: string;
    telegramUsername?: string;
    preferredContact?: 'Telegram' | 'Phone' | 'Email';
    avatarUrl?: string;
  }): Promise<void> => {
    if (!user || user.role !== 'STUDENT') throw new Error('Talaba hisobi faol emas');
    const updated = await StudentApiService.updateProfile(user.id, updates);
    setUser(updated);
  };

  const updateStudentPassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    if (!user || user.role !== 'STUDENT') throw new Error('Talaba hisobi faol emas');
    return StudentApiService.changePassword(user.id, currentPass, newPass);
  };

  const switchRole = async (newRole: 'DIRECTOR' | 'STUDENT', targetId?: string) => {
    if (newRole === 'DIRECTOR') {
      const { data } = await ApiClient.request<any>('/auth/me/');
      if (data.role !== 'director') throw new Error('Direktor hisobi talab qilinadi.');
      localStorage.setItem(CURRENT_ROLE_KEY, 'DIRECTOR'); localStorage.removeItem(CURRENT_STUDENT_ID_KEY);
      setRole('DIRECTOR'); setUser({ ...DEFAULT_DIRECTOR, id: String(data.id), username: data.username, fullName: `${data.first_name} ${data.last_name}`.trim() }); setIsAuthenticated(true);
    } else {
      // STUDENT
      const { data } = await ApiClient.request<any>('/auth/me/');
      if (data.role !== 'student' || (targetId && String(data.id) !== targetId)) throw new Error('Faqat hozir tizimga kirgan talaba hisobi ochilishi mumkin.');
      const student = await StudentApiService.getCurrentStudent(String(data.id));
      if (!student) throw new Error('Talaba profili topilmadi.');
      localStorage.setItem(CURRENT_ROLE_KEY, 'STUDENT'); localStorage.setItem(CURRENT_STUDENT_ID_KEY, String(data.id)); localStorage.removeItem(DIRECTOR_AUTH_KEY);
      setRole('STUDENT'); setUser(student); setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        role,
        isStudent: role === 'STUDENT',
        isDirector: role === 'DIRECTOR',
        login,
        loginStudent,
        logout,
        updatePassword,
        updateStudentProfile,
        updateStudentPassword,
        refreshStudentUser,
        switchRole
      }}
    >
      {!loading && children}
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
