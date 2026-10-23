import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  BookOpenCheck,
  Video,
  TrendingUp,
  Megaphone,
  BarChart3,
  Wallet,
  UserCheck,
  LogOut,
  Bell,
  Menu,
  X,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacherService';
import { Notification } from '../../types';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [location.pathname]);

  const loadNotifications = async () => {
    try {
      const list = await teacherService.getNotifications();
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch {
      // ignore
    }
  };

  const handleMarkAsRead = async (id: string, link?: string) => {
    await teacherService.markNotificationRead(id);
    await loadNotifications();
    if (link) {
      setNotificationsOpen(false);
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    await teacherService.markAllNotificationsRead();
    await loadNotifications();
  };

  const navItems = [
    { name: 'Boshqaruv paneli', path: '/', icon: LayoutDashboard },
    { name: 'Mening guruhlarim', path: '/groups', icon: Users2 },
    { name: 'Mening talabalarim', path: '/students', icon: GraduationCap },
    { name: 'Dars jadvali', path: '/schedule', icon: CalendarDays },
    { name: 'Davomat nazorati', path: '/attendance', icon: ClipboardCheck },
    { name: 'Uy vazifalari', path: '/homework', icon: BookOpenCheck },
    { name: 'Dars video hisoboti', path: '/video-submissions', icon: Video },
    { name: 'Talabalar natijalari', path: '/progress', icon: TrendingUp },
    { name: 'E\'lonlar', path: '/announcements', icon: Megaphone },
    { name: 'Hisobotlar', path: '/reports', icon: BarChart3 },
    { name: 'Oylik maosh', path: '/salary', icon: Wallet },
    { name: 'Profilim', path: '/profile', icon: UserCheck },
  ];

  const getBreadcrumbTitle = () => {
    const current = navItems.find(
      (item) => item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path))
    );
    return current ? current.name : 'Bosh sahifa';
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0F172A] text-white shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-wide text-white block">
                AVLOD TA’LIM
              </span>
              <span className="text-[11px] font-medium text-cyan-400 tracking-wider">
                O‘QITUVCHI PANELI
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 font-semibold border-l-2 border-cyan-400'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.path === '/homework' && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    3
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Mini Profile in Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img
              src={user?.avatar_url || '/src/assets/images/avatar_teacher_aziz_1792145043285.jpg'}
              alt={user?.full_name}
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Chiqish"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
          {/* Left: Mobile hamburger & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="hidden sm:inline">Avlod Ta’lim</span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <span className="text-slate-900 font-bold">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Right: Quick Attendance, Notifications, User menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Action: Davomat Olish */}
            <button
              onClick={() => navigate('/attendance')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Davomat olish</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Xabarnomalar"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Xabarnomalar</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 font-semibold">
                          {unreadCount} yangi
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-cyan-700 hover:underline font-medium cursor-pointer"
                      >
                        Barchasini o‘qilgan qilish
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        Xabarnomalar mavjud emas
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id, n.link_url)}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                            !n.read ? 'bg-cyan-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {n.created_at}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/notifications');
                      }}
                      className="text-xs font-semibold text-slate-700 hover:text-cyan-600 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Barcha xabarnomalarni ko‘rish
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <img
                  src={user?.avatar_url || '/src/assets/images/avatar_teacher_aziz_1792145043285.jpg'}
                  alt={user?.full_name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <span className="hidden md:inline text-xs font-semibold text-slate-800">
                  {user?.full_name?.split(' ')[0]}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-xs">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                    <span className="mt-1 inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-50 text-cyan-800">
                      Rol: O‘qituvchi
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    Profil sozlamalari
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Tizimdan chiqish
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Slide-over Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0F172A] text-white z-50">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-white">AVLOD TA’LIM</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium ${
                          isActive ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Chiqish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Page Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
