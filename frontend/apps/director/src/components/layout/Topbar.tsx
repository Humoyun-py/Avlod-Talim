import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Shield,
  ChevronDown,
  User,
  Settings as SettingsIcon,
  LogOut,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Globe,
  Coins
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
  onLogoutClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, onLogoutClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return t('page.dashboard_title');
    if (path.includes('teachers')) return t('page.teachers_title');
    if (path.includes('students')) return t('page.students_title');
    if (path.includes('coins')) return t('page.coins_title');
    if (path.includes('groups')) return t('page.groups_title');
    if (path.includes('courses')) return t('page.courses_title');
    if (path.includes('payments')) return t('page.payments_title');
    if (path.includes('teacher-salary')) return t('page.salary_title');
    if (path.includes('reports')) return t('page.reports_title');
    if (path.includes('shop')) return t('page.shop_title');
    if (path.includes('orders')) return t('page.orders_title');
    if (path.includes('settings')) return t('page.settings_title');
    return t('page.default_title');
  };

  const notifications = [
    {
      id: 1,
      title: language === 'uz' ? 'Yangi to‘lov qabul qilindi' : language === 'ru' ? 'Принят новый платеж' : 'New payment accepted',
      desc: language === 'uz' ? 'Azizbek Sobirov 1,200,000 so‘m (Payme) to‘ladi' : language === 'ru' ? 'Азизбек Собиров оплатил 1,200,000 сум (Payme)' : 'Azizbek Sobirov paid 1,200,000 UZS (Payme)',
      time: language === 'uz' ? '12 daqiqa oldin' : language === 'ru' ? '12 минут назад' : '12 min ago',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 2,
      title: language === 'uz' ? 'Yangi mahsulot buyurtmasi' : language === 'ru' ? 'Новый заказ товара' : 'New merchandise order',
      desc: language === 'uz' ? 'Shahzoda Ergasheva — Xudi (500 coin)' : language === 'ru' ? 'Шахзода Эргашева — Худи (500 коинов)' : 'Shahzoda Ergasheva — Hoodie (500 coins)',
      time: language === 'uz' ? '1 soat oldin' : language === 'ru' ? '1 час назад' : '1 hr ago',
      icon: ShoppingBag,
      color: 'bg-indigo-50 text-[#5C42FD]'
    },
    {
      id: 3,
      title: language === 'uz' ? 'Muddati o‘tgan to‘lov eslatmasi' : language === 'ru' ? 'Напоминание о просрочке оплаты' : 'Overdue payment reminder',
      desc: language === 'uz' ? 'Diyorbek Karimov to‘lov muddati 12 kunga kechikmoqda' : language === 'ru' ? 'Диёрбек Каримов: просрочка оплаты на 12 дней' : 'Diyorbek Karimov payment is overdue by 12 days',
      time: language === 'uz' ? 'Bugun, 09:30' : language === 'ru' ? 'Сегодня, 09:30' : 'Today, 09:30',
      icon: CheckCircle2,
      color: 'bg-amber-50 text-amber-600'
    }
  ];

  return (
    <header className="h-18 bg-white border-b border-[#E9EAF3] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            {t('topbar.subtitle')}
          </p>
        </div>
      </div>

      {/* Right: Search, Quick Coin Button, Language, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Award Coins Button */}
        <button
          type="button"
          onClick={() => navigate('/director/coins')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-amber-500/30 transition-all cursor-pointer shrink-0"
          title={t('topbar.award_coins_title')}
        >
          <Coins className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('topbar.award_coins')}</span>
        </button>

        {/* Search Bar */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('topbar.search')}
            className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden transition-all"
          />
        </div>

        {/* Language Switcher (UZ / RU / EN) */}
        <div className="flex items-center bg-[#F8F8FC] border border-[#E9EAF3] rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setLanguage('uz')}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              language === 'uz'
                ? 'bg-[#5C42FD] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="O‘zbekcha"
          >
            UZ
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ru')}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              language === 'ru'
                ? 'bg-[#5C42FD] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Русский"
          >
            RU
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              language === 'en'
                ? 'bg-[#5C42FD] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="English"
          >
            EN
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Bildirishnomalar"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E9EAF3] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{t('topbar.notifications')}</h4>
                  <p className="text-[10px] text-gray-400">{t('topbar.new_notifications')}</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] text-[#5C42FD] font-semibold hover:underline"
                  >
                    {t('topbar.mark_all_read')}
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.map(n => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-[#F8F8FC] transition-colors flex items-start gap-3 cursor-pointer"
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${n.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                          {n.desc}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {n.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <button
                  onClick={() => {
                    navigate('/director/reports');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-[#5C42FD] font-semibold hover:underline"
                >
                  {t('topbar.view_all_reports')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Director Profile Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5C42FD] to-[#806BFE] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SR
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-900 leading-tight">
                Sardor Rahmonov
              </span>
              <span className="text-[10px] text-[#5C42FD] font-semibold flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> {t('topbar.role')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[#E9EAF3] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900">Sardor Rahmonov</p>
                <p className="text-[11px] text-gray-500">director@avlodtalim.uz</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-[#5C42FD] text-[10px] font-bold">
                  {t('topbar.chief_director')}
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/director/settings');
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#F8F8FC] hover:text-[#5C42FD] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4 text-gray-400" />
                  <span>{t('topbar.system_settings')}</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogoutClick();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{t('topbar.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
