import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const StudentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginStudent } = useAuth();
  const { success, error } = useToast();

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentId.trim()) {
      setErrorMessage('Talaba ID raqami yoki loginini kiriting');
      return;
    }
    if (!password) {
      setErrorMessage('Parolni kiriting');
      return;
    }

    setLoading(true);
    try {
      const res = await loginStudent(studentId, password);
      if (res.success && res.user) {
        success('Xush kelibsiz!', `${res.user.fullName}, tizimga muvaffaqiyatli kirdingiz.`);
        navigate('/student/dashboard', { replace: true });
      } else {
        const err = res.error || 'Kirishda xatolik yuz berdi';
        setErrorMessage(err);
        error('Kirish xatoligi', err);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server bilan aloqa uzildi';
      setErrorMessage(msg);
      error('Xatolik', msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 selection:bg-cyan-500 selection:text-slate-950">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0F172A] text-cyan-400 mb-3 shadow-md border border-cyan-500/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Avlod Ta’lim
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Talabalar boshqaruv tizimiga kirish
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Talaba ID raqami yoki login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="Masalan: 38172645"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Maxfiy parol
                </label>
                <span className="text-[11px] text-slate-400 font-normal">
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Tizimga kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            {/* Portal Switch Links */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500">
              <Link
                to="/login"
                className="font-medium hover:text-cyan-600 transition-colors flex items-center gap-1"
              >
                <span>Direktor Paneli</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Avlod Ta’lim Education Management Platform &copy; 2026. Himoyalangan tizim.
        </p>
      </div>
    </div>
  );
};
