import React, { useState, useEffect } from 'react';
import {
  Users2,
  BookOpen,
  Calendar,
  Clock,
  User,
  GraduationCap,
  ShieldAlert,
  Layers,
  CheckCircle2,
  MapPin,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, Group, Course, Student } from '../../types';
import { StudentApiService } from '../../services/studentApi';

export const StudentGroupPage: React.FC = () => {
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [classmates, setClassmates] = useState<Partial<Student>[]>([]);

  const loadData = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const res = await StudentApiService.getGroupDetails(student.groupId);
      setGroup(res.group);
      setCourse(res.course);
      setClassmates(res.classmates);
    } catch (err) {
      console.error('Error loading group details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [student?.groupId]);

  if (!student) return null;

  const modules = [
    { title: '1-Modul: Zamonaviy JavaScript (ES6+) & TypeScript', status: 'Yakunlangan' },
    { title: '2-Modul: React 19 Core, Hooks, State & Architecture', status: 'Jarayonda' },
    { title: '3-Modul: Server Actions, Next.js 15 & API Integration', status: 'Kutilmoqda' },
    { title: '4-Modul: Real FinTech & EdTech Diplom Loyihasi Himoyasi', status: 'Kutilmoqda' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <Users2 className="w-4 h-4" />
            <span>Akademik Guruh Ma’lumotlari</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {student.groupName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Kurs: <strong className="text-white">{student.courseName}</strong>
          </p>
        </div>

        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-400 block">Holatingiz:</span>
          <span className="font-bold text-emerald-400">Faol O‘quvchi (Active)</span>
        </div>
      </div>

      {/* Grid: Course Info & Classmates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Group & Course Curriculum (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Group Overview Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Guruh Tafsilotlari</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Mas’ul Ustoz:</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{student.teacherName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Mashg‘ulot Xonasi:</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{group?.room || 'Lab-A (2-qavat)'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Dars Jadvali:</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{group?.schedule || 'Dush-Chor-Juma 14:00 - 16:00'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Boshlangan Sana:</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{group?.startDate || '2026-01-15'}</span>
              </div>
            </div>
          </div>

          {/* Course Syllabus & Modules */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">O‘quv Dasturi & Modullar</h3>
            <p className="text-xs text-slate-500 mb-4">
              Avlod Ta’lim standarti bo‘yicha tuzilgan professional amaliy o‘quv rejasi
            </p>

            <div className="space-y-3">
              {modules.map((mod, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold font-mono flex items-center justify-center text-xs shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">{mod.title}</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                      mod.status === 'Yakunlangan'
                        ? 'bg-emerald-50 text-emerald-700'
                        : mod.status === 'Jarayonda'
                        ? 'bg-cyan-50 text-cyan-800'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Classmates List (Privacy Protected) (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Guruhdoshlar</h3>
                <p className="text-xs text-slate-500">
                  Jami: <strong className="text-slate-800">{classmates.length} ta o‘quvchi</strong>
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Himoyalangan</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Xavfsizlik talablariga asosan boshqa o‘quvchilarning shaxsiy telefon raqamlari va moliyaviy to‘lov ma’lumotlari yashirilgan.
            </p>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
              {classmates.map((cm, i) => {
                const isCurrent = cm.id === student.id;
                return (
                  <div
                    key={cm.id || i}
                    className={`py-3 flex items-center justify-between gap-3 text-xs ${
                      isCurrent ? 'bg-cyan-50/50 -mx-3 px-3 rounded-lg' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                        {cm.fullName
                          ? cm.fullName
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                          : 'ST'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {cm.fullName} {isCurrent && <span className="text-cyan-700">(Siz)</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Davomat: {cm.attendanceRate}%
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                      Faol
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
