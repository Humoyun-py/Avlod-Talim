import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Announcement } from '../types';

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'important' | 'normal'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getAnnouncements();
      setAnnouncements(data);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = announcements.filter((a) => {
    if (filterPriority === 'all') return true;
    return a.priority === filterPriority;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            E’lonlar va buyruqlar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Avlod Ta’lim direktsiyasi va o‘quv bo‘limi tomonidan berilgan rasmiy xabarlar
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <Lock className="w-4 h-4 text-cyan-600" />
          <span>Faqat o‘qish huquqi (Read-only)</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilterPriority('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterPriority === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Barchasi ({announcements.length})
        </button>
        <button
          onClick={() => setFilterPriority('urgent')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterPriority === 'urgent'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Shoshilinch ({announcements.filter((a) => a.priority === 'urgent').length})
        </button>
        <button
          onClick={() => setFilterPriority('important')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterPriority === 'important'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Muhim ({announcements.filter((a) => a.priority === 'important').length})
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-cyan-400/70 transition-all space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded font-bold ${
                    item.priority === 'urgent'
                      ? 'bg-rose-100 text-rose-800'
                      : item.priority === 'important'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.priority === 'urgent'
                    ? 'Shoshilinch'
                    : item.priority === 'important'
                    ? 'Muhim'
                    : 'Oddiy'}
                </span>

                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  Auditoriya: {item.target_audience}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.published_at}</span>
              </div>
            </div>

            <h2 className="text-base font-extrabold text-slate-900">{item.title}</h2>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {item.message}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-600" />
                <span>
                  Muallif:{' '}
                  <strong className="text-slate-800 font-semibold">{item.author_name}</strong> (
                  {item.author_role})
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Rasmiy bildirishnoma</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
