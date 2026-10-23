import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { success, error } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        success(t('login.welcome'), t('login.welcome_sub'));
        navigate('/director/dashboard', { replace: true });
      } else {
        setLoginError(res.error || t('login.error_message'));
        error(t('login.error_title'), res.error || t('login.error_message'));
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9FE] via-[#F4F2FF] to-[#EBE7FF] flex flex-col justify-center items-center p-4 selection:bg-[#5C42FD] selection:text-white">
      {/* Language Switcher Top Right */}
      <div className="absolute top-6 right-6 flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-xl border border-gray-200/60 shadow-xs">
        {(['uz', 'ru', 'en'] as const).map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setLanguage(l)}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              language === l
                ? 'bg-[#5C42FD] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {l === 'uz' ? 'UZ' : l === 'ru' ? 'RU' : 'EN'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#5C42FD] text-white shadow-lg shadow-[#5C42FD]/30 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Avlod Ta'lim
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-3xl border border-[#E9EAF3] shadow-xl shadow-[#5C42FD]/5 p-7 sm:p-9 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-black text-gray-900">
              {t('login.title')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('login.login_desc')}
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('login.username')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="director"
                  className="w-full bg-[#F8F8FC] border border-gray-200 focus:border-[#5C42FD] focus:bg-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-hidden transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8F8FC] border border-gray-200 focus:border-[#5C42FD] focus:bg-white rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-900 font-bold focus:outline-hidden transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-md shadow-[#5C42FD]/25 transition-all cursor-pointer disabled:opacity-70"
            >
              <span>{loading ? t('common.loading') : t('login.submit')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-6 flex items-center justify-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Avlod Ta'lim xavfsiz boshqaruv seansi</span>
        </p>
      </div>
    </div>
  );
};
