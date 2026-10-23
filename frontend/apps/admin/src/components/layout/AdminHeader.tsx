import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

interface AdminHeaderProps {
  title: string;
  breadcrumbs: { label: string; path?: string }[];
  onOpenMobileSidebar: () => void;
  collapsed: boolean;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSelectNotification?: (id: string) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  breadcrumbs,
  onOpenMobileSidebar,
  collapsed,
  notifications,
  onMarkAllRead,
  onSelectNotification,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle + Breadcrumbs & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
            <Link to="/admin/dashboard" className="hover:text-slate-900 transition-colors">
              Avlod Admin
            </Link>
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                {bc.path ? (
                  <Link to={bc.path} className="hover:text-slate-900 transition-colors truncate">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-medium truncate">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Quick actions, notifications, user dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Search trigger shortcut */}
        <button
          type="button"
          onClick={() => navigate('/admin/students')}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Search student records"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search records...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
            /
          </kbd>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (onSelectNotification) onSelectNotification(n.id);
                        setNotifOpen(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <p className="font-semibold text-slate-800 mb-0.5">{n.title}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 text-center">
                <Link
                  to="/admin/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-slate-700 hover:text-slate-950 block py-1"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold uppercase">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
            )}
            <div className="hidden sm:block text-left text-xs">
              <span className="block font-semibold text-slate-900 leading-tight">
                {user?.full_name}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono uppercase">
                {user?.role}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs"
              onClick={() => setProfileOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{user?.full_name}</p>
                <p className="text-slate-400 font-mono text-[11px] truncate">{user?.email}</p>
              </div>

              <Link
                to="/admin/profile"
                className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2.5 w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
