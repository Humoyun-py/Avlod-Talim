import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users2,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  X,
  BookOpen,
  ClipboardCheck,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Group, Student, Lesson } from '../types';

export const MyGroups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
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

      // Check URL query for groupId
      const qGroupId = searchParams.get('groupId');
      if (qGroupId) {
        const found = g.find((item) => item.id === qGroupId);
        if (found) setSelectedGroup(found);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesQuery =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.course_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const getGroupStudents = (groupId: string) => {
    return students.filter((s) => s.group_id === groupId);
  };

  const getGroupLessons = (groupId: string) => {
    return lessons.filter((l) => l.group_id === groupId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & RBAC Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Mening guruhlarim
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sizga biriktirilgan ta’lim guruhlari va ularning o‘quv jadvali
          </p>
        </div>

        {/* Teacher groups badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>Biriktirilgan o‘quv guruhlari</span>
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
            placeholder="Guruh nomi yoki kurs bo‘yicha qidirish..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        {/* Status Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Barchasi ({groups.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faol ({groups.filter((g) => g.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tugallangan ({groups.filter((g) => g.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGroups.map((group) => {
          const groupStudents = getGroupStudents(group.id);

          return (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-cyan-400/70 transition-all flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{group.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{group.course_name}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      group.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {group.status === 'active' ? 'Faol' : 'Tugallangan'}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">Dars kunlari:</span>
                    <span className="text-slate-900 font-semibold">{group.days.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">Vaqti:</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {group.start_time} - {group.end_time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">Xona:</span>
                    <span className="text-slate-900">{group.room}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">Talabalar:</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {groupStudents.length} nafar o‘quvchi
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedGroup(group)}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-800 inline-flex items-center gap-1"
                >
                  Guruh tafsilotlari
                  <ExternalLink className="w-3 h-3" />
                </button>

                <button
                  onClick={() => navigate(`/attendance?groupId=${group.id}`)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                >
                  <ClipboardCheck className="w-3 h-3 text-cyan-400" />
                  Davomat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Group Details Modal Drawer */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{selectedGroup.name} — Tafsilotlar</h3>
                <p className="text-xs text-cyan-400">{selectedGroup.course_name}</p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bosqich</span>
                  <span className="font-bold text-slate-900">{selectedGroup.level}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dars vaqti</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedGroup.start_time} - {selectedGroup.end_time}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Xona</span>
                  <span className="font-bold text-slate-900">{selectedGroup.room}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Talabalar soni</span>
                  <span className="font-mono font-bold text-slate-900">
                    {getGroupStudents(selectedGroup.id).length} nafar
                  </span>
                </div>
              </div>

              {/* Students in this group */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cyan-600" />
                  Guruhdagi talabalar ro‘yxati
                </h4>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">F.I.Sh</th>
                        <th className="py-2 px-3">Talaba ID</th>
                        <th className="py-2 px-3">Telefon</th>
                        <th className="py-2 px-3">Davomat %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getGroupStudents(selectedGroup.id).map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {student.full_name}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                            {student.student_code}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                            {student.phone}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-600">
                            {student.attendance_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Group schedule lessons */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  Darslar jadvali
                </h4>

                <div className="space-y-2">
                  {getGroupLessons(selectedGroup.id).map((l) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-lg border border-slate-200 flex items-center justify-between bg-slate-50/50"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{l.topic || 'Mavzu kiritilmagan'}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Sana: {l.date} · Vaqt: {l.start_time} - {l.end_time} · {l.room}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          l.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {l.status === 'completed' ? 'O‘tilgan' : 'Kutilmoqda'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedGroup(null)}
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
