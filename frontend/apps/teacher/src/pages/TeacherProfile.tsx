import React, { useState } from 'react';
import {
  UserCheck,
  Lock,
  Phone,
  Mail,
  BookOpen,
  Users2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';

export const TeacherProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  // Profile edit state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '+998 90 123 45 67');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setIsUpdatingProfile(true);

    try {
      const updated = await teacherService.updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      updateUser(updated);
      setIsUpdatingProfile(false);
      setProfileSuccessMsg('Profil ma’lumotlari muvaffaqiyatli saqlandi.');
    } catch {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg(null);
    setPwSuccessMsg(null);

    if (!currentPassword) {
      setPwErrorMsg('Joriy parolni kiriting.');
      return;
    }
    if (newPassword.length < 8) {
      setPwErrorMsg('Yangi parol kamida 8 ta belgidan iborat bo‘lishi lozim.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg('Yangi parollar bir-biriga mos kelmadi.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await teacherService.changePassword(currentPassword, newPassword);
      setIsChangingPassword(false);
      setPwSuccessMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setIsChangingPassword(false);
      setPwErrorMsg(err.message || 'Parolni yangilashda xatolik.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          O‘qituvchi profili va xavfsizlik
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Shaxsiy ma’lumotlar, biriktirilgan fanlar va hisob xavfsizligi sozlamalari
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={user?.avatar_url || '/src/assets/images/avatar_teacher_aziz_1792145043285.jpg'}
          alt={user?.full_name}
          className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 shadow-md shrink-0"
          referrerPolicy="no-referrer"
        />

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">{user?.full_name}</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800">
              O‘qituvchi (Teacher)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
              Faol hisob
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono">@{user?.username} · {user?.email}</p>
          <p className="text-xs text-slate-700 font-medium">{user?.department}</p>

          <div className="pt-2 flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {user?.subjects.map((sub, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Profile Form & Password Change */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Edit */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Shaxsiy ma’lumotlarni tahrirlash
            </h3>
          </div>

          {profileSuccessMsg && (
            <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="p-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">F.I.Sh (To‘liq ism)</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Foydalanuvchi nomi (Username)
              </label>
              <input
                type="text"
                value={user?.username}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Username faqat administrator tomonidan o‘zgartiriladi.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Telefon raqam</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdatingProfile ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Xavfsizlik: Parolni yangilash
            </h3>
          </div>

          {pwSuccessMsg && (
            <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pwSuccessMsg}</span>
            </div>
          )}

          {pwErrorMsg && (
            <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pwErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="p-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Joriy parol (Current Password)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Parol backendda tekshiriladi.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Yangi parol (New Password)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kamida 8 ta belgi..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Yangi parolni tasdiqlash
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Parolni qayta tering..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isChangingPassword ? 'Yangilanmoqda...' : 'Parolni yangilash'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
