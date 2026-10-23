import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  X,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Download
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { Course, Group, Student, Teacher } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { exportToCSV } from '../utils/exportUtils';
import { useLanguage } from '../context/LanguageContext';

export const GroupsPage: React.FC = () => {
  const { t } = useLanguage();
  const { success, error, info } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'students' | 'attendance' | 'payments' | 'statistics'>('overview');

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; group: Group | null }>({
    isOpen: false,
    group: null
  });

  // Create Group Form State
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    teacherId: '',
    schedule: 'Dush - Chor - Juma | 14:00 - 16:00',
    room: 'Lab-A (2-qavat)',
    maxStudents: 16,
    selectedStudentIds: [] as string[]
  });
  const [studentSearchInModal, setStudentSearchInModal] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [grp, crs, tch, stu] = await Promise.all([
        DirectorService.getGroups(),
        DirectorService.getCourses(),
        DirectorService.getTeachers(),
        DirectorService.getStudents()
      ]);
      setGroups(grp);
      setCourses(crs);
      setTeachers(tch);
      setStudents(stu);

      if (crs.length > 0 && tch.length > 0) {
        setFormData(prev => ({
          ...prev,
          courseId: prev.courseId || crs[0].id,
          teacherId: prev.teacherId || tch[0].id
        }));
      }
    } catch {
      error('Xatolik', 'Guruhlar ma’lumotini yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter students within modal for multi-select
  const modalFilteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearchInModal.toLowerCase()) ||
    s.studentId.includes(studentSearchInModal)
  );

  const toggleStudentSelection = (id: string) => {
    setFormData(prev => {
      const exists = prev.selectedStudentIds.includes(id);
      return {
        ...prev,
        selectedStudentIds: exists
          ? prev.selectedStudentIds.filter(item => item !== id)
          : [...prev.selectedStudentIds, id]
      };
    });
  };

  const selectAllFilteredStudents = () => {
    const ids = modalFilteredStudents.map(s => s.id);
    const allSelected = ids.every(id => formData.selectedStudentIds.includes(id));
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        selectedStudentIds: prev.selectedStudentIds.filter(id => !ids.includes(id))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedStudentIds: Array.from(new Set([...prev.selectedStudentIds, ...ids]))
      }));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Xatolik', 'Guruh nomi kiritilishi shart');
      return;
    }

    const selCourse = courses.find(c => c.id === formData.courseId) || courses[0];
    const selTeacher = teachers.find(t => t.id === formData.teacherId) || teachers[0];

    try {
      await DirectorService.createGroup({
        name: formData.name,
        courseId: selCourse.id,
        courseName: selCourse.name,
        teacherId: selTeacher.id,
        teacherName: selTeacher.fullName,
        maxStudents: formData.maxStudents,
        schedule: formData.schedule,
        room: formData.room,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        studentIds: formData.selectedStudentIds
      });

      success('Muvaffaqiyatli', 'Yangi guruh ochildi');
      setCreateModalOpen(false);
      setFormData({
        name: '',
        courseId: courses[0]?.id || '',
        teacherId: teachers[0]?.id || '',
        schedule: 'Dush - Chor - Juma | 14:00 - 16:00',
        room: 'Lab-A (2-qavat)',
        maxStudents: 16,
        selectedStudentIds: []
      });
      loadData();
    } catch {
      error('Xatolik', 'Guruhni yaratishda xatolik yuz berdi');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await DirectorService.deleteGroup(id);
      setDeleteConfirm({ isOpen: false, group: null });
      loadData();
      success('O‘chirildi', 'Guruh muvaffaqiyatli o‘chirildi');
    } catch {
      error('Xatolik', 'O‘chirishda xatolik yuz berdi');
    }
  };

  const handleExportGroups = () => {
    if (filteredGroups.length === 0) {
      info('Eksport', 'Eksport qilish uchun guruhlar topilmadi');
      return;
    }
    const headers = ['Guruh Nomi', 'Kurs', 'Ustoz', 'Talabalar Soni', 'Max Talabalar', 'Dars Jadvali', 'Xona'];
    const rows = filteredGroups.map(g => [
      g.name,
      g.courseName,
      g.teacherName,
      g.studentsCount,
      g.maxStudents,
      g.schedule,
      g.room || 'Asosiy auditoriya'
    ]);
    exportToCSV('avlod_guruhlar_royxati.csv', headers, rows);
    success('Yuklab olindi', 'Guruhlar ro‘yxati muvaffaqiyatli CSV/Excel faylga yuklandi');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('groups.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('groups.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportGroups}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t('common.export')}</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#5C42FD]/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('groups.new_group')}</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Guruh nomi, kurs yoki ustoz..."
            className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#F8F8FC] p-1 rounded-xl border border-gray-200 text-xs font-semibold">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-[#5C42FD] shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Karta ko‘rinishi
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-[#5C42FD] shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Jadval ko‘rinishi
          </button>
        </div>
      </div>

      {/* Content: Cards or Table */}
      {filteredGroups.length === 0 ? (
        <EmptyState
          title="Guruhlar topilmadi"
          description="Hech qanday guruh mavjud emas yoki qidiruvga mos kelmadi."
          icon={Layers}
          actionText="Yangi guruh ochish"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map(group => (
            <div
              key={group.id}
              onClick={() => {
                setSelectedGroup(group);
                setDetailsDrawerOpen(true);
              }}
              className="bg-white rounded-2xl p-5 border border-[#E9EAF3] hover:border-[#5C42FD]/40 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#5C42FD] transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{group.courseName}</p>
                  </div>
                  <StatusBadge status={group.status} size="sm" />
                </div>

                <div className="space-y-2 py-3 border-y border-gray-100 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap className="w-4 h-4 text-[#5C42FD] shrink-0" />
                    <span>Ustoz: <strong className="text-gray-900">{group.teacherName}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">{group.schedule}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Xona: <strong className="text-gray-900">{group.room}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users className="w-4 h-4 text-[#5C42FD]" />
                  <span className="font-bold text-gray-900">{group.studentsCount}</span> / {group.maxStudents} o‘quvchi
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteConfirm({ isOpen: true, group });
                  }}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="O‘chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FE] text-gray-500 font-bold border-b border-[#F0F1F7] tracking-wider uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-4">Guruh</th>
                  <th className="px-6 py-4">Kurs</th>
                  <th className="px-6 py-4">Ustoz</th>
                  <th className="px-6 py-4 text-center">Talabalar</th>
                  <th className="px-6 py-4">Jadval</th>
                  <th className="px-6 py-4">Xona</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredGroups.map(group => (
                  <tr
                    key={group.id}
                    className="hover:bg-[#FAF9FE] transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedGroup(group);
                      setDetailsDrawerOpen(true);
                    }}
                  >
                    <td className="px-6 py-3.5 font-bold text-gray-900 group-hover:text-[#5C42FD]">
                      {group.name}
                    </td>
                    <td className="px-6 py-3.5">{group.courseName}</td>
                    <td className="px-6 py-3.5 font-medium">{group.teacherName}</td>
                    <td className="px-6 py-3.5 text-center font-bold text-[#5C42FD]">
                      {group.studentsCount} / {group.maxStudents}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{group.schedule}</td>
                    <td className="px-6 py-3.5 text-gray-500">{group.room}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={group.status} size="sm" />
                    </td>
                    <td
                      className="px-6 py-3.5 text-right space-x-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroup(group);
                          setDetailsDrawerOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#5C42FD] rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, group })}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL (Multi-select students with tag chips) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Yangi Guruh Ochish"
        subtitle="Guruh nomi, mentor va biriktiriladigan talabalarni tanlang"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Guruh Nomi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masalan: FE-16 (React Master)"
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Kurs (Yo‘nalish)
              </label>
              <select
                value={formData.courseId}
                onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer"
              >
                <option value="">Tanlash...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Ustoz (Mentor) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.teacherId}
                onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer"
              >
                <option value="">Tanlash...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.subject})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Maksimal talabalar soni
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.maxStudents === 0 ? '' : formData.maxStudents}
                onChange={e => {
                  const raw = e.target.value.replace(/^0+(?=\d)/, '');
                  setFormData({ ...formData, maxStudents: raw === '' ? 0 : Number(raw) });
                }}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Dars Jadvali <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.schedule}
                onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer font-medium"
              >
                <option value="">Tanlash...</option>
                <optgroup label="Toq kunlar (Dushanba - Chorshanba - Juma)">
                  <option value="Toq kunlar (Dush-Chor-Juma) | 09:00 - 11:00">Toq kunlar (Dush-Chor-Juma) | 09:00 - 11:00</option>
                  <option value="Toq kunlar (Dush-Chor-Juma) | 14:00 - 16:00">Toq kunlar (Dush-Chor-Juma) | 14:00 - 16:00</option>
                  <option value="Toq kunlar (Dush-Chor-Juma) | 16:30 - 18:30">Toq kunlar (Dush-Chor-Juma) | 16:30 - 18:30</option>
                  <option value="Toq kunlar (Dush-Chor-Juma) | 19:00 - 21:00">Toq kunlar (Dush-Chor-Juma) | 19:00 - 21:00</option>
                </optgroup>
                <optgroup label="Juft kunlar (Seshanba - Payshanba - Shanba)">
                  <option value="Juft kunlar (Sesh-Pay-Shan) | 09:00 - 11:00">Juft kunlar (Sesh-Pay-Shan) | 09:00 - 11:00</option>
                  <option value="Juft kunlar (Sesh-Pay-Shan) | 14:00 - 16:00">Juft kunlar (Sesh-Pay-Shan) | 14:00 - 16:00</option>
                  <option value="Juft kunlar (Sesh-Pay-Shan) | 16:30 - 18:30">Juft kunlar (Sesh-Pay-Shan) | 16:30 - 18:30</option>
                  <option value="Juft kunlar (Sesh-Pay-Shan) | 19:00 - 21:00">Juft kunlar (Sesh-Pay-Shan) | 19:00 - 21:00</option>
                </optgroup>
                <optgroup label="Har kuni / Maxsus">
                  <option value="Har kuni (Dushanba - Shanba) | 09:00 - 11:00">Har kuni (Dushanba - Shanba) | 09:00 - 11:00</option>
                  <option value="Har kuni (Dushanba - Shanba) | 14:00 - 16:00">Har kuni (Dushanba - Shanba) | 14:00 - 16:00</option>
                  <option value="Dam olish kunlari (Shanba - Yakshanba)">Dam olish kunlari (Shanba - Yakshanba)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Xona / Auditoriya
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={e => setFormData({ ...formData, room: e.target.value })}
                placeholder="Lab-A (2-qavat)"
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* MULTI-SELECT STUDENTS SECTION */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-900">
                O‘quvchilarni biriktirish (Multi-select)
              </label>
              <button
                type="button"
                onClick={selectAllFilteredStudents}
                className="text-xs text-[#5C42FD] font-semibold hover:underline cursor-pointer"
              >
                Select All ({modalFilteredStudents.length})
              </button>
            </div>

            {/* Selected Chips */}
            {formData.selectedStudentIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#FAF9FE] rounded-xl border border-[#E9EAF3] mb-3 max-h-24 overflow-y-auto">
                {formData.selectedStudentIds.map(id => {
                  const st = students.find(s => s.id === id);
                  if (!st) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#5C42FD]/30 rounded-lg text-xs font-semibold text-[#5C42FD]"
                    >
                      <span>{st.fullName}</span>
                      <button
                        type="button"
                        onClick={() => toggleStudentSelection(id)}
                        className="hover:text-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search within student selector */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearchInModal}
                onChange={e => setStudentSearchInModal(e.target.value)}
                placeholder="Search students..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3.5 py-2 text-xs text-gray-900 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 focus:outline-hidden transition-all"
              />
            </div>

            {/* Checkbox List */}
            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {modalFilteredStudents.map(student => {
                const isSelected = formData.selectedStudentIds.includes(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudentSelection(student.id)}
                    className={`flex items-center justify-between p-2.5 text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-purple-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#5C42FD]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <span className="font-bold text-gray-900">{student.fullName}</span>
                        <span className="text-[10px] text-gray-400 block">ID: {student.studentId} • {student.courseName}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500">{student.phone}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5C42FD] hover:bg-[#4d33eb] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Create Group
            </button>
          </div>
        </form>
      </Modal>

      {/* GROUP DETAIL DRAWER */}
      <Drawer
        isOpen={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        title={selectedGroup?.name || 'Guruh Tafsilotlari'}
        subtitle={`${selectedGroup?.courseName} • Ustoz: ${selectedGroup?.teacherName}`}
        width="2xl"
      >
        {selectedGroup && (
          <div className="space-y-6">
            <div className="bg-[#FAF9FE] p-4 rounded-2xl border border-[#E9EAF3] flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">{selectedGroup.name}</h4>
                <p className="text-xs text-gray-500">{selectedGroup.schedule}</p>
              </div>
              <StatusBadge status={selectedGroup.status} />
            </div>

            {/* Tabs: Overview, Students, Attendance, Payments, Statistics */}
            <div className="flex border-b border-gray-100 gap-4 text-xs font-bold">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'students', label: 'Students' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'payments', label: 'Payments' },
                { id: 'statistics', label: 'Statistics' }
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
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 text-[11px] block">O‘qituvchi</span>
                  <span className="font-semibold text-gray-900 mt-0.5 block">{selectedGroup.teacherName}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 text-[11px] block">Dars Xonasi</span>
                  <span className="font-semibold text-gray-900 mt-0.5 block">{selectedGroup.room}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 text-[11px] block">O‘quvchilar soni</span>
                  <span className="font-bold text-[#5C42FD] mt-0.5 block">{selectedGroup.studentsCount} / {selectedGroup.maxStudents}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 text-[11px] block">Boshlangan sana</span>
                  <span className="font-semibold text-gray-900 mt-0.5 block">{selectedGroup.startDate}</span>
                </div>
              </div>
            )}

            {/* Students Table */}
            {detailsTab === 'students' && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9FE] text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">ID</th>
                      <th className="p-3">To‘lov Holati</th>
                      <th className="p-3 text-center">Davomat</th>
                      <th className="p-3 text-center">Coins</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.slice(0, 4).map(st => (
                      <tr key={st.id}>
                        <td className="p-3 font-bold text-gray-900">{st.fullName}</td>
                        <td className="p-3 font-mono text-[#5C42FD]">{st.studentId}</td>
                        <td className="p-3"><StatusBadge status={st.paymentStatus} size="sm" /></td>
                        <td className="p-3 text-center font-bold text-emerald-600">{st.attendanceRate}%</td>
                        <td className="p-3 text-center font-bold text-amber-600">{st.coins}</td>
                        <td className="p-3"><StatusBadge status={st.status} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Attendance */}
            {detailsTab === 'attendance' && (
              <div className="p-4 bg-white rounded-xl border border-gray-100 text-xs">
                <span className="text-gray-400 block">Guruhning o‘rtacha qatnashish darajasi</span>
                <span className="text-xl font-black text-emerald-600 mt-1 block">94.8%</span>
              </div>
            )}

            {/* Payments */}
            {detailsTab === 'payments' && (
              <div className="p-4 bg-white rounded-xl border border-gray-100 text-xs">
                <span className="text-gray-400 block">Guruh to‘lov yig‘imi</span>
                <span className="text-xl font-black text-[#5C42FD] mt-1 block">16,800,000 UZS (92% yig‘ildi)</span>
              </div>
            )}

            {/* Statistics */}
            {detailsTab === 'statistics' && (
              <div className="p-4 bg-white rounded-xl border border-gray-100 text-xs space-y-2">
                <p>O‘rtacha test bali: <strong className="text-gray-900">89.4 ball</strong></p>
                <p>Uyga vazifalar bajarilishi: <strong className="text-emerald-600">96%</strong></p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, group: null })}
        onConfirm={() => {
          if (deleteConfirm.group) handleDeleteGroup(deleteConfirm.group.id);
        }}
        title="Guruhni o‘chirish"
        message={`${deleteConfirm.group?.name} guruhi tizimdan o‘chiriladi. Bu amalni qaytarib bo‘lmaydi!`}
        confirmText="O‘chirish"
        variant="danger"
      />
    </div>
  );
};
