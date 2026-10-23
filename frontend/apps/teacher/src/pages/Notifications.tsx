import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Video,
  BookOpenCheck,
  Megaphone,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Notification } from '../types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const list = await teacherService.getNotifications();
      setNotifications(list);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, link?: string) => {
    await teacherService.markNotificationRead(id);
    await loadNotifications();
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    await teacherService.markAllNotificationsRead();
    await loadNotifications();
  };

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    return n.type === filterType;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lesson':
      case 'schedule':
        return <Calendar className="w-4 h-4 text-cyan-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-emerald-600" />;
      case 'homework':
        return <BookOpenCheck className="w-4 h-4 text-amber-600" />;
      case 'announcement':
      case 'admin':
      default:
        return <Megaphone className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Xabarnomalar markazi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Darslar jadvali, video tekshiruvi xulosalari va o‘quv bo‘limi yangiliklari
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <CheckCheck className="w-4 h-4 text-cyan-600" />
            <span>Barchasini o‘qilgan deb belgilash</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Barchasi ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterType === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          O‘qilmagan ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Xabarnomalar mavjud emas.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 text-xs transition-colors hover:bg-slate-50 flex items-start justify-between gap-4 ${
                !item.read ? 'bg-cyan-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 p-2 rounded-lg bg-slate-100 shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                  <div className="text-[11px] text-slate-400 font-mono mt-2">
                    {item.created_at}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.link_url && (
                  <button
                    onClick={() => handleMarkAsRead(item.id, item.link_url)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                  >
                    <span>O‘tish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg"
                    title="O‘qilgan deb belgilash"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
