import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Users2,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Group, Student, Lesson } from '../types';

export const ReportsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [g, s, l] = await Promise.all([
        teacherService.getGroups(),
        teacherService.getStudents(),
        teacherService.getSchedule(),
      ]);
      setGroups(g);
      setStudents(s);
      setLessons(l);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered calculations
  const filteredLessons = lessons.filter((l) => {
    const matchesGroup = selectedGroup === 'all' || l.group_id === selectedGroup;
    const matchesPeriod = l.date.startsWith(selectedPeriod);
    return matchesGroup && matchesPeriod;
  });

  const filteredStudents = students.filter((s) => {
    return selectedGroup === 'all' || s.group_id === selectedGroup;
  });

  const completedCount = filteredLessons.filter((l) => l.status === 'completed').length;
  const plannedCount = filteredLessons.filter((l) => l.status === 'planned').length;

  const totalAttRate = filteredStudents.reduce((acc, s) => acc + s.attendance_rate, 0);
  const avgAttRate =
    filteredStudents.length > 0 ? (totalAttRate / filteredStudents.length).toFixed(1) : '0';

  // Real CSV export generator
  const exportToCSV = () => {
    const headers = [
      'Guruh',
      'Kurs',
      'Talaba F.I.Sh',
      'Talaba ID',
      'Davomat Foizi',
      'Qatnashgan Darslar',
      'Qoldirilgan Darslar',
      'Kechikishlar',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.group_name}"`,
      `"${s.course_name}"`,
      `"${s.full_name}"`,
      `"${s.student_code}"`,
      `"${s.attendance_rate}%"`,
      s.attended_lessons,
      s.missed_lessons,
      s.late_lessons,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Avlod_Talim_Hisobot_${selectedPeriod}_${selectedGroup}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            O‘qituvchi hisobotlari va tahlili
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Darslar hajmi, o‘quvchilar ishtiroki va guruhlar bo‘yicha tahliliy statistika
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors inline-flex items-center gap-2 shadow-xs"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>CSV Formatda yuklab olish</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Hisobot oyi:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
          >
            <option value="2026-10">Oktabr 2026</option>
            <option value="2026-09">Sentabr 2026</option>
            <option value="2026-08">Avgust 2026</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Guruh:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Jami rejadagi darslar</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            {filteredLessons.length}
          </div>
          <span className="text-[11px] text-slate-400">Tanlangan davrda</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">O‘tilgan darslar</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums mt-1">
            {completedCount}
          </div>
          <span className="text-[11px] text-slate-400">Hisoboti tasdiqlangan</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Kutilayotgan darslar</span>
          <div className="text-2xl font-bold font-mono text-cyan-600 tabular-nums mt-1">
            {plannedCount}
          </div>
          <span className="text-[11px] text-slate-400">Jadval bo‘yicha</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">O‘rtacha davomat foizi</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums mt-1">
            {avgAttRate}%
          </div>
          <span className="text-[11px] text-slate-400">Talabalar qatnashuvi</span>
        </div>
      </div>

      {/* Detailed Groups Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Guruhlar bo‘yicha davomat va samaradorlik
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {groups.length} ta guruh tahlili
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Guruh nomi</th>
                <th className="py-3 px-4">Kurs yo‘nalishi</th>
                <th className="py-3 px-4 text-center">Talabalar soni</th>
                <th className="py-3 px-4 text-center">O‘tilgan darslar</th>
                <th className="py-3 px-4 text-center">O‘rtacha davomat</th>
                <th className="py-3 px-4 text-right">Reyting holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => {
                const gStudents = students.filter((s) => s.group_id === group.id);
                const gRate =
                  gStudents.length > 0
                    ? (
                        gStudents.reduce((a, b) => a + b.attendance_rate, 0) / gStudents.length
                      ).toFixed(1)
                    : '0';
                const gCompleted = lessons.filter(
                  (l) => l.group_id === group.id && l.status === 'completed'
                ).length;

                return (
                  <tr key={group.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{group.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{group.course_name}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {group.student_count}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                      {gCompleted}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {gRate}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">
                        Yaxshi natija
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
