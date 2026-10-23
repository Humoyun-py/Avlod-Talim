import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  BookOpen,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Student, Group, AttendanceRecord, HomeworkSubmission } from '../types';

export const MyStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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

  const handleOpenStudentDetails = async (student: Student) => {
    setSelectedStudent(student);
    // Load student attendance and homework history
    const allAttendance = await teacherService.getAttendance();
    const studentAttendance = allAttendance.filter((a) => a.student_id === student.id);
    setAttendance(studentAttendance);

    const allSubmissions = await teacherService.getSubmissions('hw-001');
    setSubmissions(allSubmissions.filter((sub) => sub.student_id === student.id));
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroupId === 'all' || s.group_id === selectedGroupId;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Mening talabalarim
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sizning guruhlaringizda tahsil olayotgan talabalar ro‘yxati va ularning o‘zlashtirish ko‘rsatkichlari
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <Shield className="w-4 h-4 text-cyan-600" />
          <span>Faqat sizga tegishli guruh talabalari ko‘rsatiladi</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="F.I.Sh yoki ID (masalan: AVL-2026)..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Guruh bo‘yicha:</span>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-medium"
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

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Talaba ID</th>
                <th className="py-3 px-4">F.I.Sh</th>
                <th className="py-3 px-4">Guruhi</th>
                <th className="py-3 px-4">Kurs yo‘nalishi</th>
                <th className="py-3 px-4">Telefon</th>
                <th className="py-3 px-4 text-center">Davomat ko‘rsatkichi</th>
                <th className="py-3 px-4 text-center">Holati</th>
                <th className="py-3 px-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    Qidiruv bo‘yicha talaba topilmadi.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600 text-[11px]">
                      {student.student_code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{student.full_name}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{student.group_name}</td>
                    <td className="py-3 px-4 text-slate-500">{student.course_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{student.phone}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              student.attendance_rate >= 90
                                ? 'bg-emerald-500'
                                : student.attendance_rate >= 80
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${student.attendance_rate}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-[11px] tabular-nums">
                          {student.attendance_rate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                        Faol o‘quvchi
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStudentDetails(student)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors"
                      >
                        Tafsilotlar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{selectedStudent.full_name}</h3>
                <p className="text-xs text-cyan-400 font-mono">
                  {selectedStudent.student_code} · {selectedStudent.group_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Stat grid */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Jami darslar</div>
                  <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                    {selectedStudent.total_lessons}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800">
                  <div className="text-[10px] text-emerald-600 font-semibold uppercase">Qatnashgan</div>
                  <div className="text-base font-mono font-bold mt-0.5">
                    {selectedStudent.attended_lessons}
                  </div>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-800">
                  <div className="text-[10px] text-rose-600 font-semibold uppercase">Qoldirgan</div>
                  <div className="text-base font-mono font-bold mt-0.5">
                    {selectedStudent.missed_lessons}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                  <div className="text-[10px] text-amber-600 font-semibold uppercase">Kechikkan</div>
                  <div className="text-base font-mono font-bold mt-0.5">
                    {selectedStudent.late_lessons}
                  </div>
                </div>
              </div>

              {/* Contact info (Safe: no plaintext credentials) */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                  Bog‘lanish ma’lumotlari:
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Talaba telefoni:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudent.phone}</span>
                </div>
                {selectedStudent.parent_phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Ota-onasi telefoni:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedStudent.parent_phone}
                    </span>
                  </div>
                )}
              </div>

              {/* Attendance Log */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide mb-2.5">
                  So‘nggi darslar davomat yozuvlari
                </h4>
                {attendance.length === 0 ? (
                  <p className="text-slate-400 italic">Davomat yozuvlari mavjud emas</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between bg-slate-50/50"
                      >
                        <div className="font-mono text-[11px] text-slate-600">{att.marked_at}</div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            att.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : att.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {att.status === 'present' ? 'Bor' : att.status === 'late' ? 'Kechikdi' : 'Yo‘q'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
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
