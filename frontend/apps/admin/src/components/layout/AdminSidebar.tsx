import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  FileCheck2,
  ShoppingBag,
  Package,
  Bell,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  unreadNotificationsCount?: number;
  pendingVerificationsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  unreadNotificationsCount = 0,
  pendingVerificationsCount = 0,
}) => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Groups', path: '/admin/groups', icon: GraduationCap },
    { name: 'Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    {
      name: 'Payment Verification',
      path: '/admin/payment-verification',
      icon: FileCheck2,
      badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
    },
    { name: 'Shop', path: '/admin/shop', icon: ShoppingBag },
    { name: 'Shop Orders', path: '/admin/shop-orders', icon: Package },
    {
      name: 'Notifications',
      path: '/admin/notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { name: 'Profile', path: '/admin/profile', icon: UserCheck },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/src/assets/images/avlod_brand_mark_1792586439669.jpg"
            alt="Avlod Ta'lim"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-amber-500/30 shrink-0"
            referrerPolicy="no-referrer"
          />
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm text-white tracking-tight block truncate">
                AVLOD TA'LIM
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block truncate">
                Admin Console
              </span>
            </div>
          )}
        </div>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-white" />
              {!collapsed && <span className="truncate flex-1">{item.name}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-sm bg-amber-500 text-slate-950 tabular-nums">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Admin user role footer & logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 mb-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 uppercase ring-1 ring-slate-700 shrink-0">
              {user.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                <ShieldCheck className="w-3 h-3" />
                <span className="uppercase">{user.role}</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            logout();
          }}
          className="flex items-center gap-3 w-full px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
          title="Logout from admin panel"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 bottom-0 left-0 z-30 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
