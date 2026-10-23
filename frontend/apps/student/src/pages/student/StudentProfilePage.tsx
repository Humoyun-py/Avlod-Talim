import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Lock,
  KeyRound,
  Mail,
  Phone,
  Send,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser } from '../../types';
import { useToast } from '../../context/ToastContext';

export const StudentProfilePage: React.FC = () => {
  const { user, updateStudentProfile, updateStudentPassword } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;
  const { success, error } = useToast();

  // The backend currently provides read-only core student profile fields.
  const bio = student?.bio || '';
  const telegramUsername = student?.telegramUsername || '';
  const preferredContact = student?.preferredContact || 'Phone';
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change modal / form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (!student) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    error('Profil saqlanmadi', 'Ushbu qo‘shimcha profil maydonlari backendda hozircha saqlanmaydi.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('Parollar mos emas', 'Yangi parol va tasdiqlovchi parol bir xil bo‘lishi lozim');
      return;
    }
    if (newPassword.length < 8) {
      error('Parol juda qisqa', 'Yangi parol kamida 8 belgidan iborat bo‘lishi lozim');
      return;
    }

    setChangingPassword(true);
    try {
      await updateStudentPassword(currentPassword, newPassword);
      success('Parol yangilandi', 'Akkaunt parolingiz muvaffaqiyatli o‘zgartirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Parolni o‘zgartirishda xatolik yuz berdi';
      error('Xatolik', msg);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-300 font-extrabold flex items-center justify-center text-xl border border-cyan-500/30 shrink-0">
            {student.fullName
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-0.5">
              <span>Talaba ID:</span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300 border border-slate-700">
                {student.studentId}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {student.fullName}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {student.groupName} · {student.courseName}
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-400 block font-medium">Hisob holati:</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Faol (Tasdiqlangan)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: System-Locked Academic Attributes (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Akademik Yozuvlar</h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>O‘zgartirib bo‘lmaydi</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Xavfsizlik va akkreditatsiya qoidalariga muvofiq quyidagi maydonlar faqat ma’muriyat tomonidan boshqariladi:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Rasmiy Ism-Familiya:</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.fullName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Talaba Maxsus ID:</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">{student.studentId}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Biriktirilgan Guruh:</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.groupName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">O‘quv Yo‘nalishi:</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.courseName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Bosh O‘qituvchi:</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{student.teacherName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Telefon Raqam:</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">{student.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile & Password Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Editable Self-Service Profile Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Shaxsiy Ma’lumotlar</h3>
            <p className="text-xs text-slate-500 mb-4">
              Guruhdoshlar va ustozingiz bilan aloqa o‘rnatish uchun mo‘ljallangan ma’lumotlar
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  O‘zingiz haqingizda qisqacha (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Masalan: Frontend yo‘nalishida o‘qiyapman, React va TypeScript texnologiyalariga qiziqaman..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telegram Foydalanuvchi Nomi
                  </label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={e => setTelegramUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Afzal Ko‘rilgan Aloqa Turi
                  </label>
                  <select
                    value={preferredContact}
                    onChange={e => setPreferredContact(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Telegram">Telegram</option>
                    <option value="Phone">Telefon qo‘ng‘irog‘i</option>
                    <option value="Email">Email xabarnoma</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
                </button>
              </div>
            </form>
          </div>

          {/* Secure Password Update Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-900">Parolni O‘zgartirish</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Xavfsizlik uchun yangi parolingiz kamida 6 belgidan iborat bo‘lishi tavsiya etiladi.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Joriy parol
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Yangi parol
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Yangi parolni tasdiqlang
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword || !currentPassword || !newPassword}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {changingPassword ? 'Yangilanmoqda...' : 'Yangi parolni saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
