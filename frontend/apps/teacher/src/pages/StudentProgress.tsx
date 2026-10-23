import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  Users2,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Student, Group } from '../types';

export const StudentProgress: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, g] = await Promise.all([
        teacherService.getStudents(),
        teacherService.getGroups(),
      ]);
      setStudents(s);
      setGroups(g);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesGroup = selectedGroupId === 'all' || s.group_id === selectedGroupId;
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Talabalar natijalari va monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Guruhlar va talabalar bo‘yicha davomat foizi, darslarda ishtirok dinamikasi va akademik intizom
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Talaba nomi yoki kodi bo‘yicha qidirish..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Guruh filtri:</span>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-semibold"
          >
            <option value="all">Barcha guruhlar ({groups.length})</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.course_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Cards / Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Talaba ID</th>
                <th className="py-3 px-4">F.I.Sh</th>
                <th className="py-3 px-4">Guruhi</th>
                <th className="py-3 px-4 text-center">Jami darslar</th>
                <th className="py-3 px-4 text-center">Qatnashdi</th>
                <th className="py-3 px-4 text-center">Qoldirdi</th>
                <th className="py-3 px-4 text-center">Kechikdi</th>
                <th className="py-3 px-4 text-center">Davomat ko‘rsatkichi</th>
                <th className="py-3 px-4 text-center">Natija statusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    Tanlangan mezonlar bo‘yicha talabalar topilmadi.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const hasLessons = s.total_lessons > 0;
                  const isHigh = s.attendance_rate >= 90;
                  const isMedium = s.attendance_rate >= 75 && s.attendance_rate < 90;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 text-[11px]">
                        {s.student_code}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.full_name}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{s.group_name}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {hasLessons ? s.total_lessons : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                        {hasLessons ? s.attended_lessons : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                        {hasLessons ? s.missed_lessons : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-600">
                        {hasLessons ? s.late_lessons : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasLessons ? (
                          <span
                            className={`font-mono font-bold text-xs ${
                              isHigh
                                ? 'text-emerald-700'
                                : isMedium
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {s.attendance_rate}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            Dars boshlanmagan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isHigh
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMedium
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isHigh ? 'A’lo intizom' : isMedium ? 'O‘rtacha' : 'Xavf ostida'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
