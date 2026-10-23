import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Check,
  CreditCard,
  ShoppingBag,
  GraduationCap,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const { showToast } = useToast();

  const fetchNotifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNotifications();
      setNotifications(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      showToast('Failed to mark notification as read.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read.', 'success');
    } catch {
      showToast('Failed to update notifications.', 'error');
    }
  };

  const filtered = filterUnreadOnly
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Notifications & Alerts</h2>
          <p className="text-xs text-slate-500">
            Real-time audit alerts, payment verification submissions, and shop fulfillment updates
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-slate-600" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              filterUnreadOnly
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Unread Only ({unreadCount})</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading notifications..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchNotifs} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No notifications to display"
            description="All administrative alerts have been reviewed."
            icon={<CheckCircle2 className="w-8 h-8 text-slate-400" />}
          />
        ) : (
          filtered.map((item) => {
            const isPayment = item.type === 'payment';
            const isShop = item.type === 'shop';
            const isGroup = item.type === 'group';

            return (
              <div
                key={item.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !item.is_read ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isPayment
                        ? 'bg-emerald-50 text-emerald-700'
                        : isShop
                        ? 'bg-amber-50 text-amber-700'
                        : isGroup
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isPayment ? (
                      <CreditCard className="w-4 h-4" />
                    ) : isShop ? (
                      <ShoppingBag className="w-4 h-4" />
                    ) : isGroup ? (
                      <GraduationCap className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-xl">{item.message}</p>
                    <span className="text-[11px] text-slate-400 font-mono block pt-1">
                      {new Date(item.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {!item.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-950 p-1.5 rounded hover:bg-slate-100 transition-colors shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
