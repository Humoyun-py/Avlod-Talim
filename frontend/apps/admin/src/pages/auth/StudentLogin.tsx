import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, KeyRound, UserCheck, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const StudentLogin: React.FC = () => {
  const [studentId, setStudentId] = useState('AVL-2026-1042');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { loginStudent } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !password) {
      setErrorMsg('Please enter your Student ID and access password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const user = await loginStudent(studentId.trim(), password);
      showToast(`Welcome to Avlod Student Portal, ${user.full_name}`, 'success');
      navigate('/student');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid Student ID or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <img
            src="/src/assets/images/avlod_brand_mark_1792586439669.jpg"
            alt="Avlod Ta'lim Crest"
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-emerald-500/40 shadow-xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-white uppercase">
          Student Learning Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-mono tracking-wide">
          Avlod Ta'lim Student Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. AVL-2026-1042"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors uppercase tracking-wider"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-md disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>Enter Student Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700 text-center">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Academic or Administrative Staff? Sign in here &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
