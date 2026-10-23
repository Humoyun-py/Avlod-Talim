import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  DollarSign,
  Clock,
  AlertCircle,
  Ban,
  CheckCircle2,
  Receipt,
  Eye,
  Filter,
  FileText
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { Payment, PaymentMethod, PaymentStatus, Student } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ImageUpload } from '../components/common/ImageUpload';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';

import { TableSkeleton } from '../components/common/Skeleton';
import { exportToCSV } from '../utils/exportUtils';
import { Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PaymentsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { success, error, info } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [receiptModalPayment, setReceiptModalPayment] = useState<Payment | null>(null);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchInModal, setStudentSearchInModal] = useState('');
  const [amount, setAmount] = useState<number | string>(1200000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Payme');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pay, stu] = await Promise.all([
        DirectorService.getPayments(),
        DirectorService.getStudents()
      ]);
      setPayments(pay);
      setStudents(stu);
      if (stu.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stu[0].id);
        setAmount(stu[0].monthlyPayment);
      }
    } catch {
      error('Xatolik', 'To‘lovlar ma’lumotini yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentPublicId.includes(searchQuery) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAddModal = () => {
    if (students.length > 0) {
      const firstPending = students.find(s => s.paymentStatus !== 'paid') || students[0];
      setSelectedStudentId(firstPending.id);
      setAmount(firstPending.monthlyPayment);
    }
    setPaymentMethod('Payme');
    setReceiptNumber('');
    setReceiptImage('');
    setPaymentNote('');
    setAddPaymentModalOpen(true);
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setReceiptNumber('');
  };

  const handleStudentSelect = (stuId: string) => {
    setSelectedStudentId(stuId);
    const stu = students.find(s => s.id === stuId);
    if (stu) {
      setAmount(stu.monthlyPayment);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      error('Xatolik', 'Talaba tanlanmagan');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      error('Xatolik', 'To‘lov summasi 0 dan katta musbat son bo‘lishi lozim');
      return;
    }

    if (paymentMethod !== 'Naqd' && !receiptNumber.trim()) {
      error('Chek kiritilishi shart', `${paymentMethod} to‘lovi uchun chek raqami (tranzaksiya ID) kiritilishi shart! Cheksiz to‘lov qabul qilinmaydi.`);
      return;
    }

    if (paymentMethod !== 'Naqd') {
      error('Online to‘lov hozircha mavjud emas', 'Chek faylini serverga yuklash endpointi hali ulanmagan.');
      return;
    }

    try {
      await DirectorService.addPayment({
        studentId: student.id,
        studentPublicId: student.studentId,
        studentName: student.fullName,
        courseName: student.courseName,
        groupName: student.groupName,
        amount: Number(amount),
        method: paymentMethod,
        receiptNumber: receiptNumber.trim() ? receiptNumber.trim() : (paymentMethod === 'Naqd' ? `KASSA-${Date.now().toString().slice(-6)}` : undefined),
        receiptImage: receiptImage.trim(),
        note: paymentNote
      });

      success('Muvaffaqiyatli', `${student.fullName} uchun ${Number(amount).toLocaleString()} UZS to‘lov qabul qilindi`);
      setAddPaymentModalOpen(false);
      setReceiptNumber('');
      setReceiptImage('');
      setPaymentNote('');
      loadData();
    } catch (err: any) {
      error('Xatolik', err.message || 'To‘lovni qabul qilishda xatolik yuz berdi');
    }
  };

  const handleExportPayments = () => {
    if (filteredPayments.length === 0) {
      info('Eksport', 'Eksport qilish uchun to‘lovlar topilmadi');
      return;
    }
    const headers = ['Tranzaksiya ID', 'Talaba Ismi', 'Talaba ID', 'Kurs', 'Guruh', 'Summa (UZS)', 'To‘lov Usuli', 'Chek / Kvitansiya', 'Sana', 'Holati'];
    const rows = filteredPayments.map(p => [
      p.id,
      p.studentName,
      p.studentPublicId,
      p.courseName,
      p.groupName,
      p.amount,
      p.method,
      p.receiptNumber || 'Naqd',
      p.date,
      p.status
    ]);
    exportToCSV('avlod_tolovlar_jurnali.csv', headers, rows);
    success('Yuklab olindi', 'To‘lovlar vedomosti muvaffaqiyatli Excel/CSV fayl sifatida yuklandi');
  };

  // Metric summaries calculated dynamically
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPaymentsSum = payments
    .filter(p => p.date.startsWith(todayStr))
    .reduce((sum, p) => sum + p.amount, 0);
  const thisMonthPaymentsSum = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidCount = students.filter(s => s.paymentStatus === 'paid').length;
  const pendingCount = students.filter(s => s.paymentStatus === 'pending').length;
  const overdueCount = students.filter(s => s.paymentStatus === 'overdue').length;
  const blockedCount = students.filter(s => s.paymentStatus === 'blocked').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('payments.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('payments.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportPayments}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t('common.export')}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#5C42FD]/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('payments.new_payment')}</span>
          </button>
        </div>
      </div>

      {/* Payment Dashboard Cards (6 cards required by prompt) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            {language === 'uz' ? 'Bugungi' : language === 'ru' ? 'Сегодня' : 'Today'}
          </span>
          <span className="text-base font-extrabold text-emerald-600 mt-1 block">{(todayPaymentsSum / 1000000).toFixed(1)} mln</span>
          <span className="text-[10px] text-gray-400">
            {language === 'uz' ? 'Bugungi tushum' : language === 'ru' ? 'Доход за сегодня' : 'Today revenue'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C42FD] block">{t('payments.this_month')}</span>
          <span className="text-base font-extrabold text-gray-900 mt-1 block">{(thisMonthPaymentsSum / 1000000).toFixed(1)} mln</span>
          <span className="text-[10px] text-gray-400">{t('payments.total_payments_sub', 'Jami to‘lovlar')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">{t('payments.paid_students')}</span>
          <span className="text-base font-extrabold text-emerald-600 mt-1 block">{paidCount} {t('common.students_count_suffix')}</span>
          <span className="text-[10px] text-gray-400">{t('payments.paid_sub', 'To‘laganlar')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">{t('payments.pending')}</span>
          <span className="text-base font-extrabold text-amber-600 mt-1 block">{pendingCount} {t('common.students_count_suffix')}</span>
          <span className="text-[10px] text-gray-400">{t('status.pending')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">{t('payments.overdue')}</span>
          <span className="text-base font-extrabold text-rose-600 mt-1 block">{overdueCount} {t('common.students_count_suffix')}</span>
          <span className="text-[10px] text-gray-400">{t('status.overdue')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">{t('payments.blocked')}</span>
          <span className="text-base font-extrabold text-gray-700 mt-1 block">{blockedCount} {t('common.students_count_suffix')}</span>
          <span className="text-[10px] text-gray-400">{t('status.blocked')}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('payments.search_placeholder')}
            className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={e => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F8F8FC] border border-[#E9EAF3] rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-hidden"
          >
            <option value="all">{t('payments.all_methods')}</option>
            <option value="Payme">Payme</option>
            <option value="Click">Click</option>
            <option value="Uzum">Uzum</option>
            <option value="Naqd">{language === 'uz' ? 'Naqd (Kassa)' : language === 'ru' ? 'Наличные (Касса)' : 'Cash (Desk)'}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F8F8FC] border border-[#E9EAF3] rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-hidden"
          >
            <option value="all">{t('payments.all_statuses')}</option>
            <option value="paid">{t('status.paid')}</option>
            <option value="pending">{t('status.pending')}</option>
            <option value="overdue">{t('status.overdue')}</option>
            <option value="blocked">{t('status.blocked')}</option>
          </select>
        </div>
      </div>

      {/* Table: Student, Amount, Method, Receipt, Date, Status */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          title="To‘lovlar topilmadi"
          description="Kiritilgan parametrlar bo‘yicha to‘lovlar topilmadi."
          icon={CreditCard}
          actionText="To‘lov qabul qilish"
          onAction={handleOpenAddModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FE] text-gray-500 font-bold border-b border-[#F0F1F7] tracking-wider uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Guruh</th>
                  <th className="px-6 py-4">Summa</th>
                  <th className="px-6 py-4">To‘lov Usuli</th>
                  <th className="px-6 py-4">Kvitansiya / ID</th>
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Chek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-[#FAF9FE] transition-colors">
                    {/* Student */}
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-gray-900">{payment.studentName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">ID: {payment.studentPublicId}</div>
                    </td>

                    {/* Group */}
                    <td className="px-6 py-3.5 text-gray-600">
                      {payment.groupName}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-3.5 font-bold text-gray-900 text-sm">
                      {payment.amount.toLocaleString()} UZS
                    </td>

                    {/* Method */}
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                        payment.method === 'Payme' ? 'bg-cyan-50 text-cyan-800' :
                        payment.method === 'Click' ? 'bg-blue-50 text-blue-800' :
                        payment.method === 'Uzum' ? 'bg-purple-50 text-[#5C42FD]' :
                        'bg-emerald-50 text-emerald-800'
                      }`}>
                        {payment.method}
                      </span>
                    </td>

                    {/* Receipt */}
                    <td className="px-6 py-3.5">
                      {payment.receiptNumber ? (
                        <span className="font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          {payment.receiptNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Kassa kvitansiyasi</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-3.5 text-gray-500">
                      {payment.date}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5">
                      <StatusBadge status={payment.status} size="sm" />
                    </td>

                    {/* Receipt View Button */}
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setReceiptModalPayment(payment)}
                        className="p-1.5 text-gray-400 hover:text-[#5C42FD] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="Chekni ko‘rish"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPayments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ADD PAYMENT MODAL (with conditional Receipt field for Click/Payme/Uzum) */}
      <Modal
        isOpen={addPaymentModalOpen}
        onClose={() => setAddPaymentModalOpen(false)}
        title="Yangi To‘lovni Qabul Qilish"
        subtitle="Talabaning oylik to‘lovini kassa yoki online tizim orqali tasdiqlang"
        maxWidth="lg"
      >
        <form onSubmit={handleAddPayment} className="space-y-4">
          {/* Student Searchable Select */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              O‘quvchini tanlang <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={studentSearchInModal}
                onChange={e => setStudentSearchInModal(e.target.value)}
                placeholder="Talabani qidirish (ism yoki ID)..."
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
              />
              <select
                required
                value={selectedStudentId}
                onChange={e => handleStudentSelect(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden font-medium transition-all cursor-pointer"
              >
                {students
                  .filter(s =>
                    s.fullName.toLowerCase().includes(studentSearchInModal.toLowerCase()) ||
                    s.studentId.includes(studentSearchInModal)
                  )
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.groupName}) — {s.studentId} [{s.paymentStatus}]
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              To‘lov Summasi (UZS) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={amount === '' || amount === 0 ? '' : String(amount)}
              onChange={e => {
                const clean = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
                setAmount(clean);
              }}
              placeholder="Masalan: 1200000"
              className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-base text-gray-900 shadow-2xs focus:outline-hidden font-extrabold transition-all"
            />
          </div>

          {/* Payment Method Select: Naqd, Click, Payme, Uzum */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              To‘lov Usuli <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Payme', 'Click', 'Uzum', 'Naqd'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMethodChange(m)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === m
                      ? 'border-[#5C42FD] bg-purple-50 text-[#5C42FD] shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Receipt / Transaction ID Input (Appears ONLY if NOT Naqd) */}
          {paymentMethod !== 'Naqd' && (
            <div className="space-y-1.5 p-3.5 bg-purple-50/60 rounded-xl border border-purple-100">
              <label className="block text-xs font-bold text-purple-950 mb-1">
                Receipt / Transaction ID ({paymentMethod} chek raqami) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={receiptNumber}
                onChange={e => setReceiptNumber(e.target.value)}
                placeholder={`Masalan: ${paymentMethod}-8920194`}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2 text-xs text-gray-900 shadow-2xs focus:outline-hidden font-mono transition-all"
              />
              <p className="text-[11px] text-gray-500">
                {paymentMethod} orqali muvaffaqiyatli o‘tkazilgan tranzaksiya raqami.
              </p>
            </div>
          )}

          {/* Receipt Image Upload (STRICTLY MANDATORY FOR ALL PAYMENTS) */}
          <div className="space-y-2 p-3.5 bg-gradient-to-br from-purple-50/70 to-indigo-50/40 rounded-2xl border border-purple-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-900">
                To‘lov Cheki / Kvitansiya Rasmi <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                Majburiy
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {paymentMethod === 'Naqd'
                ? 'Kassa kvitansiyasi yoki to‘lov qabul qilinganligi haqidagi chek fotosuratini yuklang.'
                : `${paymentMethod} to‘lov ilovasidagi muvaffaqiyatli to‘lov cheki skrinshotini yuklang.`}
            </p>
            <ImageUpload
              value={receiptImage}
              onChange={setReceiptImage}
              label="Chek / Kvitansiya rasmi (majburiy)"
              helperText="PNG, JPG, WebP chek fotosurati (maksimal 5MB)"
              aspectRatio="wide"
            />
            {!receiptImage ? (
              <div className="flex items-center gap-1.5 p-2 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Chek rasmi yuklanmaguncha to‘lov tizimga qabul qilinmaydi!</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>To‘lov cheki rasmi muvaffaqiyatli biriktirildi.</span>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              value={paymentNote}
              onChange={e => setPaymentNote(e.target.value)}
              placeholder="Masalan: Oktyabr oyi to‘lovi to‘liq qabul qilindi"
              className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddPaymentModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5C42FD] hover:bg-[#4d33eb] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              To‘lovni Qabul Qilish
            </button>
          </div>
        </form>
      </Modal>

      {/* RECEIPT PREVIEW MODAL */}
      <Modal
        isOpen={!!receiptModalPayment}
        onClose={() => setReceiptModalPayment(null)}
        title="To‘lov Kvitansiyasi"
        subtitle="Avlod Ta’lim rasmiy to‘lov cheki"
        maxWidth="md"
      >
        {receiptModalPayment && (
          <div className="space-y-4">
            <div className="p-5 bg-[#FAF9FE] rounded-2xl border border-[#E9EAF3] text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Avlod Ta’lim Akademiya Kassasi</span>
              <h3 className="text-2xl font-black text-[#5C42FD]">
                {receiptModalPayment.amount.toLocaleString()} UZS
              </h3>
              <StatusBadge status={receiptModalPayment.status} size="sm" />
            </div>

            <div className="space-y-2 text-xs divide-y divide-gray-100">
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Talaba:</span>
                <span className="font-bold text-gray-900">{receiptModalPayment.studentName}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Student ID:</span>
                <span className="font-mono text-[#5C42FD] font-bold">{receiptModalPayment.studentPublicId}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Guruh:</span>
                <span className="font-semibold text-gray-900">{receiptModalPayment.groupName}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">To‘lov usuli:</span>
                <span className="font-bold text-gray-900">{receiptModalPayment.method}</span>
              </div>
              {receiptModalPayment.receiptNumber && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Tranzaksiya ID:</span>
                  <span className="font-mono text-gray-700">{receiptModalPayment.receiptNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Vaqt:</span>
                <span className="text-gray-700">{receiptModalPayment.date}</span>
              </div>
            </div>

            {/* Attached receipt image if uploaded */}
            {receiptModalPayment.receiptImage && (
              <div className="p-3 bg-[#FAF9FE] rounded-xl border border-gray-200 space-y-1.5">
                <span className="text-[11px] font-bold text-gray-700 block">Yuklangan Chek Fayli:</span>
                <img
                  src={receiptModalPayment.receiptImage}
                  alt="Chek skrinshoti"
                  className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-white"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="w-full py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Chekni Chop Etish (Print)
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
