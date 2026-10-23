import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CheckCircle2,
  Video,
  AlertTriangle,
  Calendar,
  X,
  Layers,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Lesson } from '../types';
import { CompleteLessonModal } from '../components/modals/CompleteLessonModal';

export const LessonSchedule: React.FC = () => {
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedLessonForModal, setSelectedLessonForModal] = useState<Lesson | null>(null);
  const [detailsLesson, setDetailsLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getSchedule();
      setLessons(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonCompleted = (updatedLesson: Lesson) => {
    setLessons((prev) => prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)));
  };

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Filter lessons
  const visibleLessons = lessons.filter((l) => {
    if (viewMode === 'day') {
      return l.date === selectedDate;
    }
    const target = new Date(`${selectedDate}T00:00:00`);
    const start = new Date(target); start.setDate(target.getDate() - ((target.getDay() + 6) % 7));
    const end = new Date(start); end.setDate(start.getDate() + 7);
    const lessonDate = new Date(`${l.date}T00:00:00`);
    return lessonDate >= start && lessonDate < end;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Complete lesson modal */}
      <CompleteLessonModal
        lesson={selectedLessonForModal}
        isOpen={!!selectedLessonForModal}
        onClose={() => setSelectedLessonForModal(null)}
        onCompleted={handleLessonCompleted}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dars jadvali
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kunlik va haftalik darslar ro‘yxati, xonalar va dars holati
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'day'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kunlik ko‘rinish
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Haftalik ro‘yxat
          </button>
        </div>
      </div>

      {/* Date Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Oldingi kun"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-cyan-600" />
            <span>{selectedDate}</span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Keyingi kun"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-cyan-700 bg-cyan-50 rounded-md hover:bg-cyan-100 transition-colors"
          >
            Bugun
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Topilgan darslar: <span className="font-mono font-bold text-slate-900">{visibleLessons.length}</span> ta
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-3.5">
        {visibleLessons.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-700">Bu kunda rejalashtirilgan darslar yo‘q</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Boshqa sanani tanlang yoki darslar jadvalini administrator orqali tekshiring.
            </p>
          </div>
        ) : (
          visibleLessons.map((lesson) => {
            const isCompleted = lesson.status === 'completed';
            const isInProgress = lesson.status === 'in_progress';

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-cyan-400/70 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Timing & Group Details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-extrabold text-base text-slate-900">
                        {lesson.group_name}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs font-medium text-slate-600">
                        {lesson.course_name}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isCompleted
                          ? 'Yakunlangan'
                          : isInProgress
                          ? 'Dars jarayonida'
                          : 'Kutilmoqda'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lesson.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {lesson.start_time} - {lesson.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lesson.room}</span>
                      </div>
                    </div>

                    {lesson.topic && (
                      <div className="text-xs text-slate-800 pt-1 font-medium">
                        <span className="text-slate-500 font-normal">Mavzu:</span> {lesson.topic}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => setDetailsLesson(lesson)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Tafsilotlar
                    </button>

                    <button
                      onClick={() => navigate(`/attendance?lessonId=${lesson.id}`)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                        lesson.attendance_submitted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-xs'
                      }`}
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>{lesson.attendance_submitted ? 'Davomat kiritilgan' : 'Davomat olish'}</span>
                    </button>

                    {!isCompleted ? (
                      <button
                        onClick={() => setSelectedLessonForModal(lesson)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Darsni yakunlash</span>
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

      {/* Lesson Details Modal */}
      {detailsLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{detailsLesson.group_name}</h3>
                <p className="text-xs text-cyan-400">{detailsLesson.course_name}</p>
              </div>
              <button
                onClick={() => setDetailsLesson(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sana & Vaqt:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {detailsLesson.date} ({detailsLesson.start_time} - {detailsLesson.end_time})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">O‘quv xonasi:</span>
                  <span className="font-bold text-slate-900">{detailsLesson.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Davomat holati:</span>
                  <span className="font-bold text-slate-900">
                    {detailsLesson.attendance_submitted ? 'Kiritilgan' : 'Kiritilmagan'}
                  </span>
                </div>
              </div>

              {detailsLesson.topic && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Mavzu:</h4>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                    {detailsLesson.topic}
                  </p>
                </div>
              )}

              {detailsLesson.summary && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Dars xulosasi:</h4>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                    {detailsLesson.summary}
                  </p>
                </div>
              )}

              {detailsLesson.homework_assigned && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Berilgan uy vazifasi:</h4>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                    {detailsLesson.homework_assigned}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDetailsLesson(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
