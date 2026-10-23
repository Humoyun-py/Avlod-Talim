import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Coins,
  ShoppingBag,
  CalendarCheck,
  CalendarDays,
  Users2,
  BookOpenCheck,
  Megaphone,
  Bell,
  CreditCard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser } from '../../types';
import { StudentApiService } from '../../services/studentApi';

interface StudentSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (student) {
      try {
        const notifs = await StudentApiService.getNotifications(student.id);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    fetchUnread();
    window.addEventListener('student-notifications-updated', fetchUnread);
    return () => window.removeEventListener('student-notifications-updated', fetchUnread);
  }, [student?.id]);

  const navItems = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/coins', icon: Coins, label: 'Mening Coinlarim' },
    { to: '/student/shop', icon: ShoppingBag, label: 'Coin Do‘koni' },
    { to: '/student/attendance', icon: CalendarCheck, label: 'Davomat' },
    { to: '/student/schedule', icon: CalendarDays, label: 'Dars Jadvali' },
    { to: '/student/group', icon: Users2, label: 'Guruhim & Kurs' },
    { to: '/student/homework', icon: BookOpenCheck, label: 'Uy Vazifalari' },
    { to: '/student/announcements', icon: Megaphone, label: 'E’lonlar' },
    { to: '/student/notifications', icon: Bell, label: 'Xabarlar', badge: unreadCount },
    { to: '/student/payments', icon: CreditCard, label: 'To‘lov Ma’lumoti' },
    { to: '/student/profile', icon: User, label: 'Mening Profilim' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0F172A] text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white tracking-tight truncate">
                  Avlod Ta’lim
                </h1>
                <p className="text-[11px] text-cyan-400 font-medium truncate">
                  Student Portal
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Kengaytirish' : 'Kichraytirish'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Student Quick Profile Card in Sidebar */}
        {!collapsed && student && (
          <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 border border-cyan-500/30">
                {student.fullName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {student.fullName}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  ID: {student.studentId}
                </p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Balans:</span>
              <span className="font-mono font-bold text-cyan-300 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                {student.coins}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-900">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title="Tizimdan chiqish"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
