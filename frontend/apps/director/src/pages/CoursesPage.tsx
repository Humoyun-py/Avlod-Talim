import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Clock,
  DollarSign,
  Users,
  Layers,
  Edit2,
  Trash2,
  Search,
  CheckCircle2
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { Course } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export const CoursesPage: React.FC = () => {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; course: Course | null }>({
    isOpen: false,
    course: null
  });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Dasturlash',
    description: '',
    durationMonths: 6,
    monthlyPrice: 1200000,
    status: 'active' as 'active' | 'inactive'
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await DirectorService.getCourses();
      setCourses(data);
    } catch {
      error('Xatolik', 'Kurslar ro‘yxatini yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData({
      name: '',
      code: `CRS-${Date.now().toString().slice(-4)}`,
      category: 'Dasturlash',
      description: '',
      durationMonths: 6,
      monthlyPrice: 1200000,
      status: 'active'
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      category: course.category,
      description: course.description,
      durationMonths: course.durationMonths,
      monthlyPrice: course.monthlyPrice,
      status: course.status
    });
    setCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Xatolik', 'Kurs nomi kiritilishi lozim');
      return;
    }

    try {
      if (editingCourse) {
        await DirectorService.updateCourse(editingCourse.id, formData);
        success('Yangilandi', 'Kurs ma’lumotlari muvaffaqiyatli saqlandi');
      } else {
        await DirectorService.createCourse(formData);
        success('Muvaffaqiyatli', 'Yangi o‘quv kursi yaratildi');
      }
      setCreateModalOpen(false);
      loadCourses();
    } catch {
      error('Xatolik', 'Kursni saqlashda muammo yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await DirectorService.deleteCourse(id);
      setDeleteConfirm({ isOpen: false, course: null });
      loadCourses();
      success('O‘chirildi', 'Kurs o‘chirildi');
    } catch {
      error('Xatolik', 'Kursni o‘chirishda xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('courses.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('courses.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#5C42FD]/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('courses.new_course')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] flex items-center justify-between shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Kurs nomi yoki tavsifi..."
            className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden"
          />
        </div>
        <span className="text-xs font-semibold text-gray-500 hidden sm:block">
          Jami kurslar: <strong className="text-gray-900">{filteredCourses.length} ta</strong>
        </span>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          title="Kurslar topilmadi"
          description="Hech qanday kurs topilmadi."
          icon={BookOpen}
          actionText="Yangi kurs yaratish"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-2xl p-6 border border-[#E9EAF3] hover:border-[#5C42FD]/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C42FD] bg-purple-50 px-2 py-0.5 rounded-md">
                      {course.category}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1.5 group-hover:text-[#5C42FD] transition-colors">
                      {course.name}
                    </h3>
                  </div>
                  <StatusBadge status={course.status} size="sm" />
                </div>

                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                  {course.description}
                </p>

                <div className="space-y-2.5 py-3 border-y border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Davomiyligi:
                    </span>
                    <strong className="text-gray-900 font-bold">{course.durationMonths} oy</strong>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Oylik to‘lov:
                    </span>
                    <strong className="text-[#5C42FD] font-extrabold">{course.monthlyPrice.toLocaleString()} UZS</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <strong>{course.studentsCount}</strong> talaba
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <strong>{course.groupsCount}</strong> guruh
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(course)}
                    className="p-1.5 text-gray-400 hover:text-[#5C42FD] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                    title="Tahrirlash"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ isOpen: true, course })}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editingCourse ? 'Kursni Tahrirlash' : 'Yangi Kurs Qo‘shish'}
        subtitle="Kurs nomi, narxi va oylik muddatini belgilang"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Kurs Nomi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masalan: AI & Data Science"
              className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Kategoriya
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer"
              >
                <option value="Dasturlash">Dasturlash</option>
                <option value="Foundation">Foundation</option>
                <option value="Dizayn">Dizayn</option>
                <option value="Mobil">Mobil</option>
                <option value="Til">Til</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer"
              >
                <option value="active">Active (Faol)</option>
                <option value="inactive">Inactive (Nofaol)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Davomiyligi (oy)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.durationMonths}
                onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Oylik Narxi (UZS)
              </label>
              <input
                type="number"
                step="50000"
                value={formData.monthlyPrice}
                onChange={e => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden font-bold transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Kurs Tavsifi (Description)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="O‘quv dasturida qaysi texnologiyalar o‘rgatiladi..."
              className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl p-3.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5C42FD] hover:bg-[#4d33eb] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {editingCourse ? 'Saqlash' : 'Kursni Yaratish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, course: null })}
        onConfirm={() => {
          if (deleteConfirm.course) handleDelete(deleteConfirm.course.id);
        }}
        title="Kursni o‘chirish"
        message={`${deleteConfirm.course?.name} kursi o‘chirilsa, unga bog‘liq yangi guruhlar ochib bo‘lmaydi.`}
        confirmText="O‘chirish"
        variant="danger"
      />
    </div>
  );
};
