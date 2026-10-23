import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState<number>(0);
  const location = useLocation();

  const fetchLayoutData = async () => {
    try {
      const [notifsRes, verifsRes] = await Promise.all([
        api.getNotifications(),
        api.getPendingVerifications(),
      ]);
      setNotifications(notifsRes.results || []);
      setPendingVerificationsCount(verifsRes.count || 0);
    } catch {
      // Ignore background refresh errors
    }
  };

  useEffect(() => {
    fetchLayoutData();
    // Poll notifications periodically every 30 seconds
    const interval = setInterval(fetchLayoutData, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      //
    }
  };

  const handleSelectNotification = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      //
    }
  };

  // Determine current page title & breadcrumbs based on pathname
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path.includes('/admin/students')) {
      return { title: 'Student Management', breadcrumbs: [{ label: 'Students' }] };
    }
    if (path.includes('/admin/groups')) {
      return { title: 'Group Management', breadcrumbs: [{ label: 'Groups' }] };
    }
    if (path.includes('/admin/courses')) {
      return { title: 'Course Management', breadcrumbs: [{ label: 'Courses' }] };
    }
    if (path.includes('/admin/payments')) {
      return { title: 'Payment Management', breadcrumbs: [{ label: 'Payments' }] };
    }
    if (path.includes('/admin/payment-verification')) {
      return { title: 'Payment Verification Queue', breadcrumbs: [{ label: 'Payments', path: '/admin/payments' }, { label: 'Verification' }] };
    }
    if (path.includes('/admin/shop-orders')) {
      return { title: 'Shop Orders Management', breadcrumbs: [{ label: 'Shop', path: '/admin/shop' }, { label: 'Orders' }] };
    }
    if (path.includes('/admin/shop')) {
      return { title: 'Shop Product Management', breadcrumbs: [{ label: 'Shop' }] };
    }
    if (path.includes('/admin/notifications')) {
      return { title: 'Notifications & Alerts', breadcrumbs: [{ label: 'Notifications' }] };
    }
    if (path.includes('/admin/profile')) {
      return { title: 'Admin Profile', breadcrumbs: [{ label: 'Profile' }] };
    }
    return { title: 'Academic Dashboard', breadcrumbs: [{ label: 'Overview' }] };
  };

  const { title, breadcrumbs } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        unreadNotificationsCount={notifications.filter((n) => !n.is_read).length}
        pendingVerificationsCount={pendingVerificationsCount}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <AdminHeader
          title={title}
          breadcrumbs={breadcrumbs}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          collapsed={collapsed}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onSelectNotification={handleSelectNotification}
        />

        {/* Dynamic page content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ refreshLayout: fetchLayoutData }} />
        </main>
      </div>
    </div>
  );
};
