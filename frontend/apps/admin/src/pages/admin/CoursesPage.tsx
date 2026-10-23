import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  PlusCircle,
  Clock,
  Coins,
  GraduationCap,
  Edit2,
  CheckCircle2,
  Archive,
  Loader2,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { Course } from '../../types';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Toggle status confirmation
  const [courseToToggle, setCourseToToggle] = useState<Course | null>(null);
  const [toggling, setToggling] = useState(false);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createDuration, setCreateDuration] = useState(6);
  const [createFee, setCreateFee] = useState(1200000);
  const [creating, setCreating] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDuration, setEditDuration] = useState(6);
  const [editFee, setEditFee] = useState(1200000);
  const [editing, setEditing] = useState(false);

  const { showToast } = useToast();

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCourses({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setCourses(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast('Course name is required.', 'error');
      return;
    }
    if (createDuration <= 0) {
      showToast('Duration must be at least 1 month.', 'error');
      return;
    }
    if (createFee < 0) {
      showToast('Tuition fee must be a valid non-negative amount.', 'error');
      return;
    }

    setCreating(true);
    try {
      await api.createCourse({
        name: createName.trim(),
        description: createDesc.trim(),
        duration_months: createDuration,
        default_monthly_fee: createFee,
        status: 'active',
      });
      showToast(`Course "${createName}" published.`, 'success');
      setIsCreateOpen(false);
      setCreateName('');
      setCreateDesc('');
      fetchCourses();
    } catch (err: any) {
      showToast(err.message || 'Failed to create course.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setEditName(course.name);
    setEditDesc(course.description);
    setEditDuration(course.duration_months);
    setEditFee(course.default_monthly_fee);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setEditing(true);
    try {
      await api.updateCourse(selectedCourse.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        duration_months: editDuration,
        default_monthly_fee: editFee,
      });
      showToast(`Course "${editName}" updated. Existing student fees preserved.`, 'success');
      setIsEditOpen(false);
      fetchCourses();
    } catch (err: any) {
      showToast(err.message || 'Failed to update course.', 'error');
    } finally {
      setEditing(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!courseToToggle) return;
    const newStatus = courseToToggle.status === 'active' ? 'archived' : 'active';

    setToggling(true);
    try {
      await api.updateCourse(courseToToggle.id, { status: newStatus });
      showToast(
        `Course "${courseToToggle.name}" has been ${newStatus === 'active' ? 'activated' : 'archived'}.`,
        'info'
      );
      setCourseToToggle(null);
      fetchCourses();
    } catch (err: any) {
      showToast(err.message || 'Failed to change course status.', 'error');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Course Offerings</h2>
          <p className="text-xs text-slate-500">
            Define academic programs, duration, baseline tuition schedules, and active cohorts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Create Course</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search courses by name or syllabus details..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Course Cards */}
      {loading ? (
        <LoadingState message="Loading courses from database..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCourses} />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Create your first academic syllabus or adjust search keywords."
          actionLabel="Create Course"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {course.duration_months} Months Program
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      course.status === 'active' ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {course.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {course.name}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {course.description}
                </p>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Default Tuition:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {course.default_monthly_fee.toLocaleString()} UZS / mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Active Groups:</span>
                    <span className="font-mono font-semibold text-indigo-700 tabular-nums">
                      {course.groups_count || 0} cohorts
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEditModal(course)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Course</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCourseToToggle(course)}
                  className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                    course.status === 'active'
                      ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      : 'text-emerald-700 hover:bg-emerald-50 font-semibold'
                  }`}
                >
                  {course.status === 'active' ? 'Archive' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Academic Course"
        subtitle="Configure new curriculum specifications and default pricing"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Course Name *
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Modern Full-Stack Web Development"
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Curriculum Objectives
            </label>
            <textarea
              rows={3}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Outline the core topics, tech stack, and practical deliverables..."
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Duration in Months *
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={createDuration}
                onChange={(e) => setCreateDuration(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Monthly Fee (UZS) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={createFee}
                onChange={(e) => setCreateFee(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={creating}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Publish Course</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT COURSE MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Course"
        subtitle={`Updating ${selectedCourse?.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Course Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Duration in Months
              </label>
              <input
                type="number"
                min="1"
                value={editDuration}
                onChange={(e) => setEditDuration(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Monthly Fee (UZS)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={editFee}
                onChange={(e) => setEditFee(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Note: Updating default tuition will only affect future enrollments. Existing enrolled students will preserve their agreed monthly fee.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              disabled={editing}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              {editing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM TOGGLE STATUS DIALOG */}
      <ConfirmDialog
        isOpen={!!courseToToggle}
        onClose={() => setCourseToToggle(null)}
        onConfirm={confirmToggleStatus}
        title={`${courseToToggle?.status === 'active' ? 'Archive' : 'Activate'} Course?`}
        message={`Are you sure you want to ${
          courseToToggle?.status === 'active' ? 'archive' : 'activate'
        } "${courseToToggle?.name}"? Archiving prevents new group creation under this course while preserving all existing groups and student records.`}
        confirmLabel={courseToToggle?.status === 'active' ? 'Archive Course' : 'Activate Course'}
        isDestructive={courseToToggle?.status === 'active'}
        isLoading={toggling}
      />
    </div>
  );
};
