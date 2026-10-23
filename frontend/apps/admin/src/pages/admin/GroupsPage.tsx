import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  PlusCircle,
  Users,
  Calendar,
  Clock,
  UserCheck,
  Search,
  Check,
  X,
  Trash2,
  Edit2,
  Eye,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import { Group, Course, Teacher, Student } from '../../types';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'create');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);

  // Group Details
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupDetails, setGroupDetails] = useState<(Group & { students: Student[] }) | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Remove student confirmation state
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);

  // Create Group Form State
  const [createName, setCreateName] = useState('');
  const [createCourseId, setCreateCourseId] = useState('');
  const [createTeacherId, setCreateTeacherId] = useState('');
  const [createStartDate, setCreateStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [createSchedule, setCreateSchedule] = useState('Mon / Wed / Fri 18:30 - 20:30');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchInModal, setStudentSearchInModal] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Group Form State
  const [editName, setEditName] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editSchedule, setEditSchedule] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'planned' | 'completed'>('active');
  const [editing, setEditing] = useState(false);

  // Add students to existing group state
  const [addStudentIds, setAddStudentIds] = useState<string[]>([]);
  const [addingStudents, setAddingStudents] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [grpRes, crsRes, tchRes, stdRes] = await Promise.all([
        api.getGroups({
          search: search.trim() || undefined,
          course_id: courseFilter !== 'all' ? courseFilter : undefined,
          teacher_id: teacherFilter !== 'all' ? teacherFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        api.getCourses(),
        api.getTeachers(),
        api.getStudents({ page_size: 100 }),
      ]);
      setGroups(grpRes.results || []);
      setCourses(crsRes.results || []);
      setTeachers(tchRes.results || []);
      setAllStudents(stdRes.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load group records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, courseFilter, teacherFilter, statusFilter]);

  // Open Details Modal and fetch full group roster
  const openGroupDetails = async (grp: Group) => {
    setSelectedGroup(grp);
    setIsDetailOpen(true);
    setLoadingDetails(true);
    try {
      const full = await api.getGroup(grp.id);
      setGroupDetails(full);
    } catch {
      setGroupDetails({ ...grp, students: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

  const openEditGroup = (grp: Group) => {
    setSelectedGroup(grp);
    setEditName(grp.name);
    setEditTeacherId(grp.teacher_id);
    setEditSchedule(grp.schedule);
    setEditStatus(grp.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setEditing(true);
    try {
      await api.updateGroup(selectedGroup.id, {
        name: editName.trim(),
        teacher_id: editTeacherId,
        schedule: editSchedule.trim(),
        status: editStatus,
      });
      showToast('Group details updated.', 'success');
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update group.', 'error');
    } finally {
      setEditing(false);
    }
  };

  // Create Group Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createCourseId || !createTeacherId || !createStartDate) {
      showToast('Name, course, teacher, and start date are required.', 'error');
      return;
    }

    setCreating(true);
    try {
      await api.createGroup({
        name: createName.trim(),
        course_id: createCourseId,
        teacher_id: createTeacherId,
        student_ids: selectedStudentIds,
        start_date: createStartDate,
        schedule: createSchedule.trim(),
      });

      showToast(`Group "${createName}" successfully formed with ${selectedStudentIds.length} students.`, 'success');
      setIsCreateOpen(false);
      // Reset form
      setCreateName('');
      setCreateCourseId('');
      setCreateTeacherId('');
      setSelectedStudentIds([]);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create group.', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Remove student from group action
  const confirmRemoveStudent = async () => {
    if (!selectedGroup || !studentToRemove) return;

    setRemovingStudent(true);
    try {
      await api.removeStudentFromGroup(selectedGroup.id, studentToRemove.id);
      showToast(`Student ${studentToRemove.full_name} removed from ${selectedGroup.name}.`, 'info');
      setStudentToRemove(null);
      // Refresh details
      const updated = await api.getGroup(selectedGroup.id);
      setGroupDetails(updated);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove student from group.', 'error');
    } finally {
      setRemovingStudent(false);
    }
  };

  // Add students to existing group
  const handleAddStudentsSubmit = async () => {
    if (!selectedGroup || addStudentIds.length === 0) return;

    setAddingStudents(true);
    try {
      await api.addStudentsToGroup(selectedGroup.id, addStudentIds);
      showToast(`${addStudentIds.length} students enrolled in ${selectedGroup.name}.`, 'success');
      setIsAddStudentsOpen(false);
      setAddStudentIds([]);
      // Refresh details
      const updated = await api.getGroup(selectedGroup.id);
      setGroupDetails(updated);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add students.', 'error');
    } finally {
      setAddingStudents(false);
    }
  };

  // Eligible students for multi-student selector in Create Modal:
  // Must match selected course if a course is chosen!
  const eligibleStudentsForCreate = allStudents.filter((s) => {
    if (createCourseId && s.course_id !== createCourseId) return false;
    if (studentSearchInModal) {
      const q = studentSearchInModal.toLowerCase();
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = eligibleStudentsForCreate.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Groups</h2>
          <p className="text-xs text-slate-500">
            Form cohorts, assign lead instructors, configure class schedules, and enroll rosters
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            if (courses.length > 0 && !createCourseId) setCreateCourseId(courses[0].id);
            if (teachers.length > 0 && !createTeacherId) setCreateTeacherId(teachers[0].id);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search group name or course..."
          />

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <LoadingState message="Loading group rosters from server..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No groups found"
          description="Create a new group cohort or adjust your filter selection."
          actionLabel="Create Group"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {group.name}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{group.course_name}</h3>
                  </div>

                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      group.status === 'active'
                        ? 'text-emerald-700'
                        : group.status === 'planned'
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {group.status}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Teacher: <strong className="text-slate-800 font-medium">{group.teacher_name}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">{group.schedule}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">Starts: {group.start_date}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-900 font-semibold tabular-nums">
                      {group.students_count || group.student_ids.length} enrolled students
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openGroupDetails(group)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-amber-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Roster & Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => openEditGroup(group)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  title="Edit Group"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE GROUP MODAL WITH MULTI-STUDENT SELECTOR */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form New Academic Group"
        subtitle="Configure schedule and select multiple students for batch enrollment"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Group Identifier / Name *
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. FS-2026-B1"
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Course Selection *
              </label>
              <select
                value={createCourseId}
                onChange={(e) => {
                  setCreateCourseId(e.target.value);
                  setSelectedStudentIds([]); // Clear selection to enforce compatible students
                }}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              >
                <option value="">Select curriculum...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lead Teacher *
              </label>
              <select
                value={createTeacherId}
                onChange={(e) => setCreateTeacherId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              >
                <option value="">Assign Teacher...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.specializations[0] || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Class Schedule & Time *
              </label>
              <input
                type="text"
                value={createSchedule}
                onChange={(e) => setCreateSchedule(e.target.value)}
                placeholder="Mon / Wed / Fri 18:30 - 20:30"
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={createStartDate}
              onChange={(e) => setCreateStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          {/* MULTI-STUDENT SELECTOR SECTION */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-slate-800 uppercase tracking-wider block">
                  Batch Enroll Students ({selectedStudentIds.length} Selected)
                </span>
                <span className="text-[11px] text-slate-500">
                  Select eligible students belonging to this course curriculum
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Select All Visible
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Filter input inside modal */}
            <div className="mb-2.5">
              <input
                type="text"
                value={studentSearchInModal}
                onChange={(e) => setStudentSearchInModal(e.target.value)}
                placeholder="Filter eligible students by name or ID..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>

            {/* Student Checkbox List */}
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {eligibleStudentsForCreate.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  {createCourseId
                    ? 'No eligible students found registered for this course.'
                    : 'Please select a course above to load compatible students.'}
                </div>
              ) : (
                eligibleStudentsForCreate.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        isChecked ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudentSelection(st.id)}
                          className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                        />
                        <div>
                          <span className="font-semibold text-slate-900">{st.full_name}</span>
                          <span className="font-mono text-[11px] text-slate-400 ml-2">
                            {st.student_id}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        {st.group_name === 'Unassigned' ? (
                          <span className="text-emerald-700">Unassigned</span>
                        ) : (
                          <span>Current: {st.group_name}</span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
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
              <span>Create Group & Enroll</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT GROUP MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Group Settings"
        subtitle={`Updating cohort ${selectedGroup?.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assigned Teacher
            </label>
            <select
              value={editTeacherId}
              onChange={(e) => setEditTeacherId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Schedule
            </label>
            <input
              type="text"
              value={editSchedule}
              onChange={(e) => setEditSchedule(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
            </select>
          </div>

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

      {/* GROUP DETAILS & ENROLLED ROSTER MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedGroup ? `Group Roster: ${selectedGroup.name}` : 'Group Details'}
        subtitle={selectedGroup?.course_name}
        maxWidth="2xl"
      >
        {loadingDetails ? (
          <LoadingState height="h-48" message="Loading group roster..." />
        ) : groupDetails ? (
          <div className="space-y-4 text-xs">
            {/* Group info row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Teacher</span>
                <p className="font-semibold text-slate-900 mt-0.5">{groupDetails.teacher_name}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Schedule</span>
                <p className="font-mono text-slate-800 mt-0.5">{groupDetails.schedule}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Start Date</span>
                <p className="font-mono text-slate-800 mt-0.5">{groupDetails.start_date}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Enrolled</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                  {groupDetails.students?.length || 0} students
                </p>
              </div>
            </div>

            {/* Enrolled Students Table with Remove Action */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">Enrolled Student Roster</h4>
                <button
                  type="button"
                  onClick={() => {
                    setAddStudentIds([]);
                    setIsAddStudentsOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                  <span>Add More Students</span>
                </button>
              </div>

              {groupDetails.students && groupDetails.students.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Student ID</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Tuition Status</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupDetails.students.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-mono font-semibold text-slate-900 tabular-nums">
                            {st.student_id}
                          </td>
                          <td className="p-2.5 font-medium text-slate-800">{st.full_name}</td>
                          <td className="p-2.5 font-mono text-slate-500">{st.phone}</td>
                          <td className="p-2.5 capitalize text-slate-700">
                            {st.payment_status.replace('_', ' ')}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setStudentToRemove(st)}
                              className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors"
                              title="Remove from group"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 p-4 bg-slate-50 rounded-lg text-center">
                  No students currently enrolled in this cohort.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ADD STUDENTS TO EXISTING GROUP SUB-MODAL */}
      <Modal
        isOpen={isAddStudentsOpen}
        onClose={() => setIsAddStudentsOpen(false)}
        title="Add Students to Group"
        subtitle={selectedGroup ? `Enrolling into ${selectedGroup.name}` : ''}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Select students to enroll into this cohort. All existing learning and financial histories are preserved.
          </p>

          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
            {allStudents
              .filter((s) => !selectedGroup?.student_ids.includes(s.id))
              .map((st) => {
                const isSelected = addStudentIds.includes(st.id);
                return (
                  <label
                    key={st.id}
                    className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer ${
                      isSelected ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          setAddStudentIds((prev) =>
                            prev.includes(st.id) ? prev.filter((i) => i !== st.id) : [...prev, st.id]
                          )
                        }
                        className="w-4 h-4 rounded text-slate-900 border-slate-300"
                      />
                      <div>
                        <span className="font-semibold text-slate-900">{st.full_name}</span>
                        <span className="font-mono text-[11px] text-slate-400 ml-2">{st.student_id}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{st.group_name}</span>
                  </label>
                );
              })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddStudentsOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddStudentsSubmit}
              disabled={addingStudents || addStudentIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              {addingStudents && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Enroll {addStudentIds.length} Student(s)</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFIRMATION MODAL BEFORE REMOVING STUDENT */}
      <ConfirmDialog
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        onConfirm={confirmRemoveStudent}
        title="Remove Student from Group Roster?"
        message={`Are you sure you want to remove ${studentToRemove?.full_name} (${studentToRemove?.student_id}) from ${selectedGroup?.name}? The student's historical attendance, recorded payments, and tuition ledger will remain intact.`}
        confirmLabel="Remove from Roster"
        isLoading={removingStudent}
        isDestructive={true}
      />
    </div>
  );
};
