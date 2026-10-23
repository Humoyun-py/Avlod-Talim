import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Shield,
  CreditCard,
  Percent,
  Sliders,
  CheckCircle2,
  Lock,
  Building,
  KeyRound,
  RotateCcw,
  Check,
  ShieldCheck
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { DirectorSettings } from '../types';
import { ImageUpload } from '../components/common/ImageUpload';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { applyBrandTheme, AVLOD_PERMANENT_PURPLE } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

export const SettingsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { success, error, info } = useToast();
  const { updatePassword } = useAuth();
  const [settings, setSettings] = useState<DirectorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'salary' | 'security'>('general');

  // Security passwords state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      throw new Error('Settings API unavailable');
    } catch {
      setSettings(null);
      error('Xatolik', 'Tashkilot sozlamalarini backend hozircha bermaydi; sahifadagi o‘zgarishlar saqlanmaydi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const updated = { ...settings, primaryColor: AVLOD_PERMANENT_PURPLE };
      await DirectorService.updateSettings(updated);
      setSettings(updated);
      applyBrandTheme(AVLOD_PERMANENT_PURPLE);
      success('Saqlandi', 'Tizim sozlamalari muvaffaqiyatli saqlandi');
    } catch {
      error('Xatolik', 'Tashkilot sozlamalarini saqlash endpointi mavjud emas.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      error('Xatolik', 'Joriy parolni kiriting');
      return;
    }
    if (!passwords.newPassword || passwords.newPassword.length < 8) {
      error('Xatolik', 'Yangi parol kamida 8 belgidan iborat bo‘lishi lozim');
      return;
    }
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      error('Xatolik', 'Yangi parollar bir-biriga mos kelmadi');
      return;
    }

    try {
      await updatePassword(passwords.currentPassword, passwords.newPassword);
      success('Parol yangilandi', 'Director hisobining xavfsizlik paroli muvaffaqiyatli yangilandi');
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      error('Xatolik', err.message || 'Parolni yangilashda xatolik yuz berdi');
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center text-xs text-gray-400">
        Sozlamalar yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('settings.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('settings.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#5C42FD]/30 transition-all cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{t('settings.save')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E9EAF3] gap-6 text-xs font-bold overflow-x-auto">
        {[
          {
            id: 'general',
            label: language === 'uz' ? 'Umumiy Sozlamalar' : language === 'ru' ? 'Общие Настройки' : 'General Settings',
            icon: Building
          },
          {
            id: 'payment',
            label: language === 'uz' ? 'To‘lov Parametrlari' : language === 'ru' ? 'Параметры Оплаты' : 'Payment Parameters',
            icon: CreditCard
          },
          {
            id: 'salary',
            label: language === 'uz' ? 'Ustoz Oyligi Foizi' : language === 'ru' ? 'Процент Зарплаты' : 'Teacher Salary Rate',
            icon: Percent
          },
          {
            id: 'security',
            label: language === 'uz' ? 'Xavfsizlik & Parol' : language === 'ru' ? 'Безопасность & Пароль' : 'Security & Password',
            icon: Shield
          }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#5C42FD] text-[#5C42FD]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General (Center name, Logo, Primary color) */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E9EAF3] shadow-xs space-y-6 max-w-3xl">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'uz' ? 'Markaz Nomi' : language === 'ru' ? 'Название Центра' : 'Center Name'}
              </label>
              <input
                type="text"
                value={settings.centerName}
                onChange={e => setSettings({ ...settings, centerName: e.target.value })}
                className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Asosiy Brand Rang (Avlod Ta'lim Binafsharang)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5C42FD] shadow-sm shadow-[#5C42FD]/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="flex-1 bg-[#F8F8FC] border border-[#E9EAF3] rounded-xl px-3.5 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#5C42FD]" />
                      <span className="text-xs font-mono font-bold text-gray-900">#5C42FD</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#5C42FD] bg-purple-50 px-2 py-0.5 rounded-md">
                      Doimiy rasmiy rang
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5C42FD]" />
                  Avlod Ta'lim akademiyasining rasmiy rangi doimiy binafsharang (#5C42FD) etib belgilangan.
                </p>
              </div>

            <div className="pt-2">
              <ImageUpload
                value={settings.logoUrl || ''}
                onChange={url => setSettings({ ...settings, logoUrl: url })}
                label="Markaz Logosi (Logo)"
                helperText="PNG, JPG, WebP yoki SVG (maksimal 5MB)"
                aspectRatio="square"
              />
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payment (Payment deadline, Default monthly payment) */}
      {activeTab === 'payment' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E9EAF3] shadow-xs space-y-6 max-w-3xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  To‘lov Oxirgi Muddati (Har oyning sanasi)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.paymentDeadlineDay}
                    onChange={e => setSettings({ ...settings, paymentDeadlineDay: Number(e.target.value) })}
                    className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 font-bold focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                    -sanagacha
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Belgilangan sanadan so‘ng to‘lanmagan talabalar avtomatik "Overdue" statusiga o‘tadi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Standart Oylik Kurs Narxi (UZS)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={settings.defaultMonthlyPayment}
                  onChange={e => setSettings({ ...settings, defaultMonthlyPayment: Number(e.target.value) })}
                  className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 font-bold focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Naqd Kassa Kvitansiyalari</p>
                <p className="text-[11px] text-gray-500">Filial kassasidan to‘lov qabul qilinganda avtomatik kassa raqami generatsiya qilinsin.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowCashReceipts}
                onChange={e => setSettings({ ...settings, allowCashReceipts: e.target.checked })}
                className="w-4 h-4 text-[#5C42FD] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Teacher Salary (Percentage: default 40%) */}
      {activeTab === 'salary' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E9EAF3] shadow-xs space-y-6 max-w-3xl">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Baza Bo‘yicha Ustoz Ulushi Foizi (Default 40%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={settings.teacherSalaryPercentage}
                  onChange={e => setSettings({ ...settings, teacherSalaryPercentage: Number(e.target.value) })}
                  className="w-32 bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-base text-[#5C42FD] font-black focus:outline-hidden"
                />
                <span className="text-sm font-extrabold text-gray-700">% stavka</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Avlod Ta'lim standart moliyaviy tizimida o‘quvchilar tomonidan to‘langan kurs pulining 40% qismi
                dars beruvchi mentor hisobiga oylik maosh sifatida hisoblanadi.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
              <span className="font-bold block">Hisoblash namunasi:</span>
              <p>Talaba to‘lovi: 1,200,000 UZS • 40% stavka = <strong className="font-extrabold">480,000 UZS</strong> mentor ulushi.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security (Password settings, Session settings) */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E9EAF3] shadow-xs space-y-6 max-w-3xl">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Direktor Parolini O‘zgartirish
            </h4>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Joriy Parol
              </label>
              <input
                type="password"
                required
                value={passwords.currentPassword}
                onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                placeholder="Hozirgi parolingiz"
                className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Yangi Parol
                </label>
                <input
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="Kamida 6 belgi"
                  className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Yangi Parolni Tasdiqlang
                </label>
                <input
                  type="password"
                  required
                  value={passwords.confirmNewPassword}
                  onChange={e => setPasswords({ ...passwords, confirmNewPassword: e.target.value })}
                  placeholder="Qayta kiriting"
                  className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Parolni Yangilash
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Sessiya va Kirish Xavfsizligi
            </h4>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sessiya Davomiyligi (daqiqa)
              </label>
              <input
                type="number"
                min="15"
                max="480"
                value={settings.sessionTimeoutMinutes}
                onChange={e => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-32 bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-900 font-bold focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
