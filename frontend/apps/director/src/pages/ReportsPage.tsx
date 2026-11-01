import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  DollarSign,
  GraduationCap,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { Course, DirectorMonthlyReport, Group, Teacher } from '../types';
import { exportToCSV } from '../utils/exportUtils';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const currentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const ReportsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { success, info, error } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [report, setReport] = useState<DirectorMonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      value,
      label: new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', {
        month: 'long',
        year: 'numeric',
      }).format(date),
    };
  });

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [teacherRows, courseRows, groupRows] = await Promise.all([
          DirectorService.getTeachers(),
          DirectorService.getCourses(),
          DirectorService.getGroups()
        ]);
        setTeachers(teacherRows);
        setCourses(courseRows);
        setGroups(groupRows);
      } catch {
        error('Xatolik', 'Hisobot filtrlarini API’dan yuklab bo‘lmadi.');
      }
    };
    loadFilters();
  }, [error]);

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let active = true;
    setReportLoading(true);
    DirectorService.getMonthlyReport({
      month,
      year,
      teacher: selectedTeacher,
      course: selectedCourse,
      group: selectedGroup,
    }).then(data => {
      if (active) setReport(data);
    }).catch(() => {
      if (active) {
        setReport(null);
        error('Xatolik', 'Hisobot ma’lumotlarini API’dan yuklab bo‘lmadi.');
      }
    }).finally(() => {
      if (active) setReportLoading(false);
    });
    return () => { active = false; };
  }, [selectedMonth, selectedTeacher, selectedCourse, selectedGroup, error]);

  const handleExportExcel = () => {
    if (!report) return;
    const headers = ['Hisobot Bo‘limi', 'Ko‘rsatkich Nomi', 'Qiymat', 'Qo‘shimcha Izoh / Ulush', 'Davr'];
    const revenue = Number(report.tuition_collected);
    const methodRows = [
      ['Naqd Kassa (Cash)', 'cash'],
      ['Click', 'click'],
      ['Payme', 'payme'],
      ['Uzum', 'uzum'],
    ].map(([label, method]) => {
      const amount = Number(report.revenue_by_method[method] || 0);
      return ['Moliya', label, `${amount.toLocaleString()} UZS`, `${revenue ? Math.round(amount / revenue * 100) : 0}%`, selectedMonth];
    });
    const attendanceRate = report.attendance.total
      ? Math.round(report.attendance.present / report.attendance.total * 100)
      : 0;
    const rows = [
      ['Moliya', 'Jami Tushum (Total Revenue)', `${revenue.toLocaleString()} UZS`, '100%', selectedMonth],
      ...methodRows,
      ['Talabalar', 'Yangi Talabalar (New)', `${report.students.new} nafar`, 'Oy davomida qabul qilingan', selectedMonth],
      ['Talabalar', 'Faol Talabalar (Active)', `${report.students.active} nafar`, 'Faol hisoblar', selectedMonth],
      ['Talabalar', 'To‘xtatilgan (Blocked)', `${report.students.blocked} nafar`, 'Faol bo‘lmagan yoki cheklangan', selectedMonth],
      ['Talabalar', 'Jami Talabalar', `${report.students.total} nafar`, 'Baza bo‘yicha umumiy', selectedMonth],
      ['Ustozlar & Guruhlar', 'Ustozlar Soni', `${report.teachers} nafar`, 'Faol o‘qituvchilar', selectedMonth],
      ['Ustozlar & Guruhlar', 'Ustozlar maoshi', `${money(report.teacher_salary)} UZS`, 'Hisoblangan oylik maosh', selectedMonth],
      ['Ustozlar & Guruhlar', 'Akademik Guruhlar', `${report.groups} ta`, 'Faol guruhlar', selectedMonth],
      ['Davomat', 'Kelganlar', `${attendanceRate}%`, `${report.attendance.total} ta davomat yozuvi`, selectedMonth],
    ];
    exportToCSV(`Avlod_Talim_Hisobot_${selectedMonth}.csv`, headers, rows);
    success('Yuklab olindi', `Avlod_Talim_Hisobot_${selectedMonth}.csv fayli muvaffaqiyatli saqlandi`);
  };

  const handleExportPDF = () => {
    info('PDF Chop etish', 'Hisobot hujjatini chop etish / PDF sifatida saqlash oynasi ochilmoqda...');
    window.print();
  };

  const money = (value: string | number | undefined) => Number(value || 0).toLocaleString();
  const revenue = Number(report?.tuition_collected || 0);
  const methodAmount = (method: string) => Number(report?.revenue_by_method[method] || 0);
  const methodShare = (method: string) => revenue ? Math.round(methodAmount(method) / revenue * 100) : 0;
  const attendanceTotal = report?.attendance.total || 0;
  const attendanceShare = (status: 'present' | 'absent' | 'excused') => (
    attendanceTotal ? Math.round((report?.attendance[status] || 0) / attendanceTotal * 100) : 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('reports.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Buttons UI: Export Excel, Export PDF */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t('common.export')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'uz' ? 'PDF Chop etish' : language === 'ru' ? 'Печать PDF' : 'Print PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Month, Teacher, Course, Group) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Hisobot Oyi
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Ustoz (Mentor)
            </label>
            <select
              value={selectedTeacher}
              onChange={e => setSelectedTeacher(e.target.value)}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden"
            >
              <option value="all">Barcha ustozlar</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Kurs
            </label>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden"
            >
              <option value="all">Barcha kurslar</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Group */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Guruh
            </label>
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden"
            >
              <option value="all">Barcha guruhlar</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 1: Financial (Total revenue, Cash, Click, Payme, Uzum) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9EAF3] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-gray-900">
            Financial (Moliyaviy Ko‘rsatkichlar)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-100">
            <span className="text-[11px] font-semibold text-purple-700 block">Total Revenue</span>
            <span className="text-lg font-black text-[#5C42FD] mt-1 block">{report ? `${money(report.tuition_collected)} UZS` : reportLoading ? 'Yuklanmoqda...' : '—'}</span>
            <span className="text-[10px] text-gray-500">Jami tushum</span>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-600 block">Cash (Naqd Kassa)</span>
            <span className="text-lg font-bold text-gray-900 mt-1 block">{report ? `${money(methodAmount('cash'))} UZS` : '—'}</span>
            <span className="text-[10px] text-gray-500">{report ? `${methodShare('cash')}% ulush` : '—'}</span>
          </div>

          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-700 block">Click</span>
            <span className="text-lg font-bold text-blue-900 mt-1 block">{report ? `${money(methodAmount('click'))} UZS` : '—'}</span>
            <span className="text-[10px] text-gray-500">{report ? `${methodShare('click')}% ulush` : '—'}</span>
          </div>

          <div className="p-4 bg-cyan-50/70 rounded-xl border border-cyan-100">
            <span className="text-[11px] font-semibold text-cyan-700 block">Payme</span>
            <span className="text-lg font-bold text-cyan-900 mt-1 block">{report ? `${money(methodAmount('payme'))} UZS` : '—'}</span>
            <span className="text-[10px] text-gray-500">{report ? `${methodShare('payme')}% ulush` : '—'}</span>
          </div>

          <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-100">
            <span className="text-[11px] font-semibold text-purple-700 block">Uzum</span>
            <span className="text-lg font-bold text-purple-900 mt-1 block">{report ? `${money(methodAmount('uzum'))} UZS` : '—'}</span>
            <span className="text-[10px] text-gray-500">{report ? `${methodShare('uzum')}% ulush` : '—'}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Students (New students, Active students, Blocked students, Total students) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9EAF3] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#5C42FD]" />
          <h3 className="text-base font-bold text-gray-900">
            Students (Talabalar Ko‘rsatkichlari)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <span className="text-[11px] font-semibold text-indigo-700 block">New Students</span>
            <span className="text-xl font-black text-indigo-950 mt-1 block">{report ? `+${report.students.new} nafar` : '—'}</span>
            <span className="text-[10px] text-gray-500">Shu oy qo‘shilgan</span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 block">Active Students</span>
            <span className="text-xl font-black text-emerald-900 mt-1 block">{report ? `${report.students.active} nafar` : '—'}</span>
            <span className="text-[10px] text-gray-500">Darslarga qatnayotgan</span>
          </div>

          <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-100">
            <span className="text-[11px] font-semibold text-rose-700 block">Blocked Students</span>
            <span className="text-xl font-black text-rose-900 mt-1 block">{report ? `${report.students.blocked} nafar` : '—'}</span>
            <span className="text-[10px] text-gray-500">Qarzdorlik / to‘xtatilgan</span>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-700 block">Total Students</span>
            <span className="text-xl font-black text-gray-900 mt-1 block">{report ? `${report.students.total} nafar` : '—'}</span>
            <span className="text-[10px] text-gray-500">Baza bo‘yicha umumiy</span>
          </div>
        </div>
      </div>

      {/* Section 3 & 4: Teachers & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers (Teacher salary, Students, Groups) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E9EAF3] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">
              Teachers (Ustozlar Ko‘rsatkichi)
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 block">Teacher Salary</span>
              <span className="text-base font-black text-gray-900 mt-1 block">{report ? `${money(report.teacher_salary)} UZS` : '—'}</span>
              <span className="text-[10px] text-gray-400">Hisoblangan maosh</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 block">Students</span>
              <span className="text-base font-black text-[#5C42FD] mt-1 block">{report ? `${report.students.total} nafar` : '—'}</span>
              <span className="text-[10px] text-gray-400">O‘quvchilar</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 block">Groups</span>
              <span className="text-base font-black text-gray-900 mt-1 block">{report ? `${report.groups} ta` : '—'}</span>
              <span className="text-[10px] text-gray-400">Faol guruhlar</span>
            </div>
          </div>
        </div>

        {/* Attendance (Present, Absent, Late) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E9EAF3] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">
              Attendance (Davomat Statistikasi)
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-700 block">Present (Kelgan)</span>
              <span className="text-base font-black text-emerald-900 mt-1 block">{report ? `${attendanceShare('present')}%` : '—'}</span>
              <span className="text-[10px] text-emerald-600">{report ? `${report.attendance.present} ta` : 'API’dan olinadi'}</span>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[11px] font-semibold text-rose-700 block">Absent (Kelmadi)</span>
              <span className="text-base font-black text-rose-900 mt-1 block">{report ? `${attendanceShare('absent')}%` : '—'}</span>
              <span className="text-[10px] text-rose-600">{report ? `${report.attendance.absent} ta` : 'API’dan olinadi'}</span>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[11px] font-semibold text-amber-700 block">Excused (Sababli)</span>
              <span className="text-base font-black text-amber-900 mt-1 block">{report ? `${attendanceShare('excused')}%` : '—'}</span>
              <span className="text-[10px] text-amber-600">{report ? `${report.attendance.excused} ta` : 'API’dan olinadi'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
