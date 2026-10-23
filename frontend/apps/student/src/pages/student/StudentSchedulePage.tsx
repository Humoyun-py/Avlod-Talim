import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Calendar,
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, LessonSchedule } from '../../types';
import { StudentApiService } from '../../services/studentApi';

export const StudentSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;

  const [schedules, setSchedules] = useState<LessonSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'upcoming' | 'all'>('weekly');

  const loadSchedule = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const data = await StudentApiService.getSchedule(student.groupId);
      setSchedules(data);
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [student?.groupId]);

  if (!student) return null;

  const upcomingLessons = schedules.filter(s => s.status === 'upcoming');
  const pastLessons = schedules.filter(s => s.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>Akademik Dars Jadvali</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {student.groupName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Kurs: <strong className="text-white">{student.courseName}</strong> · Ustoz:{' '}
            <strong className="text-cyan-300">{student.teacherName}</strong>
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex rounded-xl p-1 bg-slate-800 border border-slate-700 text-xs shrink-0">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'weekly' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Haftalik Jadval
          </button>
          <button
            onClick={() => setViewMode('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'upcoming' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Yaqinlashayotgan ({upcomingLessons.length})
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'all' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Barchasi
          </button>
        </div>
      </div>

      {/* Group Standard Timetable Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Standart Dars Rejasi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
              DUSH
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">14:00 - 16:00</p>
              <p className="text-[11px] text-slate-500">Lab-A (2-qavat)</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
              CHOR
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">14:00 - 16:00</p>
              <p className="text-[11px] text-slate-500">Lab-A (2-qavat)</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
              JUMA
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">14:00 - 16:00</p>
              <p className="text-[11px] text-slate-500">Lab-A (2-qavat)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Lesson Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          {viewMode === 'weekly'
            ? 'Hafta davomidagi darslar'
            : viewMode === 'upcoming'
            ? 'Yaqinlashayotgan darslar'
            : 'Barcha rejalashtirilgan darslar'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(viewMode === 'upcoming' ? upcomingLessons : schedules).map(lesson => {
            const isCompleted = lesson.status === 'completed';
            return (
              <div
                key={lesson.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50/70 border-slate-200 opacity-80'
                    : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="font-bold text-sm text-slate-900">
                      {lesson.dayOfWeek}
                    </span>
                    <span className="text-xs text-slate-500 font-mono ml-2">
                      ({lesson.date})
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-cyan-50 text-cyan-800'
                    }`}
                  >
                    {isCompleted ? 'O‘tildi' : 'Rejalashtirilgan'}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-3">
                  {lesson.topic}
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lesson.startTime} - {lesson.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{lesson.room}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ustoz: {lesson.teacherName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
