import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Ban,
  CheckCircle2,
  Trash2,
  Phone,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  Wallet,
  Clock,
  ShieldCheck,
  Check,
  X,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { Teacher } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { ImageUpload } from '../components/common/ImageUpload';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const getSaveErrorMessage = (caught: unknown): string => {
  const collectMessages = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(collectMessages);
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).flatMap(collectMessages);
    }
    return [];
  };

  if (typeof caught === 'object' && caught !== null) {
    const requestError = caught as { data?: unknown; message?: string };
    const messages = collectMessages(requestError.data);
    if (messages.length) return messages.join(' ');
    if (requestError.message && requestError.message !== 'Request failed') {
      return requestError.message;
    }
  }
  return 'Ustoz ma’lumotlarini saqlab bo‘lmadi. Qayta urinib ko‘ring.';
};

export const TeachersPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { success, error, info } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active Dropdowns / Modals
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'groups' | 'students' | 'salary' | 'statistics'>('overview');

  // Close dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeMenuId) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenuId]);

  // Confirmation Delete/Block Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'block' | 'activate';
    teacher: Teacher | null;
  }>({
    isOpen: false,
    type: 'delete',
    teacher: null
  });

  // Create/Edit Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    subject: 'Frontend Web Development',
    avatarUrl: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneRaw, setPhoneRaw] = useState('');

  // Auto-format Uzbekistan phone number: XX XXX XX XX
  const formatUzbekPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
    return { digits, formatted };
  };

  const handlePhoneInput = (val: string) => {
    const { digits, formatted } = formatUzbekPhone(val);
    setPhoneRaw(formatted);
    setFormData(prev => ({ ...prev, phone: digits ? `+998 ${formatted}` : '' }));
    if (formErrors.phone) {
      setFormErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const isUsernameTaken = Boolean(
    formData.username.trim().length > 0 &&
    teachers.some(t => (!editingTeacher || t.id !== editingTeacher.id) && t.username.toLowerCase() === formData.username.trim().toLowerCase())
  );
  const isUsernameAvailable = Boolean(
    formData.username.trim().length >= 3 && !isUsernameTaken
  );

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const data = await DirectorService.getTeachers();
      setTeachers(data);
    } catch {
      error('Xatolik', 'Ustozlar ro‘yxatini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // Filtered teachers
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const tableEl = document.getElementById('teachers-table-container');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      subject: 'Frontend Web Development',
      avatarUrl: ''
    });
    setPhoneRaw('');
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    const cleanPhone = teacher.phone.replace('+998', '').trim();
    const { formatted } = formatUzbekPhone(cleanPhone);
    setPhoneRaw(formatted);

    setFormData({
      firstName: teacher.firstName || teacher.fullName.split(' ')[0] || '',
      lastName: teacher.lastName || teacher.fullName.split(' ').slice(1).join(' ') || '',
      phone: teacher.phone,
      username: teacher.username,
      password: '',
      confirmPassword: '',
      subject: teacher.subject,
      avatarUrl: teacher.avatarUrl || ''
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCreateModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'Ism kiritilishi shart';
    if (!formData.lastName.trim()) errors.lastName = 'Familiya kiritilishi shart';
    
    const phoneDigitsOnly = formData.phone.replace(/\D/g, '');
    if (!phoneDigitsOnly || phoneDigitsOnly.length < 12) {
      errors.phone = 'Telefon raqamini to‘liq kiriting (masalan: 90 123 45 67)';
    }

    if (!formData.username.trim()) {
      errors.username = 'Foydalanuvchi nomi (username) kiritilishi shart';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username kamida 3 belgidan iborat bo‘lishi lozim';
    } else if (isUsernameTaken) {
      errors.username = 'Bu username band! Iltimos, boshqa username tanlang.';
    }

    if (!editingTeacher) {
      if (!formData.password) {
        errors.password = 'Parol kiritilishi shart';
      } else if (formData.password.length < 8) {
        errors.password = 'Parol kamida 8 belgidan iborat bo‘lishi kerak';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Parollar bir-biriga mos kelmadi';
      }
    } else if (formData.password) {
      if (formData.password.length < 8) {
        errors.password = 'Parol kamida 8 belgidan iborat bo‘lishi kerak';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Parollar bir-biriga mos kelmadi';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingTeacher || !validateForm()) return;

    setSavingTeacher(true);
    try {
      if (editingTeacher) {
        await DirectorService.updateTeacher(editingTeacher.id, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          phone: formData.phone.trim(),
          username: formData.username.trim(),
          subject: formData.subject,
          avatarUrl: formData.avatarUrl || undefined,
        });
        success('Yangilandi', 'Ustoz ma’lumotlari muvaffaqiyatli yangilandi');
      } else {
        await DirectorService.createTeacher({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          phone: formData.phone.trim(),
          username: formData.username.trim(),
          subject: formData.subject,
          avatarUrl: formData.avatarUrl || undefined,
          status: 'active',
          salaryPercentage: 40,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        success('Muvaffaqiyatli', 'Yangi ustoz ro‘yxatga qo‘shildi');
      }

      setCreateModalOpen(false);
      setEditingTeacher(null);
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: '',
        subject: 'Frontend Web Development',
        avatarUrl: ''
      });
      setPhoneRaw('');
      setFormErrors({});
      loadTeachers();
    } catch (caught) {
      error('Xatolik', getSaveErrorMessage(caught));
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleStatusChange = async (teacher: Teacher, newStatus: 'active' | 'blocked') => {
    try {
      await DirectorService.updateTeacher(teacher.id, { status: newStatus });
      setConfirmDialog({ isOpen: false, type: 'delete', teacher: null });
      loadTeachers();
      success(
        newStatus === 'active' ? 'Faollashtirildi' : 'Bloklandi',
        `${teacher.fullName} holati o‘zgartirildi`
      );
    } catch {
      error('Xatolik', 'Statusni yangilab bo‘lmadi');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await DirectorService.deleteTeacher(id);
      setConfirmDialog({ isOpen: false, type: 'delete', teacher: null });
      loadTeachers();
      success('O‘chirildi', 'Ustoz tizimdan o‘chirib tashlandi');
    } catch {
      error('Xatolik', 'O‘chirishda xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('teachers.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('teachers.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#5C42FD]/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('teachers.new_teacher')}</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
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
            placeholder={t('teachers.search_placeholder')}
            className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex bg-[#F8F8FC] p-1 rounded-xl border border-gray-200 text-xs font-semibold w-full md:w-auto">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-[#5C42FD] shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t('common.all')} ({teachers.length})
            </button>
            <button
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Faol ({teachers.filter(t => t.status === 'active').length})
            </button>
            <button
              onClick={() => { setStatusFilter('blocked'); setCurrentPage(1); }}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'blocked' ? 'bg-white text-rose-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Bloklangan ({teachers.filter(t => t.status === 'blocked').length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : filteredTeachers.length === 0 ? (
        <EmptyState
          title="Ustozlar topilmadi"
          description="Kiritilgan qidiruv yoki filtr bo‘yicha hech qanday ustoz ma’lumoti mavjud emas."
          icon={Users}
          actionText={t('teachers.new_teacher')}
          onAction={handleOpenCreate}
        />
      ) : (
        <div id="teachers-table-container" className="bg-white rounded-2xl border border-[#E9EAF3] shadow-xs">
          <div className="overflow-x-auto min-h-[360px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FE] text-gray-500 font-bold border-b border-[#F0F1F7] tracking-wider uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-4">Ustoz</th>
                  <th className="px-6 py-4">Telefon</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Yo‘nalish</th>
                  <th className="px-6 py-4 text-center">Guruhlar</th>
                  <th className="px-6 py-4 text-center">O‘quvchilar</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4 text-right">{t('students.th_actions')}</th>
                </tr>
              </thead>
              <tbody key={currentPage} className="divide-y divide-gray-100 text-gray-700 animate-page-transition">
                {paginatedTeachers.map((teacher, index) => (
                  <tr
                    key={teacher.id}
                    style={{ animationDelay: `${index * 25}ms` }}
                    className="hover:bg-[#FAF9FE] transition-colors group cursor-pointer animate-table-row"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setDetailsDrawerOpen(true);
                    }}
                  >
                    {/* Avatar & Name */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5C42FD]/20 to-[#5C42FD]/5 text-[#5C42FD] font-bold text-xs flex items-center justify-center border border-[#5C42FD]/20 shrink-0">
                          {teacher.firstName[0]}
                          {teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-[#5C42FD] transition-colors">
                            {teacher.fullName}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {teacher.subject}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-3.5 font-medium text-gray-600">
                      {teacher.phone}
                    </td>

                    {/* Username */}
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        @{teacher.username}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="px-6 py-3.5 font-medium text-gray-700">
                      {teacher.subject}
                    </td>

                    {/* Groups Count */}
                    <td className="px-6 py-3.5 text-center">
                      <span className="font-bold text-gray-900 bg-purple-50 text-[#5C42FD] px-2.5 py-1 rounded-lg">
                        {teacher.groupsCount} ta
                      </span>
                    </td>

                    {/* Students Count */}
                    <td className="px-6 py-3.5 text-center">
                      <span className="font-bold text-gray-900">
                        {teacher.studentsCount} nafar
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5">
                      <StatusBadge status={teacher.status} size="sm" />
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-3.5 text-gray-400">
                      {teacher.createdAt}
                    </td>

                    {/* Actions Dropdown */}
                    <td
                      className="px-6 py-3.5 text-right"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === teacher.id ? null : teacher.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeMenuId === teacher.id
                              ? 'text-[#5C42FD] bg-purple-50 ring-2 ring-[#5C42FD]/20'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title={t('students.th_actions')}
                          aria-label="Amallar menyusi"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === teacher.id && (
                          <>
                            {/* Backdrop to close menu when clicking anywhere */}
                            <div
                              className="fixed inset-0 z-30 bg-transparent cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                              }}
                            />

                            <div
                              className={`absolute right-0 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100 ${
                                index >= paginatedTeachers.length - 2
                                  ? 'bottom-full mb-1 origin-bottom-right'
                                  : 'top-full mt-1 origin-top-right'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTeacher(teacher);
                                  setDetailsDrawerOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-[#F8F8FC] hover:text-[#5C42FD] flex items-center gap-2 cursor-pointer font-medium transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-400" />
                                <span>{t('teachers.view')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenEdit(teacher);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-[#F8F8FC] hover:text-[#5C42FD] flex items-center gap-2 cursor-pointer font-medium transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                <span>{t('teachers.edit')}</span>
                              </button>

                              {teacher.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      type: 'block',
                                      teacher
                                    });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-amber-600 hover:bg-amber-50 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                                >
                                  <Ban className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{t('teachers.block')}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      type: 'activate',
                                      teacher
                                    });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{t('teachers.activate')}</span>
                                </button>
                              )}

                              <div className="border-t border-gray-100 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    type: 'delete',
                                    teacher
                                  });
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>{t('teachers.delete')}</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTeachers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* CREATE / EDIT TEACHER MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingTeacher(null);
        }}
        title={editingTeacher ? t('teachers.edit_modal_title') : t('teachers.new_teacher')}
        subtitle={editingTeacher ? t('teachers.edit_modal_subtitle') : "O‘qituvchi shaxsiy va tizimga kirish ma’lumotlarini to‘ldiring"}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveTeacher} className="space-y-4">
          {/* Teacher Avatar Upload from Computer */}
          <ImageUpload
            value={formData.avatarUrl}
            onChange={url => setFormData({ ...formData, avatarUrl: url })}
            label="Ustoz Rasmi (Avatar)"
            helperText="PNG, JPG, WebP (maksimal 5MB)"
            aspectRatio="avatar"
          />

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Ism <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => {
                  setFormData({ ...formData, firstName: e.target.value });
                  if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                }}
                placeholder="Ismni kiriting (masalan: Sardorbek)"
                className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 shadow-2xs transition-all focus:outline-hidden ${
                  formErrors.firstName
                    ? 'border-rose-400 ring-2 ring-rose-400/10'
                    : 'border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15'
                }`}
              />
              {formErrors.firstName && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.firstName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Familiya <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => {
                  setFormData({ ...formData, lastName: e.target.value });
                  if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                }}
                placeholder="Familiyani kiriting (masalan: Alimov)"
                className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 shadow-2xs transition-all focus:outline-hidden ${
                  formErrors.lastName
                    ? 'border-rose-400 ring-2 ring-rose-400/10'
                    : 'border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15'
                }`}
              />
              {formErrors.lastName && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.lastName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Phone & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Telefon raqami <span className="text-rose-500">*</span>
              </label>
              <div
                className={`flex items-center rounded-xl border bg-white shadow-2xs transition-all overflow-hidden ${
                  formErrors.phone
                    ? 'border-rose-400 ring-2 ring-rose-400/10'
                    : 'border-gray-200 focus-within:border-[#5C42FD] focus-within:ring-2 focus-within:ring-[#5C42FD]/15'
                }`}
              >
                <span className="inline-flex items-center px-3 py-2.5 text-xs font-bold text-gray-600 bg-gray-50 border-r border-gray-200 select-none">
                  +998
                </span>
                <input
                  type="tel"
                  value={phoneRaw}
                  onChange={e => handlePhoneInput(e.target.value)}
                  placeholder="90 123 45 67"
                  className="w-full bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden font-medium"
                />
              </div>
              {formErrors.phone && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.phone}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Yo‘nalish (Fan)
              </label>
              <select
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer"
              >
                <option value="Frontend Web Development">Frontend Web Development</option>
                <option value="Backend Python & Django">Backend Python & Django</option>
                <option value="Foundation IT & Dasturlash Asoslari">Foundation IT & Dasturlash</option>
                <option value="UI/UX & Grafik Dizayn">UI/UX & Grafik Dizayn</option>
                <option value="Flutter Mobile App Development">Flutter Mobile Development</option>
                <option value="English for IT Specialists">English for IT</option>
              </select>
            </div>
          </div>

          {/* Username with Live Uniqueness Warning UI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">
                Username (Login) <span className="text-rose-500">*</span>
              </label>
              {isUsernameAvailable && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Username bo‘sh</span>
                </span>
              )}
            </div>
            
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs font-bold">
                @
              </span>
              <input
                type="text"
                value={formData.username}
                onChange={e => {
                  setFormData({
                    ...formData,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                  });
                  if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                }}
                placeholder="masalan: sardor_mentor"
                className={`w-full bg-white border rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 shadow-2xs transition-all focus:outline-hidden ${
                  isUsernameTaken || formErrors.username
                    ? 'border-rose-400 ring-2 ring-rose-400/10'
                    : isUsernameAvailable
                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/15'
                    : 'border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15'
                }`}
              />
            </div>

            {/* Username Unique Warning UI (Prompt spec 10) */}
            {isUsernameTaken && (
              <div className="mt-1.5 p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl flex items-center gap-2 text-[11px] text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Ushbu username (@{formData.username}) band! Iltimos, boshqa username tanlang.</span>
              </div>
            )}
            {formErrors.username && !isUsernameTaken && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{formErrors.username}</span>
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              Ustoz tizimga kirishi uchun login sifatida xizmat qiladi (faqat kichik harf, raqam va pastki chiziq).
            </p>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Parol {!editingTeacher && <span className="text-rose-500">*</span>}
                {editingTeacher && <span className="text-[11px] text-gray-400 font-normal ml-1">(O‘zgartirilmasa bo‘sh qoldiring)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                  }}
                  placeholder="Kamida 6 belgi"
                  className={`w-full bg-white border rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 shadow-2xs transition-all focus:outline-hidden ${
                    formErrors.password
                      ? 'border-rose-400 ring-2 ring-rose-400/10'
                      : 'border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.password}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Parolni tasdiqlash <span className="text-rose-500">*</span>
                </label>
                {formData.password && formData.confirmPassword && (
                  formData.password === formData.confirmPassword ? (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Mos keldi
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5">
                      <X className="w-3 h-3" /> Mos kelmadi
                    </span>
                  )
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
                  }}
                  placeholder="Parolni qayta kiriting"
                  className={`w-full bg-white border rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 shadow-2xs transition-all focus:outline-hidden ${
                    formErrors.confirmPassword || (formData.confirmPassword && formData.password !== formData.confirmPassword)
                      ? 'border-rose-400 ring-2 ring-rose-400/10'
                      : 'border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.confirmPassword}</span>
                </p>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              disabled={savingTeacher}
              onClick={() => {
                setCreateModalOpen(false);
                setEditingTeacher(null);
              }}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isUsernameTaken || savingTeacher}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5C42FD] hover:bg-[#4d33eb] disabled:bg-[#5C42FD]/60 disabled:cursor-not-allowed rounded-xl shadow-xs shadow-[#5C42FD]/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {savingTeacher ? <Clock className="w-4 h-4 animate-spin" /> : editingTeacher ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{savingTeacher ? 'Saqlanmoqda...' : editingTeacher ? t('common.save') : t('teachers.new_teacher')}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* TEACHER DETAILS DRAWER */}
      <Drawer
        isOpen={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        title={selectedTeacher?.fullName || 'Ustoz Tafsilotlari'}
        subtitle={`@${selectedTeacher?.username} • ${selectedTeacher?.subject}`}
        width="xl"
      >
        {selectedTeacher && (
          <div className="space-y-6">
            {/* Header Mini Card */}
            <div className="bg-[#FAF9FE] p-4 rounded-2xl border border-[#E9EAF3] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#5C42FD] text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                  {selectedTeacher.firstName[0]}
                  {selectedTeacher.lastName[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{selectedTeacher.fullName}</h4>
                  <p className="text-xs text-gray-500">{selectedTeacher.phone}</p>
                </div>
              </div>
              <StatusBadge status={selectedTeacher.status} />
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 gap-4 text-xs font-bold">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'groups', label: 'Groups' },
                { id: 'students', label: 'Students' },
                { id: 'salary', label: 'Salary' },
                { id: 'statistics', label: 'Statistics' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailsTab(tab.id as any)}
                  className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                    detailsTab === tab.id
                      ? 'border-[#5C42FD] text-[#5C42FD]'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {detailsTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[11px]">Telefon raqami</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{selectedTeacher.phone}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[11px]">Foydalanuvchi nomi</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">@{selectedTeacher.username}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[11px]">Faol Guruhlar</span>
                    <span className="font-bold text-[#5C42FD] mt-0.5 block">{selectedTeacher.groupsCount} ta guruh</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[11px]">Jami O‘quvchilar</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">{selectedTeacher.studentsCount} nafar</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                  <span className="text-xs font-bold text-gray-900">Mentor haqida ma’lumot</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {selectedTeacher.bio || 'Avlod Ta’limning tajribali yetakchi mentori. Amaliy loyihalar va portfolio bilan ishlashga ixtisoslashgan.'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Groups */}
            {detailsTab === 'groups' && (
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-gray-900">{selectedTeacher.subject} - Guruhi</h5>
                    <p className="text-gray-400 text-[11px]">Dush - Chor - Juma • 14:00 - 16:00</p>
                  </div>
                  <span className="font-bold text-[#5C42FD] bg-purple-50 px-2 py-1 rounded-md">
                    {selectedTeacher.studentsCount} talaba
                  </span>
                </div>
              </div>
            )}

            {/* Tab: Students */}
            {detailsTab === 'students' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Ushbu mentor guruhlaridagi faol talabalar:</p>
                <div className="p-3 bg-[#FAF9FE] rounded-xl text-xs flex justify-between font-semibold">
                  <span>Biriktirilgan jami o‘quvchi:</span>
                  <span className="text-[#5C42FD] font-bold">{selectedTeacher.studentsCount} nafar</span>
                </div>
              </div>
            )}

            {/* Tab: Salary */}
            {detailsTab === 'salary' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-xs text-purple-700 font-semibold block">Oylik hisoblangan ulush (40%)</span>
                  <h3 className="text-2xl font-black text-[#5C42FD] mt-1">
                    {(selectedTeacher.monthlySalary || 12480000).toLocaleString()} UZS
                  </h3>
                  <span className="text-[11px] text-purple-600 mt-1 block">
                    Shartnoma bo‘yicha: to‘plangan mablag‘ning 40% stavkasi
                  </span>
                </div>
              </div>
            )}

            {/* Tab: Statistics */}
            {detailsTab === 'statistics' && (
              <div className="space-y-3">
                <div className="p-3.5 bg-white rounded-xl border border-gray-100 flex justify-between text-xs">
                  <span className="text-gray-500">Darslarga qatnashish darajasi (Attendance):</span>
                  <span className="font-bold text-emerald-600">{selectedTeacher.attendanceRate}%</span>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-gray-100 flex justify-between text-xs">
                  <span className="text-gray-500">O‘quvchilarning bitirish darajasi:</span>
                  <span className="font-bold text-gray-900">92.4%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* CONFIRMATION DIALOG (Delete / Block / Activate) */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete', teacher: null })}
        onConfirm={() => {
          if (!confirmDialog.teacher) return;
          if (confirmDialog.type === 'delete') {
            handleDeleteTeacher(confirmDialog.teacher.id);
          } else if (confirmDialog.type === 'block') {
            handleStatusChange(confirmDialog.teacher, 'blocked');
          } else if (confirmDialog.type === 'activate') {
            handleStatusChange(confirmDialog.teacher, 'active');
          }
        }}
        title={
          confirmDialog.type === 'delete'
            ? 'Ustozni o‘chirishni tasdiqlaysizmi?'
            : confirmDialog.type === 'block'
            ? 'Ustozni bloklashni tasdiqlaysizmi?'
            : 'Ustozni faollashtirishni tasdiqlaysizmi?'
        }
        message={
          confirmDialog.type === 'delete'
            ? `${confirmDialog.teacher?.fullName} tizimdan to‘liq o‘chiriladi. Bu amalni qaytarib bo‘lmaydi!`
            : confirmDialog.type === 'block'
            ? `${confirmDialog.teacher?.fullName} profili vaqtincha bloklanadi va guruhlaridagi darslar to‘xtatiladi.`
            : `${confirmDialog.teacher?.fullName} profili faollashtiriladi va tizimga kirish huquqi tiklanadi.`
        }
        confirmText={
          confirmDialog.type === 'delete' ? "O'chirish" : confirmDialog.type === 'block' ? 'Bloklash' : 'Faollashtirish'
        }
        variant={confirmDialog.type === 'activate' ? 'success' : confirmDialog.type === 'block' ? 'warning' : 'danger'}
        icon={confirmDialog.type === 'activate' ? CheckCircle2 : confirmDialog.type === 'block' ? Ban : Trash2}
      />
    </div>
  );
};
