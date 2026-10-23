import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User as UserIcon, ShieldAlert, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const validate = () => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = 'Foydalanuvchi nomini (username) kiritish majburiy.';
    }
    if (!password) {
      errors.password = 'Parolni kiritish majburiy.';
    } else if (password.length < 6) {
      errors.password = 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validate()) return;

    const result = await login(username.trim(), password);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setAuthError(result.error || 'Kirishda xatolik yuz berdi.');
    }
  };


  return (
    <div className="min-h-screen flex bg-[#0F172A] text-slate-100">
      {/* Left side: Editorial brand story & Campus visual */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800">
        {/* Background photo overlay */}
        <img
          src="/src/assets/images/avlod_campus_academic_1792145043377.jpg"
          alt="Avlod Ta'lim Campus"
          className="absolute inset-0 w-full h-full object-cover opacity-25 filter grayscale-[20%]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent" />

        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-extrabold shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-white">AVLOD TA’LIM</h1>
            <p className="text-xs text-cyan-400 font-medium tracking-wider">
              Zamonaviy Ta’lim Boshqaruv Tizimi
            </p>
          </div>
        </div>

        {/* Mid quote & system role description */}
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-xs text-cyan-300 font-mono">
            O‘qituvchi boshqaruv moduli
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
            Ta’lim sifatini monitoring qilish va darslarni boshqarish platformasi
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Guruhlar jadvali, real vaqt davomati, dars yakunlash hisobotlari hamda uy vazifalarini tekshirish bitta qulay tizimda jamlangan.
          </p>

          <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800 text-xs">
            <div>
              <div className="text-cyan-400 font-bold font-mono text-base">100%</div>
              <div className="text-slate-400 mt-0.5">Avtomatlashgan davomat</div>
            </div>
            <div>
              <div className="text-cyan-400 font-bold font-mono text-base">24/7</div>
              <div className="text-slate-400 mt-0.5">Darslar jadvali</div>
            </div>
            <div>
              <div className="text-cyan-400 font-bold font-mono text-base">PRO</div>
              <div className="text-slate-400 mt-0.5">O‘qituvchi vositalari</div>
            </div>
          </div>
        </div>

        {/* Bottom footer credit */}
        <div className="relative z-10 text-xs text-slate-500 font-mono">
          © 2026 Avlod Ta’lim. Barcha huquqlar himoyalangan.
        </div>
      </div>

      {/* Right side: Clean, focused Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-[#0F172A]">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-base">AVLOD TA’LIM</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              O‘qituvchi Kabinetiga Kirish
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              O‘qituvchi hisobingizga kirish uchun login va parolingizni kiriting.
            </p>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <p className="leading-relaxed">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                O‘qituvchi logini (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (formErrors.username) setFormErrors({ ...formErrors, username: undefined });
                  }}
                  placeholder="masalan: teacher_aziz"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-900 border text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 transition-colors ${
                    formErrors.username
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                />
              </div>
              {formErrors.username && (
                <p className="mt-1 text-[11px] text-rose-400">{formErrors.username}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900 border text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 transition-colors ${
                    formErrors.password
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-[11px] text-rose-400">{formErrors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Kirilmoqda...</span>
              ) : (
                <>
                  <span>Tizimga kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
