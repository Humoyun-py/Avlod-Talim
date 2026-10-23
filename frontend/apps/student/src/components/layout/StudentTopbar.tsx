import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Coins,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser } from '../../types';
import { StudentApiService } from '../../services/studentApi';

interface StudentTopbarProps {
  onMenuClick: () => void;
}

export const StudentTopbar: React.FC<StudentTopbarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchRole } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    if (student) {
      try {
        const data = await StudentApiService.getNotifications(student.id);
        setNotifications(data);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    fetchNotifs();
    window.addEventListener('student-notifications-updated', fetchNotifs);
    return () => window.removeEventListener('student-notifications-updated', fetchNotifs);
  }, [student?.id]);

  // Click outside listener
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('coins')) return 'Mening Coinlarim';
    if (path.includes('shop')) return 'Coin Do‘koni';
    if (path.includes('attendance')) return 'Davomat Nazorati';
    if (path.includes('schedule')) return 'Dars Jadvali';
    if (path.includes('group')) return 'Guruhim & Kurs';
    if (path.includes('homework')) return 'Uy Vazifalari';
    if (path.includes('announcements')) return 'E’lonlar';
    if (path.includes('notifications')) return 'Bildirishnomalar';
    if (path.includes('payments')) return 'To‘lov Ma’lumotlari';
    if (path.includes('profile')) return 'Mening Profilim';
    return 'Talaba Paneli';
  };

  const handleMarkAllRead = async () => {
    if (student) {
      await StudentApiService.markAllNotificationsAsRead(student.id);
      fetchNotifs();
    }
  };


  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left Zone: Hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Menyu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Avlod Ta’lim</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">{student?.groupName || 'Talaba'}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Right Zone: Controls */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Coin Balance Chip */}
          <button
            onClick={() => navigate('/student/coins')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/60 transition-colors"
            title="Mening coinlarim sahifasiga o‘tish"
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span className="font-mono font-bold text-xs tabular-nums text-amber-800">
              {student?.coins || 0}
            </span>
            <span className="text-[10px] uppercase font-semibold text-amber-700 hidden xs:inline">
              Coin
            </span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Xabarlar"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-900 flex items-center justify-center font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">Bildirishnomalar</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-cyan-100 text-cyan-800 rounded">
                        {unreadCount} yangi
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-cyan-700 hover:text-cyan-900 font-medium"
                    >
                      Barchasini o‘qilgan qilish
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Hozircha yangi bildirishnomalar yo‘q
                    </div>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          await StudentApiService.markNotificationAsRead(n.id);
                          setShowNotifications(false);
                          if (n.linkTo) navigate(n.linkTo);
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-xs ${
                          !n.read ? 'bg-cyan-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {n.createdAt.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/student/notifications');
                    }}
                    className="text-xs font-semibold text-cyan-700 hover:text-cyan-900"
                  >
                    Barcha xabarlarni ko‘rish &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-cyan-400 font-bold flex items-center justify-center text-xs">
                {student?.fullName
                  ? student.fullName
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                  : 'ST'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {student?.firstName || 'Talaba'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {student?.studentId}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 truncate">{student?.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">ID: {student?.studentId}</p>
                  <p className="text-[10px] text-cyan-600 mt-0.5 truncate">{student?.courseName}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/student/profile');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Mening Profilim</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/student/coins');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Coinlarim ({student?.coins || 0})</span>
                  </button>
                </div>

                <div className="py-1 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      setShowUserDropdown(false);
                      await switchRole('DIRECTOR');
                      navigate('/director/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#5C42FD]" />
                    <span>Direktor Paneliga o‘tish &rarr;</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                      navigate('/student/login');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Tizimdan chiqish</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
