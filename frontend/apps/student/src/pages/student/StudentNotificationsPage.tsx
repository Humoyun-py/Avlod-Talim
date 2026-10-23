import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Coins,
  ShoppingBag,
  Calendar,
  BookOpen,
  Megaphone,
  CheckCircle2,
  CheckCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, StudentNotification } from '../../types';
import { StudentApiService } from '../../services/studentApi';
import { useToast } from '../../context/ToastContext';

export const StudentNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;
  const { success } = useToast();

  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadNotifications = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const data = await StudentApiService.getNotifications(student.id);
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [student?.id]);

  useEffect(() => {
    window.addEventListener('student-notifications-updated', loadNotifications);
    return () => window.removeEventListener('student-notifications-updated', loadNotifications);
  }, [student?.id]);

  const handleMarkAsRead = async (id: string, linkTo?: string) => {
    await StudentApiService.markNotificationAsRead(id);
    await loadNotifications();
    if (linkTo) {
      navigate(linkTo);
    }
  };

  const handleMarkAllRead = async () => {
    if (!student) return;
    await StudentApiService.markAllNotificationsAsRead(student.id);
    success('Barchasi o‘qildi', 'Barcha bildirishnomalar o‘qilgan deb belgilandi');
    await loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filterType === 'unread') return !n.read;
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'coin':
        return <Coins className="w-4 h-4 text-amber-500" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-cyan-600" />;
      case 'homework':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'lesson':
      case 'schedule':
        return <Calendar className="w-4 h-4 text-sky-500" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <Bell className="w-4 h-4" />
            <span>Xabarnomalar Markazi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Bildirishnomalar
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Yangi coin mukofotlari, uy vazifalari muddatlari va do‘kon xaridlari holati.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Barchasini o‘qilgan qilish ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterType === 'all' ? 'bg-[#0F172A] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Barchasi ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('unread')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterType === 'unread' ? 'bg-[#0F172A] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          O‘qilmaganlar ({unreadCount})
        </button>
        <button
          onClick={() => setFilterType('coin')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterType === 'coin' ? 'bg-[#0F172A] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Coin mukofotlari
        </button>
        <button
          onClick={() => setFilterType('homework')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterType === 'homework' ? 'bg-[#0F172A] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Uy vazifalari
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Hozircha bildirishnomalar mavjud emas
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id, notif.linkTo)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                !notif.read ? 'bg-cyan-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  {getIcon(notif.type)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-bold ${!notif.read ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {notif.createdAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-center">
                <span className="text-[11px] font-semibold text-cyan-700 hover:underline flex items-center gap-1">
                  <span>Ko‘rish</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
