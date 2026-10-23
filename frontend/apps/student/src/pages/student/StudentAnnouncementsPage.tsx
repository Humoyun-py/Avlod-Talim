import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Pin,
  Calendar,
  User,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { StudentApiService } from '../../services/studentApi';
import { Announcement } from '../../types';

export const StudentAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await StudentApiService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = announcements.filter(ann => {
    const matchesPriority = priorityFilter === 'all' || ann.priority === priorityFilter;
    const matchesSearch =
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Akademiya Rasmiy Axborotnomasi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Rasmiy E’lonlar & Yangiliklar
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Direktorat va O‘quv bo‘limi tomonidan e’lon qilingan muhim xabarnomalar, tadbirlar va jadvallar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            {announcements.length} ta e’lon
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="E’lon nomi yoki matni..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-cyan-500 shadow-2xs"
          />
        </div>

        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
          <button
            onClick={() => setPriorityFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              priorityFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setPriorityFilter('Urgent')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              priorityFilter === 'Urgent' ? 'bg-white text-rose-800 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            Muhim
          </button>
          <button
            onClick={() => setPriorityFilter('Academic')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              priorityFilter === 'Academic' ? 'bg-white text-cyan-800 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            O‘quv jarayoni
          </button>
          <button
            onClick={() => setPriorityFilter('General')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              priorityFilter === 'General' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            Umumiy
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map(ann => {
          const isUrgent = ann.priority === 'Urgent';
          const isAcademic = ann.priority === 'Academic';

          return (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-2xs transition-all space-y-3 ${
                ann.pinned ? 'border-cyan-300 ring-1 ring-cyan-200/50' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {ann.pinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded">
                      <Pin className="w-3 h-3 text-cyan-700" />
                      <span>Qadalgan</span>
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isUrgent
                        ? 'bg-rose-100 text-rose-800'
                        : isAcademic
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isUrgent ? 'Shoshilinch' : isAcademic ? 'Akademik' : 'Umumiy e’lon'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">· {ann.date}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong>{ann.author}</strong> ({ann.authorRole})
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {ann.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
