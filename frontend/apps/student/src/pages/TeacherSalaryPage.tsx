import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Search,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  Eye,
  Calendar,
  Users,
  ArrowUpRight,
  TrendingUp,
  Download,
  FileCheck
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { TeacherSalaryRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Drawer } from '../components/common/Drawer';
import { useToast } from '../context/ToastContext';
import { exportToCSV } from '../utils/exportUtils';
import { useLanguage } from '../context/LanguageContext';

export const TeacherSalaryPage: React.FC = () => {
  const { t } = useLanguage();
  const { success, error, info } = useToast();
  const [salaries, setSalaries] = useState<TeacherSalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<TeacherSalaryRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const data = await DirectorService.getSalaries();
      setSalaries(data);
    } catch {
      error('Xatolik', 'Oylik hisoblarni yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaries();
  }, []);

  const filtered = salaries.filter(s =>
    s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePaySalary = async (record: TeacherSalaryRecord) => {
    try {
      await DirectorService.markSalaryPaid(record.id);
      success('To‘landi', `${record.teacherName} uchun ${record.calculatedSalary.toLocaleString()} UZS oylik to‘lovi tasdiqlandi`);
      loadSalaries();
      if (selectedRecord && selectedRecord.id === record.id) {
        setSelectedRecord({ ...selectedRecord, status: 'paid' });
      }
    } catch {
      error('Xatolik', 'Oylik to‘lovini tasdiqlashda xatolik yuz berdi');
    }
  };

  const handleExportSalaries = () => {
    if (filtered.length === 0) {
      info('Eksport', 'Eksport qilish uchun maoshlar topilmadi');
      return;
    }
    const headers = ['Ustoz F.I.SH', 'Fan / Yo‘nalish', 'Talabalar Soni', 'Guruhlardan Tushum (UZS)', 'Foiz Stavka', 'Hisoblangan Oylik (UZS)', 'Holati'];
    const rows = filtered.map(s => [
      s.teacherName,
      s.subject,
      s.studentsCount,
      s.totalRevenue,
      `${s.teacherPercentage}%`,
      s.calculatedSalary,
      s.status === 'paid' ? 'To‘langan' : 'Kutilmoqda'
    ]);
    exportToCSV('avlod_ustozlar_oylik_vedomosti.csv', headers, rows);
    success('Yuklab olindi', 'Ustozlar oylik vedomosti Excel/CSV fayl sifatida yuklandi');
  };

  const totalCalculatedSalaries = salaries.reduce((acc, curr) => acc + curr.calculatedSalary, 0);
  const totalAcademyRevenue = salaries.reduce((acc, curr) => acc + curr.totalRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('salary.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('salary.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportSalaries}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t('salary.export_payroll')}</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E9EAF3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t('salary.current_month_salaries')}
            </span>
            <h3 className="text-2xl font-black text-[#5C42FD] mt-1">
              {totalCalculatedSalaries.toLocaleString()} {t('common.uzs')}
            </h3>
            <span className="text-xs text-gray-400 mt-0.5 block">{t('salary.current_month_salaries')}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#5C42FD]/10 text-[#5C42FD] flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E9EAF3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Guruhlardan jami tushum
            </span>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {totalAcademyRevenue.toLocaleString()} UZS
            </h3>
            <span className="text-xs text-gray-400 mt-0.5 block">Mentorlar guruhlaridan yig‘ilgan</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E9EAF3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Standart Ustoz Foizi
            </span>
            <h3 className="text-2xl font-black text-purple-700 mt-1">
              40%
            </h3>
            <span className="text-xs text-gray-400 mt-0.5 block">Akademiya standart stavkasi</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5C42FD] flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] flex items-center justify-between shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Ustoz ismi yoki fani..."
            className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden"
          />
        </div>
        <span className="text-xs text-gray-500 font-semibold hidden sm:block">
          Faol vedomost: <strong>Oktyabr 2026</strong>
        </span>
      </div>

      {/* Salary Table (Table: Teacher, Students, Paid Students, Total Revenue, Teacher %, Salary, Status) */}
      <div className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FE] text-gray-500 font-bold border-b border-[#F0F1F7] tracking-wider uppercase text-[11px]">
              <tr>
                <th className="px-6 py-4">Ustoz</th>
                <th className="px-6 py-4 text-center">Talabalar</th>
                <th className="px-6 py-4 text-center">To‘laganlar</th>
                <th className="px-6 py-4">Umumiy Tushum</th>
                <th className="px-6 py-4 text-center">Ustoz %</th>
                <th className="px-6 py-4">Hisoblangan Maosh</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filtered.map(record => (
                <tr
                  key={record.id}
                  className="hover:bg-[#FAF9FE] transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedRecord(record);
                    setDrawerOpen(true);
                  }}
                >
                  {/* Teacher */}
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-gray-900 group-hover:text-[#5C42FD] transition-colors">
                      {record.teacherName}
                    </div>
                    <div className="text-[11px] text-gray-400">{record.subject}</div>
                  </td>

                  {/* Students */}
                  <td className="px-6 py-3.5 text-center font-semibold text-gray-700">
                    {record.studentsCount} ta
                  </td>

                  {/* Paid Students */}
                  <td className="px-6 py-3.5 text-center">
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {record.paidStudentsCount} ta
                    </span>
                  </td>

                  {/* Total Revenue */}
                  <td className="px-6 py-3.5 font-bold text-gray-900">
                    {record.totalRevenue.toLocaleString()} UZS
                  </td>

                  {/* Teacher % */}
                  <td className="px-6 py-3.5 text-center">
                    <span className="font-extrabold text-[#5C42FD] bg-purple-50 px-2 py-0.5 rounded-md">
                      {record.teacherPercentage}%
                    </span>
                  </td>

                  {/* Salary */}
                  <td className="px-6 py-3.5 font-black text-gray-900 text-sm">
                    {record.calculatedSalary.toLocaleString()} UZS
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3.5">
                    <StatusBadge status={record.status} size="sm" />
                  </td>

                  {/* Actions */}
                  <td
                    className="px-6 py-3.5 text-right space-x-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(record);
                        setDrawerOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-[#5C42FD] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Hisob tafsilotlari"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {record.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => handlePaySalary(record)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>To‘lash</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SALARY DETAIL DRAWER (Prompt spec 23) */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedRecord?.teacherName || 'Oylik Hisob Tafsilotlari'}
        subtitle={`Oy: ${selectedRecord?.month} • ${selectedRecord?.subject}`}
        width="2xl"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Summary Top Card */}
            <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    {t('salary.calculated_salary')}
                  </span>
                  <h3 className="text-2xl font-black text-[#5C42FD] mt-0.5">
                    {selectedRecord.calculatedSalary.toLocaleString()} UZS
                  </h3>
                </div>
                <StatusBadge status={selectedRecord.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-purple-200/60 text-xs">
                <div>
                  <span className="text-gray-500 text-[10px]">To‘plangan jami:</span>
                  <p className="font-bold text-gray-900">{selectedRecord.totalRevenue.toLocaleString()} UZS</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px]">Ustoz foizi:</span>
                  <p className="font-bold text-[#5C42FD]">{selectedRecord.teacherPercentage}%</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px]">To‘lagan talabalar:</span>
                  <p className="font-bold text-emerald-600">{selectedRecord.paidStudentsCount} / {selectedRecord.studentsCount}</p>
                </div>
              </div>
            </div>

            {/* Student List Breakdown Table (Student, Monthly payment, 40%, Teacher share) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Talabalar Kesimida Taqsimot
                </h4>
                <span className="text-[11px] text-gray-400">Har bir to‘lovdan 40%</span>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9FE] text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Monthly payment</th>
                      <th className="p-3 text-center">40%</th>
                      <th className="p-3 text-right">Teacher share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {selectedRecord.studentBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">
                          {row.studentName}
                          <span className="block text-[10px] text-gray-400">
                            {row.paymentStatus === 'paid' ? 'To‘langan' : 'Kutilmoqda (0 hisoblangan)'}
                          </span>
                        </td>
                        <td className="p-3 font-medium">
                          {row.monthlyPayment.toLocaleString()} UZS
                        </td>
                        <td className="p-3 text-center font-bold text-[#5C42FD]">
                          40%
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">
                          {row.shareAmount.toLocaleString()} UZS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Summary (Prompt spec 23: Total collected, Teacher percentage, Final teacher salary) */}
            <div className="bg-[#FAF9FE] p-4 rounded-xl border border-gray-100 text-xs space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Total collected (Jami yig‘ilgan mablag‘):</span>
                <strong className="text-gray-900">{selectedRecord.totalRevenue.toLocaleString()} UZS</strong>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Teacher percentage (Mentor ulushi stavkasi):</span>
                <strong className="text-[#5C42FD]">40%</strong>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Final teacher salary (To‘lanishi kerak bo‘lgan jami maosh):</span>
                <span className="text-[#5C42FD] font-black">{selectedRecord.calculatedSalary.toLocaleString()} UZS</span>
              </div>
            </div>

            {/* Salary History (January, February, March...) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Salary History (Oldingi Oylar Tarixi)
              </h4>
              <div className="space-y-2">
                {selectedRecord.history.map((hist, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900 block">{hist.month}</span>
                      <span className="text-[11px] text-gray-400">Yig‘ilgan: {hist.collected.toLocaleString()} UZS</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 block">{hist.salary.toLocaleString()} UZS</span>
                      <StatusBadge status={hist.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Pay Button in Drawer */}
            {selectedRecord.status !== 'paid' && (
              <button
                type="button"
                onClick={() => handlePaySalary(selectedRecord)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ushbu Oylikni To‘langan Deb Tasdiqlash
              </button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
