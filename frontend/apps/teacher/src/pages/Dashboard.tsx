import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users2,
  GraduationCap,
  CalendarCheck2,
  CalendarDays,
  Percent,
  BookOpenCheck,
  ArrowRight,
  Clock,
  MapPin,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Check,
  RefreshCw,
  Video,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { DashboardStats, Lesson, Group, AttendanceRecord, Announcement } from '../types';
import { useAuth } from '../context/AuthContext';
import { CompleteLessonModal } from '../components/modals/CompleteLessonModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lesson modal state
  const [selectedLessonForComplete, setSelectedLessonForComplete] = useState<Lesson | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [s, l, g, att, anc] = await Promise.all([
        teacherService.getDashboardStats(),
        teacherService.getSchedule(new Date().toISOString().slice(0, 10)),
        teacherService.getGroups(),
        Promise.resolve([]),
        teacherService.getAnnouncements(),
      ]);
      setStats(s);
      setLessons(l);
      setGroups(g);
      setRecentAttendance(att.slice(0, 5));
      setAnnouncements(anc);
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonCompleted = (updatedLesson: Lesson) => {
    setLessons((prev) => prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)));
    // Refresh stats
    teacherService.getDashboardStats().then(setStats);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
          <span>Boshqaruv paneli ma’lumotlari yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Complete lesson modal */}
      <CompleteLessonModal
        lesson={selectedLessonForComplete}
        isOpen={!!selectedLessonForComplete}
        onClose={() => setSelectedLessonForComplete(null)}
        onCompleted={handleLessonCompleted}
      />

      {/* Welcome & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Assalomu alaykum, {user?.full_name}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Avlod Ta’lim o‘qituvchi boshqaruv paneli · Bugun: 16-oktabr, 2026-yil
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/schedule')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
          >
            <CalendarDays className="w-4 h-4 text-slate-500" />
            <span>Haftalik dars jadvali</span>
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <ClipboardCheck className="w-4 h-4 text-cyan-400" />
            <span>Davomatni kiritish</span>
          </button>
        </div>
      </div>

      {/* 6 Key Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Groups */}
        <div
          onClick={() => navigate('/groups')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-400/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Guruhlarim</span>
            <Users2 className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats?.my_groups_count || 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Faol o‘quv guruhlari</div>
        </div>

        {/* Card 2: Students */}
        <div
          onClick={() => navigate('/students')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-400/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Talabalarim</span>
            <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats?.my_students_count || 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Jami biriktirilgan</div>
        </div>

        {/* Card 3: Lessons Today */}
        <div
          onClick={() => navigate('/schedule')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-400/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Bugungi darslar</span>
            <CalendarCheck2 className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats?.lessons_today_count || 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">16-oktabr uchun</div>
        </div>

        {/* Card 4: Lessons This Month */}
        <div
          onClick={() => navigate('/reports')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-400/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Oylik darslar</span>
            <CalendarDays className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats?.lessons_this_month || 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Oktabr 2026</div>
        </div>

        {/* Card 5: Attendance Rate */}
        <div
          onClick={() => navigate('/progress')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-400/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Davomat ko‘rsatkichi</span>
            <Percent className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {stats?.attendance_rate || 0}%
          </div>
          <div className="mt-1 text-[10px] text-slate-400">O‘rtacha ishtirok</div>
        </div>

        {/* Card 6: Pending Homework */}
        <div
          onClick={() => navigate('/homework')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-400/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Tekshirilmagan vazifalar</span>
            <BookOpenCheck className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-600 tabular-nums">
            {stats?.pending_homework_count || 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Kutilayotgan topshiriqlar</div>
        </div>
      </div>

      {/* Main Grid: Today's Lessons & Right Sidebar (Announcements & Groups) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Lesson Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-cyan-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Bugungi dars jadvali (16-oktabr)
                </h2>
              </div>
              <button
                onClick={() => navigate('/schedule')}
                className="text-xs text-cyan-700 hover:underline font-semibold inline-flex items-center gap-1"
              >
                Barchasi
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {lessons.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Bugun uchun rejalashtirilgan darslar yo‘q.
                </div>
              ) : (
                lessons.map((lesson) => {
                  const isCompleted = lesson.status === 'completed';
                  const isInProgress = lesson.status === 'in_progress';

                  return (
                    <div key={lesson.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-slate-900 text-sm">
                              {lesson.group_name}
                            </span>
                            <span className="text-slate-400 font-normal">·</span>
                            <span className="text-xs text-slate-600">{lesson.course_name}</span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInProgress
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isCompleted
                                ? 'Yakunlangan'
                                : isInProgress
                                ? 'Hozir dars ketmoqda'
                                : 'Rejalashtirilgan'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {lesson.start_time} - {lesson.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{lesson.room}</span>
                            </div>
                            {lesson.topic && (
                              <div className="text-slate-700 italic">
                                Mavzu: {lesson.topic}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lesson Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Attendance button */}
                          <button
                            onClick={() => navigate(`/attendance?lessonId=${lesson.id}`)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                              lesson.attendance_submitted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                            }`}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>{lesson.attendance_submitted ? 'Davomat kiritilgan' : 'Davomat olish'}</span>
                          </button>

                          {/* Complete Lesson button */}
                          {!isCompleted ? (
                            <button
                              onClick={() => setSelectedLessonForComplete(lesson)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Yakunlash</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate('/video-submissions')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
                            >
                              <Video className="w-3.5 h-3.5 text-slate-500" />
                              <span>Video hisobot</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Attendance Records Widget */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  So‘nggi kiritilgan davomat yozuvlari
                </h3>
              </div>
              <button
                onClick={() => navigate('/attendance')}
                className="text-xs text-cyan-700 hover:underline font-semibold"
              >
                Tafsilotlar
              </button>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="pb-2">Talaba</th>
                    <th className="pb-2">Talaba ID</th>
                    <th className="pb-2">Holat</th>
                    <th className="pb-2">Belgilangan vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-semibold text-slate-900">{rec.student_name}</td>
                      <td className="py-2.5 font-mono text-slate-500 text-[11px]">{rec.student_code}</td>
                      <td className="py-2.5">
                        <span
                          className={`font-semibold text-[11px] px-2 py-0.5 rounded ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'absent'
                              ? 'bg-rose-100 text-rose-800'
                              : rec.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {rec.status === 'present'
                            ? 'Bor'
                            : rec.status === 'absent'
                            ? 'Yo‘q'
                            : rec.status === 'late'
                            ? 'Kechikdi'
                            : 'Sababli'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">{rec.marked_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Announcements & Groups Overview */}
        <div className="space-y-6">
          {/* Important Announcements from Director / Admin */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Direktor va Ma’muriyat E’lonlari
                </h3>
              </div>
              <button
                onClick={() => navigate('/announcements')}
                className="text-xs text-cyan-700 hover:underline font-semibold"
              >
                Hammasi
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              {announcements.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        item.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 font-bold'
                          : item.priority === 'important'
                          ? 'bg-amber-100 text-amber-800 font-semibold'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.priority === 'urgent' ? 'Shoshilinch' : item.priority === 'important' ? 'Muhim' : 'E’lon'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.published_at}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-2">{item.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-500 font-medium">
                    Muallif: {item.author_name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Groups Quick Overview */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Guruhlarim ro‘yxati
                </h3>
              </div>
              <button
                onClick={() => navigate('/groups')}
                className="text-xs text-cyan-700 hover:underline font-semibold"
              >
                Ko‘rish
              </button>
            </div>

            <div className="p-3 divide-y divide-slate-100">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => navigate(`/groups?groupId=${group.id}`)}
                  className="py-2.5 px-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{group.name}</div>
                    <div className="text-[11px] text-slate-500">{group.course_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-800">
                      {group.student_count} talaba
                    </div>
                    <div className="text-[10px] text-slate-400">{group.start_time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
