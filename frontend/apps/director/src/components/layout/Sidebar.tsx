import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersRound,
  GraduationCap,
  Layers,
  BookOpen,
  CreditCard,
  Wallet,
  BarChart3,
  ShoppingBag,
  PackageCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Coins
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { DirectorService } from '../../services/mockService';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogoutClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onLogoutClick
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  useEffect(() => {
    const updatePending = async () => {
      try {
        const orders = await DirectorService.getOrders();
        const pending = orders.filter(o => o.status === 'Pending').length;
        setPendingOrdersCount(pending);
      } catch {
        // ignore
      }
    };

    updatePending();
    window.addEventListener('storage', updatePending);
    window.addEventListener('orders-updated', updatePending);
    return () => {
      window.removeEventListener('storage', updatePending);
      window.removeEventListener('orders-updated', updatePending);
    };
  }, []);

  const navItems = [
    { name: t('nav.dashboard'), path: '/director/dashboard', icon: LayoutDashboard },
    { name: t('nav.teachers'), path: '/director/teachers', icon: UsersRound },
    { name: t('nav.students'), path: '/director/students', icon: GraduationCap },
    { name: t('nav.coins'), path: '/director/coins', icon: Coins },
    { name: t('nav.groups'), path: '/director/groups', icon: Layers },
    { name: t('nav.courses'), path: '/director/courses', icon: BookOpen },
    { name: t('nav.payments'), path: '/director/payments', icon: CreditCard },
    { name: t('nav.salary'), path: '/director/teacher-salary', icon: Wallet },
    { name: t('nav.reports'), path: '/director/reports', icon: BarChart3 },
    { name: t('nav.shop'), path: '/director/shop', icon: ShoppingBag },
    { name: t('nav.orders'), path: '/director/orders', icon: PackageCheck, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
    { name: t('nav.settings'), path: '/director/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E9EAF3] flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-18 flex items-center border-b border-[#F0F1F7] relative ${
            collapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}
        >
          {collapsed ? (
            <>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="w-10 h-10 rounded-xl bg-[#5C42FD] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#5C42FD]/25 shrink-0 hover:scale-105 transition-transform cursor-pointer"
                title="Menyuni kengaytirish"
              >
                <span className="font-extrabold tracking-tight">A</span>
              </button>

              {/* Floating Expand Toggle on the Sidebar border */}
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="hidden lg:flex absolute -right-3.5 top-5.5 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-[#5C42FD] hover:bg-[#F4F3FB] items-center justify-center transition-all z-50 cursor-pointer"
                title="Kengaytirish"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-[#5C42FD] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#5C42FD]/25 shrink-0">
                  <span className="font-extrabold tracking-tight">A</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-base text-gray-900 tracking-tight leading-tight">
                    AVLOD <span className="text-[#5C42FD]">TA’LIM</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                    Director Panel
                  </span>
                </div>
              </div>

              {/* Desktop Collapse Toggle */}
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden lg:flex w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 items-center justify-center transition-colors cursor-pointer"
                title="Yig‘ish"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#5C42FD] text-white shadow-sm shadow-[#5C42FD]/30 font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-[#F4F3FB]'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#5C42FD]'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Info & Footer */}
        <div className="p-3 border-t border-[#F0F1F7] bg-[#FAFAFE] space-y-2">
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-white border border-[#E9EAF3] flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#5C42FD]/10 text-[#5C42FD] flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {user?.fullName || 'Sardor Rahmonov'}
                  </p>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#5C42FD]" />
                    <span className="text-[10px] font-medium text-gray-500">
                      {t('topbar.role')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogoutClick}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Tizimdan chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogoutClick}
              className="w-full py-2 flex justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
