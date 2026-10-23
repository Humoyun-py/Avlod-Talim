import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-600" />
          <span>Xavfsizlik tekshirilmoqda...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6 text-white text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">Ruxsat Cheklangan (RBAC)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sizning hisobingiz roli: <strong className="text-cyan-400 font-mono">{user.role}</strong>.
            Ushbu tizim faqat O‘qituvchilar (Teacher) uchun mo‘ljallangan.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition-colors"
          >
            Boshqa hisob bilan kirish
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
