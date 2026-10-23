import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Copy,
  Check,
  Printer,
  Eye,
  Trash2,
  Coins,
  CreditCard,
  BookOpen,
  Layers,
  UserCheck,
  ShieldAlert,
  Download,
  KeyRound,
  Sparkles,
  Phone,
  Image as ImageIcon,
  Award,
  ArrowRight,
  X
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { Course, Group, Student } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { exportToCSV } from '../utils/exportUtils';
import { useLanguage } from '../context/LanguageContext';

export const StudentsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { success, error, info } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Drawers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ id: string; pass: string; name: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'attendance' | 'payments' | 'coins' | 'course'>('overview');

  // Confirmation Delete
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; student: Student | null }>({
    isOpen: false,
    student: null
  });

  // Copied State
  const [copiedField, setCopiedField] = useState<'id' | 'pass' | null>(null);

  // Phone input formatting
  const [phoneRaw, setPhoneRaw] = useState('');

  // Add Student Form State (student image removed per user request)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    courseId: '',
    groupId: '',
    monthlyPayment: 1200000
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [stu, crs, grp] = await Promise.all([
        DirectorService.getStudents(),
        DirectorService.getCourses(),
        DirectorService.getGroups()
      ]);
      setStudents(stu);
      setCourses(crs);
      setGroups(grp);
      if (crs.length > 0 && !formData.courseId) {
        setFormData(prev => ({
          ...prev,
          courseId: crs[0].id
        }));
      }
    } catch {
      error('Xatolik', 'O‘quvchilar ma’lumotini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPhoneNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 9);
    let formatted = '';
    if (cleaned.length > 0) formatted += cleaned.slice(0, 2);
    if (cleaned.length > 2) formatted += ' ' + cleaned.slice(2, 5);
    if (cleaned.length > 5) formatted += ' ' + cleaned.slice(5, 7);
    if (cleaned.length > 7) formatted += ' ' + cleaned.slice(7, 9);
    return formatted;
  };

  const handlePhoneInput = (val: string) => {
    const formatted = formatPhoneNumber(val);
    setPhoneRaw(formatted);
    setFormData(prev => ({
      ...prev,
      phone: formatted ? `+998 ${formatted}` : ''
    }));
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.includes(searchQuery) ||
      s.phone.includes(searchQuery);

    const matchesCourse = courseFilter === 'all' || s.courseId === courseFilter;
    const matchesGroup = groupFilter === 'all' || s.groupId === groupFilter;
    const matchesPayment = paymentFilter === 'all' || s.paymentStatus === paymentFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesCourse && matchesGroup && matchesPayment && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const tableEl = document.getElementById('students-table-container');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      error('Xatolik', 'Ism va familiya kiritilishi shart');
      return;
    }

    if (!formData.phone.trim()) {
      error('Telefon talab qilinadi', 'Iltimos, o‘quvchining to‘liq telefon raqamini kiriting');
      return;
    }

    const selectedCourse = courses.find(c => c.id === formData.courseId);
    const selectedGroup = groups.find(g => g.id === formData.groupId);

    try {
      const result = await DirectorService.createStudent({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        courseId: selectedCourse?.id || '',
        courseName: selectedCourse?.name || 'Kurs tanlanmagan',
        groupId: selectedGroup?.id || '',
        groupName: selectedGroup?.name || 'Guruhsiz (Bosh)',
        teacherName: selectedGroup?.teacherName || 'Ustoz biriktirilmagan',
        monthlyPayment: Number(formData.monthlyPayment) || 0
      });

      setAddModalOpen(false);
      setCreatedCredentials({
        id: result.generatedId,
        pass: result.generatedPassword,
        name: `${formData.firstName} ${formData.lastName}`
      });
      setCredentialsModalOpen(true);
      success('Muvaffaqiyatli', 'Yangi o‘quvchi ro‘yxatga olindi va login yaratildi');

      // Reset
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        courseId: courses[0]?.id || '',
        groupId: '',
        monthlyPayment: 1200000
      });
      setPhoneRaw('');
      loadData();
    } catch (err: any) {
      error('Xatolik', err.message || 'Talaba qo‘shishda xatolik yuz berdi');
    }
  };

  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      info('Eksport', 'Eksport qilish uchun talabalar topilmadi');
      return;
    }
    const headers = ['Talaba ID', 'F.I.SH', 'Telefon', 'Kurs', 'Guruh', 'Oylik To‘lov', 'To‘lov Holati', 'Davomat', 'Coinlar', 'Status'];
    const rows = filteredStudents.map(s => [
      s.studentId,
      s.fullName,
      s.phone,
      s.courseName,
      s.groupName,
      s.monthlyPayment,
      s.paymentStatus,
      `${s.attendanceRate}%`,
      s.coins,
      s.status
    ]);
    exportToCSV('avlod_talabalar_royxati.csv', headers, rows);
    success('Yuklab olindi', 'O‘quvchilar ro‘yxati muvaffaqiyatli CSV/Excel faylga yuklandi');
  };

  const downloadCredentialsCardImage = (name: string, studentId: string, pass: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 650;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 650, 400);
    grad.addColorStop(0, '#5C42FD');
    grad.addColorStop(1, '#1E0E62');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 650, 400, 24);
    ctx.fill();

    // Subtle background shapes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.arc(580, 80, 160, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
    ctx.fillText("Avlod Ta'lim — Talaba Kirish Kartasi", 40, 55);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '13px Plus Jakarta Sans, sans-serif';
    ctx.fillText("O'quvchi shaxsiy kabinetiga kirish ma'lumotlari", 40, 85);

    // Student Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
    ctx.fillText(name, 40, 145);

    // ID Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(40, 175, 260, 95, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('STUDENT ID (8 xonali raqam)', 55, 205);
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 26px JetBrains Mono, monospace';
    ctx.fillText(studentId, 55, 245);

    // Password Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(330, 175, 280, 95, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('PAROL (Password)', 345, 205);
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 26px JetBrains Mono, monospace';
    ctx.fillText(pass, 345, 245);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Plus Jakarta Sans, sans-serif';
    ctx.fillText("portal.avlod.uz | Maxfiy saqlansin", 40, 350);

    // Download image
    const link = document.createElement('a');
    link.download = `talaba_kartasi_${studentId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    info('Yuklab olindi', 'Talaba ID kartasi rasm (PNG) shaklida yuklab olindi');
  };

  const copyToClipboard = (text: string, field: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    info('Nusxalandi', `${field === 'id' ? 'Student ID' : 'Parol'} buferga nusxalandi`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      await DirectorService.deleteStudent(id);
      setDeleteConfirm({ isOpen: false, student: null });
      loadData();
      success('O‘chirildi', 'O‘quvchi tizimdan muvaffaqiyatli o‘chirildi');
    } catch {
      error('Xatolik', 'O‘chirishda xatolik yuz berdi');
    }
  };

  // Award Coins State
  const [awardCoinsModalOpen, setAwardCoinsModalOpen] = useState(false);
  const [coinTargetStudent, setCoinTargetStudent] = useState<Student | null>(null);
  const [coinSearchQuery, setCoinSearchQuery] = useState('');
  const [coinAmount, setCoinAmount] = useState<number | string>(50);
  const [coinOperation, setCoinOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [coinReason, setCoinReason] = useState('Darsdagi faollik uchun');
  const [coinCustomReason, setCoinCustomReason] = useState('');
  const [coinLoading, setCoinLoading] = useState(false);

  const handleOpenAwardCoins = (student?: Student) => {
    if (student) {
      setCoinTargetStudent(student);
      setCoinSearchQuery('');
    } else {
      setCoinTargetStudent(null);
      setCoinSearchQuery('');
    }
    setCoinAmount(50);
    setCoinOperation('add');
    setCoinReason('Darsdagi faollik uchun');
    setCoinCustomReason('');
    setAwardCoinsModalOpen(true);
  };

  const coinFilteredStudents = students.filter(s => {
    const q = coinSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return s.studentId.includes(q) || s.fullName.toLowerCase().includes(q) || s.phone.includes(q);
  });

  const handleSubmitAwardCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinTargetStudent) {
      error('Xatolik', 'Iltimos, avval o‘quvchini ID raqami yoki ismi orqali tanlang');
      return;
    }
    const amt = Number(coinAmount);
    if (isNaN(amt) || (amt <= 0 && coinOperation !== 'set')) {
      error('Xatolik', 'Iltimos, musbat coin miqdorini kiriting');
      return;
    }

    setCoinLoading(true);
    try {
      const finalReason = coinReason === 'Boshqa' ? (coinCustomReason.trim() || 'Direktor qarori') : coinReason;
      const res = await DirectorService.awardStudentCoins(
        coinTargetStudent.id,
        amt,
        coinOperation,
        finalReason
      );

      setStudents(prev => prev.map(s => (s.id === res.student.id ? res.student : s)));
      if (selectedStudent?.id === res.student.id) {
        setSelectedStudent(res.student);
      }

      success(
        'Coin muvaffaqiyatli berildi',
        `${res.student.fullName} (ID: ${res.student.studentId}) ning yangi balansi: ${res.newTotal} coin`
      );
      setAwardCoinsModalOpen(false);
    } catch (err: any) {
      error('Xatolik', err.message || 'Coin berishda xatolik yuz berdi');
    } finally {
      setCoinLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('students.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('students.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAwardCoins()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-amber-500/25 transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>{t('topbar.award_coins')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportStudents}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t('common.export')}</span>
          </button>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#5C42FD]/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('students.new_student')}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Search, Course, Group, Payment, Status) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('students.search_placeholder')}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden"
            />
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={e => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-hidden"
            >
              <option value="all">{t('students.all_courses')}</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={groupFilter}
              onChange={e => {
                setGroupFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-hidden"
            >
              <option value="all">{t('students.all_groups')}</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={e => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-hidden"
            >
              <option value="all">{t('students.all_payments')}</option>
              <option value="paid">{t('status.paid')}</option>
              <option value="pending">{t('status.pending')}</option>
              <option value="overdue">{t('status.overdue')}</option>
              <option value="blocked">{t('status.blocked')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={8} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title={t('common.empty')}
          description="Ushbu filtrlarga mos keluvchi o‘quvchilar mavjud emas."
          icon={GraduationCap}
          actionText={t('students.new_student')}
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div id="students-table-container" className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FE] text-gray-500 font-bold border-b border-[#F0F1F7] tracking-wider uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-4">{t('students.th_student')}</th>
                  <th className="px-5 py-4">{t('students.th_id')}</th>
                  <th className="px-5 py-4">{t('students.th_course')}</th>
                  <th className="px-5 py-4">{t('students.th_group')}</th>
                  <th className="px-5 py-4">{t('dashboard.th_amount')}</th>
                  <th className="px-5 py-4">{t('students.th_payment_status')}</th>
                  <th className="px-5 py-4 text-center">Davomat</th>
                  <th className="px-5 py-4 text-center">{t('dashboard.th_coins')}</th>
                  <th className="px-5 py-4">{t('dashboard.th_status')}</th>
                  <th className="px-5 py-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody key={currentPage} className="divide-y divide-gray-100 text-gray-700 animate-page-transition">
                {paginatedStudents.map((student, idx) => (
                  <tr
                    key={student.id}
                    style={{ animationDelay: `${idx * 25}ms` }}
                    className="hover:bg-[#FAF9FE] transition-colors group cursor-pointer animate-table-row"
                    onClick={() => {
                      setSelectedStudent(student);
                      setDetailsDrawerOpen(true);
                    }}
                  >
                    {/* Student Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5C42FD] font-bold text-xs flex items-center justify-center shrink-0">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-[#5C42FD] transition-colors">
                            {student.fullName}
                          </p>
                          <p className="text-[10px] text-gray-400">{student.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* 8-Digit Unique ID */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-[#5C42FD] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 tracking-wider">
                        {student.studentId}
                      </span>
                    </td>

                    {/* Course */}
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[150px]">
                      {student.courseName}
                    </td>

                    {/* Group */}
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {student.groupName}
                    </td>

                    {/* Monthly Payment */}
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {student.monthlyPayment.toLocaleString()} UZS
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={student.paymentStatus} size="sm" />
                    </td>

                    {/* Attendance % */}
                    <td className="px-5 py-3.5 text-center">
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {student.attendanceRate}%
                      </span>
                    </td>

                    {/* Coin Balance */}
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
                        <Coins className="w-3 h-3" />
                        <span>{student.coins}</span>
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={student.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td
                      className="px-5 py-3.5 text-right space-x-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenAwardCoins(student)}
                        className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Coin berish (ID bo‘yicha)"
                      >
                        <Coins className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(student);
                          setDetailsDrawerOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#5C42FD] hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Ko‘rish"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, student })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="O‘chirish"
                      >
                        <Trash2 className="w-4 h-4" />
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
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* CREATE STUDENT MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Yangi Talaba Qo‘shish"
        subtitle="Talabani ro‘yxatga oling. Tizim avtomatik tarzda 8 xonali ID va xavfsiz parol yaratadi."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Ism <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Azizbek"
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Familiya <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Sobirov"
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Formatted Phone Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Telefon raqami <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-2xs focus-within:border-[#5C42FD] focus-within:ring-2 focus-within:ring-[#5C42FD]/15 transition-all overflow-hidden">
              <span className="inline-flex items-center px-3.5 py-2.5 text-xs font-bold text-gray-600 bg-gray-50 border-r border-gray-200 select-none">
                +998
              </span>
              <input
                type="tel"
                required
                value={phoneRaw}
                onChange={e => handlePhoneInput(e.target.value)}
                placeholder="90 123 45 67"
                className="w-full bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Kursni tanlang (ixtiyoriy)
              </label>
              <select
                value={formData.courseId}
                onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer"
              >
                <option value="">Tanlanmagan</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Guruhni tanlang
              </label>
              <select
                value={formData.groupId}
                onChange={e => setFormData({ ...formData, groupId: e.target.value })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer"
              >
                <option value="">Bosh (Guruhsiz)</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.teacherName})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Oylik to‘lov summasi (UZS)
            </label>
            <input
              type="number"
              min="0"
              step="50000"
              value={formData.monthlyPayment === 0 ? '' : formData.monthlyPayment}
              onChange={e => {
                const raw = e.target.value.replace(/^0+(?=\d)/, '');
                setFormData({ ...formData, monthlyPayment: raw === '' ? 0 : Number(raw) });
              }}
              placeholder="Masalan: 1200000"
              className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden font-bold transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5C42FD] hover:bg-[#4d33eb] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Saqlash va Login yaratish
            </button>
          </div>
        </form>
      </Modal>

      {/* CREDENTIALS SUCCESS MODAL (Prompt spec 13) */}
      <Modal
        isOpen={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        title="Student successfully created"
        subtitle="Yangi talaba uchun avtomatik tizim hisobi muvaffaqiyatli shakllantirildi"
        maxWidth="md"
      >
        {createdCredentials && (
          <div className="space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900">{createdCredentials.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5">Avlod Ta’lim talabalar tizimiga kirish ma’lumotlari</p>
            </div>

            <div className="space-y-3 bg-[#FAF9FE] p-4 rounded-2xl border border-[#E9EAF3] text-left">
              {/* 8-Digit Student ID */}
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Student ID (8 xonali raqam)
                </span>
                <div className="flex items-center justify-between mt-1 bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="font-mono text-base font-extrabold text-[#5C42FD] tracking-wider">
                    {createdCredentials.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials.id, 'id')}
                    className="p-1.5 text-gray-400 hover:text-[#5C42FD] rounded-lg transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    {copiedField === 'id' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 6-Alphanumeric Password */}
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Password (6 belgili xavfsiz parol)
                </span>
                <div className="flex items-center justify-between mt-1 bg-white p-2.5 rounded-xl border border-gray-200">
                  <span className="font-mono text-base font-extrabold text-gray-900 tracking-wider">
                    {createdCredentials.pass}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials.pass, 'pass')}
                    className="p-1.5 text-gray-400 hover:text-[#5C42FD] rounded-lg transition-colors cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedField === 'pass' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Buttons: Copy ID, Copy Password, Print Credentials, Close */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(createdCredentials.id, 'id')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(createdCredentials.pass, 'pass')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Password</span>
              </button>

              <button
                type="button"
                onClick={() => downloadCredentialsCardImage(createdCredentials.name, createdCredentials.id, createdCredentials.pass)}
                className="col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Rasim qilib yuklab olish (Download PNG Card)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                  info('Chop etish', 'Talaba ID kartasi printerga yuborilmoqda');
                }}
                className="col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Credentials (ID Kartani chop etish)</span>
              </button>

              <button
                type="button"
                onClick={() => setCredentialsModalOpen(false)}
                className="col-span-2 text-xs font-semibold text-gray-500 hover:text-gray-800 py-1 cursor-pointer"
              >
                Close (Yopish)
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* STUDENT DETAILS DRAWER (Tabs: Overview, Attendance, Payments, Coins, Course) */}
      <Drawer
        isOpen={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        title={selectedStudent?.fullName || 'Talaba Profili'}
        subtitle={`ID: ${selectedStudent?.studentId} • Guruh: ${selectedStudent?.groupName}`}
        width="xl"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="bg-[#FAF9FE] p-4 rounded-2xl border border-[#E9EAF3] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#5C42FD] text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {selectedStudent.firstName[0]}
                  {selectedStudent.lastName[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{selectedStudent.fullName}</h4>
                  <p className="text-xs text-gray-500">ID: {selectedStudent.studentId}</p>
                </div>
              </div>
              <StatusBadge status={selectedStudent.status} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 gap-4 text-xs font-bold">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'payments', label: 'Payments' },
                { id: 'coins', label: 'Coins' },
                { id: 'course', label: 'Course' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDetailsTab(t.id as any)}
                  className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                    detailsTab === t.id
                      ? 'border-[#5C42FD] text-[#5C42FD]'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {detailsTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[11px] block">Telefon raqami</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{selectedStudent.phone}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[11px] block">Ustoz (Mentor)</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{selectedStudent.teacherName}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[11px] block">Oylik To‘lov</span>
                    <span className="font-bold text-[#5C42FD] mt-0.5 block">{selectedStudent.monthlyPayment.toLocaleString()} UZS</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[11px] block">To‘lov Holati</span>
                    <div className="mt-1"><StatusBadge status={selectedStudent.paymentStatus} size="sm" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance */}
            {detailsTab === 'attendance' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-800 font-bold block">Davomat foizi</span>
                    <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{selectedStudent.attendanceRate}%</span>
                  </div>
                  <UserCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-gray-500 text-[11px]">Dars qoldirishlar soni me’yordan oshmagan.</p>
              </div>
            )}

            {/* Payments */}
            {detailsTab === 'payments' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-white rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900">Joriy oy to‘lovi</span>
                    <p className="text-gray-400 text-[11px]">{selectedStudent.monthlyPayment.toLocaleString()} so‘m</p>
                  </div>
                  <StatusBadge status={selectedStudent.paymentStatus} size="sm" />
                </div>
              </div>
            )}

            {/* Coins */}
            {detailsTab === 'coins' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="text-amber-800 font-bold block">Avlod Coin Balansi</span>
                    <span className="text-2xl font-black text-amber-600 mt-0.5 block">{selectedStudent.coins} coin</span>
                  </div>
                  <Coins className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-gray-500 text-[11px]">Do‘kondan hoodie, noutbuk sumkasi yoki dasturchi gadjetlariga almashtirish mumkin.</p>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAwardCoins(selectedStudent);
                  }}
                  className="w-full mt-2 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Ushbu o‘quvchiga Coin berish / hisobini to‘ldirish</span>
                </button>
              </div>
            )}

            {/* Course */}
            {detailsTab === 'course' && (
              <div className="p-4 bg-white rounded-xl border border-gray-100 text-xs space-y-2">
                <h5 className="font-bold text-gray-900">{selectedStudent.courseName}</h5>
                <p className="text-gray-500">Guruh: <span className="font-semibold text-gray-900">{selectedStudent.groupName}</span></p>
                <p className="text-gray-500">O‘qituvchi: <span className="font-semibold text-gray-900">{selectedStudent.teacherName}</span></p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* CONFIRMATION DELETE */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, student: null })}
        onConfirm={() => {
          if (deleteConfirm.student) handleDelete(deleteConfirm.student.id);
        }}
        title="O‘quvchini o‘chirish"
        message={`${deleteConfirm.student?.fullName} tizimdan to‘liq o‘chiriladi. Ushbu amalni qaytarib bo‘lmaydi!`}
        confirmText="O‘chirish"
        variant="danger"
      />

      {/* AWARD COINS MODAL */}
      <Modal
        isOpen={awardCoinsModalOpen}
        onClose={() => setAwardCoinsModalOpen(false)}
        title="O‘quvchiga Coin Berish (Award Coins)"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitAwardCoins} className="space-y-5">
          {/* Top Instruction banner */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-bold text-amber-950">Director Coin Boshqaruvi</p>
              <p className="text-amber-800 text-[11px]">
                O‘quvchini 8-raqamli unikal ID kodi yoki ismi orqali topib, faolligi yoki yutug‘i uchun coin qo‘shing.
              </p>
            </div>
          </div>

          {/* Student Selection Section */}
          {!coinTargetStudent ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  O‘quvchi ID raqami yoki ismini qidiring <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={coinSearchQuery}
                    onChange={e => setCoinSearchQuery(e.target.value)}
                    placeholder="Masalan: 3817... yoki Islomjon..."
                    autoFocus
                    className="w-full bg-white border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-900 font-medium shadow-2xs focus:outline-hidden transition-all"
                  />
                  {coinSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCoinSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  8-raqamli talaba ID raqami kiritilganda bir zumda aniq talaba chiqadi.
                </p>
              </div>

              {/* Student Results List */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-100 bg-[#FAFAFE]">
                {coinFilteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    Bunday ID yoki ismli o‘quvchi topilmadi
                  </div>
                ) : (
                  coinFilteredStudents.map(stu => (
                    <div
                      key={stu.id}
                      onClick={() => setCoinTargetStudent(stu)}
                      className="p-3 bg-white hover:bg-amber-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5C42FD] font-bold text-xs flex items-center justify-center shrink-0">
                          {stu.firstName[0]}{stu.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900 group-hover:text-amber-800 transition-colors truncate">
                              {stu.fullName}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-[#5C42FD] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 shrink-0">
                              ID: {stu.studentId}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            {stu.groupName} • {stu.courseName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-[11px]">
                          <Coins className="w-3 h-3 text-amber-500" />
                          <span>{stu.coins} coin</span>
                        </span>
                        <span className="text-xs font-bold text-[#5C42FD] group-hover:translate-x-0.5 transition-transform flex items-center">
                          Tanlash <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Student Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 to-purple-50/60 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
                    {coinTargetStudent.firstName[0]}{coinTargetStudent.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 truncate">
                        {coinTargetStudent.fullName}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#5C42FD] bg-white px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                        ID: {coinTargetStudent.studentId}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {coinTargetStudent.groupName} • Joriy balans: <strong className="text-amber-700">{coinTargetStudent.coins} coin</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCoinTargetStudent(null)}
                  className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-200 transition-colors cursor-pointer shrink-0"
                >
                  O‘zgartirish
                </button>
              </div>

              {/* Operation type tabs */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Amaliyot turi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'add', label: 'Qo‘shish (+)', desc: 'Balansga qo‘shish' },
                    { id: 'subtract', label: 'Ayirish (-)', desc: 'Jarima yoki xatolik' },
                    { id: 'set', label: 'Belgilash (=)', desc: 'Aniq miqdor o‘rnatish' }
                  ].map(op => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setCoinOperation(op.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        coinOperation === op.id
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-2xs font-bold'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs font-bold block">{op.label}</span>
                      <span className="text-[10px] text-gray-400 block">{op.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input & Quick preset pills */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Coin Miqdori <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={coinAmount === '' || coinAmount === 0 ? '' : String(coinAmount)}
                    onChange={e => {
                      const clean = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
                      setCoinAmount(clean === '' ? '' : Number(clean));
                    }}
                    placeholder="Masalan: 50"
                    className="w-full bg-white border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 rounded-xl pl-10 pr-3.5 py-2.5 text-base text-gray-900 font-extrabold shadow-2xs focus:outline-hidden transition-all"
                  />
                </div>

                {/* Quick preset buttons */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-gray-400 font-medium mr-1">Tezkor:</span>
                  {[10, 25, 50, 100, 200, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCoinAmount(val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        Number(coinAmount) === val
                          ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Coin berish sababi (Rag‘batlantirish asosi)
                </label>
                <select
                  value={coinReason}
                  onChange={e => setCoinReason(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-medium focus:outline-hidden shadow-2xs"
                >
                  <option value="Darsdagi faollik uchun">Darsdagi faollik uchun</option>
                  <option value="Uy vazifasini a'lo bahoga bajargani uchun">Uy vazifasini a'lo bahoga bajargani uchun</option>
                  <option value="Olimpiada / IT tanlov g‘olibi">Olimpiada / IT tanlov g‘olibi</option>
                  <option value="Imtihonda yuqori ball to‘plagani uchun">Imtihonda yuqori ball to‘plagani uchun</option>
                  <option value="Namuna ko‘rsatgan xulq-atvor uchun">Namuna ko‘rsatgan xulq-atvor uchun</option>
                  <option value="Direktor maxsus mukofoti">Direktor maxsus mukofoti</option>
                  <option value="Boshqa">Boshqa sabab (izoh kiritish)...</option>
                </select>

                {coinReason === 'Boshqa' && (
                  <input
                    type="text"
                    value={coinCustomReason}
                    onChange={e => setCoinCustomReason(e.target.value)}
                    placeholder="Sabab yoki izohni yozing..."
                    className="w-full mt-2 bg-white border border-gray-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-hidden shadow-2xs"
                  />
                )}
              </div>

              {/* Result Preview calculation */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                <div className="text-gray-600">
                  <span>Hozir: <strong className="text-gray-900">{coinTargetStudent.coins} coin</strong></span>
                  <span className="mx-2">➔</span>
                  <span>
                    Yangi balans:{' '}
                    <strong className="text-amber-800 text-sm">
                      {coinOperation === 'add'
                        ? coinTargetStudent.coins + (Number(coinAmount) || 0)
                        : coinOperation === 'subtract'
                        ? Math.max(0, coinTargetStudent.coins - (Number(coinAmount) || 0))
                        : Math.max(0, Number(coinAmount) || 0)}{' '}
                      coin
                    </strong>
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {coinOperation === 'add'
                    ? `+${Number(coinAmount) || 0}`
                    : coinOperation === 'subtract'
                    ? `-${Number(coinAmount) || 0}`
                    : `=${Number(coinAmount) || 0}`}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAwardCoinsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={coinLoading || !coinAmount}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm shadow-amber-500/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>{coinLoading ? 'Saqlanmoqda...' : 'Coinni hisobga o‘tkazish'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
