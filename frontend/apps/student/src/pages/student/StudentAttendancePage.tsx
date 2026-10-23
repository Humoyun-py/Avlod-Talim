import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Search,
  Filter,
  Send,
  Calendar,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, AttendanceRecord } from '../../types';
import { StudentApiService } from '../../services/studentApi';
import { useToast } from '../../context/ToastContext';

export const StudentAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    attended: 0,
    missed: 0,
    late: 0,
    excused: 0,
    percentage: 100
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inquiry / Correction Request Modal
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [inquiryText, setInquiryText] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);

  const loadAttendance = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const res = await StudentApiService.getAttendance(student.id);
      setRecords(res.records);
      setStats(res.stats);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [student?.id]);

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
      const matchesSearch =
        rec.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.date.includes(searchQuery) ||
        rec.dayOfWeek.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [records, statusFilter, searchQuery]);

  const handleSendInquiry = async () => {
    if (!inquiryText.trim()) return;
    setSendingInquiry(true);
    try {
      // Simulate sending inquiry to administration/teacher
      await new Promise(r => setTimeout(r, 600));
      success(
        'Murojaat yuborildi',
        'Davomat bo‘yicha tushuntirishingiz ma’muriyat va ustozingizga yetkazildi.'
      );
      setInquiryText('');
      setSelectedRecord(null);
      setInquiryModalOpen(false);
    } catch {
      error('Xatolik', 'Murojaatni yuborib bo‘lmadi');
    } finally {
      setSendingInquiry(false);
    }
  };

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Header & KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Attendance Rate */}
        <div className="col-span-2 lg:col-span-1 bg-[#0F172A] rounded-2xl p-5 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
              Davomat Ko‘rsatkichi
            </span>
            <div className="text-3xl font-bold font-mono text-white mt-1 tabular-nums">
              {stats.percentage}%
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Avlod Ta’lim sifat me’yori: 85%+
          </p>
        </div>

        {/* Total Lessons */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Jami Darslar</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {stats.total}
          </div>
          <span className="text-[10px] text-slate-400">O‘quv rejasi asosida</span>
        </div>

        {/* Attended */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Qatnashgan</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {stats.attended}
          </div>
          <span className="text-[10px] text-slate-400">Darsda hozir bo‘lgan</span>
        </div>

        {/* Late */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase">Kechikishlar</span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {stats.late}
          </div>
          <span className="text-[10px] text-slate-400">10 daqiqadan ko‘p</span>
        </div>

        {/* Missed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 uppercase">Qoldirilgan</span>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
            {stats.missed}
          </div>
          <span className="text-[10px] text-slate-400">{stats.excused} tasi sababli</span>
        </div>
      </div>

      {/* Info notice: records are read-only */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
          <p className="text-slate-700 leading-relaxed">
            <strong>Eslatma:</strong> Davomat yozuvlari elektron jurnalga ustoz tomonidan dars vaqtida kiritiladi va talaba tomonidan bevosita o‘zgartirilishi taqiqlangan. Xatolik yoki sababli dars qoldirilgan bo‘lsa, tushuntirish xati yuborishingiz mumkin.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedRecord(null);
            setInquiryModalOpen(true);
          }}
          className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-lg font-semibold transition-colors shadow-2xs"
        >
          Ma’muriyatga so‘rov yuborish
        </button>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Darslar Davomati Jurnali</h3>
            <p className="text-xs text-slate-500">
              Guruh: <strong className="text-slate-800">{student.groupName}</strong> ({student.courseName})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Mavzu yoki sana bo‘yicha..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700"
            >
              <option value="all">Barcha holatlar</option>
              <option value="Present">Qatnashgan</option>
              <option value="Late">Kechikkan</option>
              <option value="Excused">Sababli</option>
              <option value="Absent">Qatnashmagan</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">Sana & Hafta kuni</th>
                <th className="px-5 py-3 font-semibold">Dars Mavzusi</th>
                <th className="px-5 py-3 font-semibold">Ustoz</th>
                <th className="px-5 py-3 font-semibold">Holat</th>
                <th className="px-5 py-3 font-semibold">Izoh</th>
                <th className="px-5 py-3 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Davomat yozuvlari topilmadi
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900">{rec.date}</span>
                      <span className="text-[11px] text-slate-400 block">{rec.dayOfWeek}</span>
                    </td>

                    <td className="px-5 py-3.5 max-w-sm">
                      <p className="font-semibold text-slate-900">{rec.topic}</p>
                      <p className="text-[11px] text-slate-400">{rec.groupName}</p>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700">
                      {rec.teacherName || student.teacherName}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {rec.status === 'Present' && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          Qatnashdi
                        </span>
                      )}
                      {rec.status === 'Late' && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          Kechikdi
                        </span>
                      )}
                      {rec.status === 'Excused' && (
                        <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          Sababli
                        </span>
                      )}
                      {rec.status === 'Absent' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          Qatnashmadi
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 text-[11px] max-w-xs">
                      {rec.note || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {rec.status !== 'Present' && (
                        <button
                          onClick={() => {
                            setSelectedRecord(rec);
                            setInquiryModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 underline"
                        >
                          Tushuntirish berish
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Modal */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Davomat bo‘yicha tushuntirish yuborish
              </h3>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {selectedRecord && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-900">{selectedRecord.topic}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Sana: {selectedRecord.date} ({selectedRecord.dayOfWeek}) · Holat: {selectedRecord.status}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sabab yoki tushuntirish xatingiz:
                </label>
                <textarea
                  rows={4}
                  value={inquiryText}
                  onChange={e => setInquiryText(e.target.value)}
                  placeholder="Masalan: Tibbiy ma’lumotnoma asosida yoki texnik uzilish sababli darsda kechikib qatnashdim..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                disabled={sendingInquiry || !inquiryText.trim()}
                onClick={handleSendInquiry}
                className="px-4 py-2 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {sendingInquiry ? 'Yuborilmoqda...' : 'Yuborish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
