import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, KeyRound, User, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const StaffLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { loginStaff } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both your staff username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const user = await loginStaff(username.trim(), password);
      showToast(`Welcome back, ${user.full_name}`, 'success');

      // Directors and admins use the same main admin panel.
      if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      const message = err.message || 'Authentication failed. Please check your credentials.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand emblem */}
        <div className="flex justify-center mb-4">
          <img
            src="/src/assets/images/avlod_brand_mark_1792586439669.jpg"
            alt="Avlod Ta'lim Crest"
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-amber-500/40 shadow-xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-white uppercase">
          Avlod Ta'lim
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-mono tracking-wide">
          Official Staff Authentication Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Staff Username or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or username@avlodtalim.uz"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
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
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-md disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Sign In as Staff</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400">Use the staff credentials provided by your organization.</p>

          {/* Student Portal Link */}
          <div className="mt-5 text-center">
            <Link
              to="/student-login"
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              Are you an enrolled student? Access Student Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
