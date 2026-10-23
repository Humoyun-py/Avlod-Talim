import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  Eye,
  Edit2,
  ShieldAlert,
  Loader2,
  Calendar,
  Phone,
  Coins,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Student, Course, Group, StudentCredentials } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchInput } from '../../components/common/SearchInput';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { CredentialModal } from '../../components/common/CredentialModal';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [courseFilter, setCourseFilter] = useState(searchParams.get('course_id') || 'all');
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group_id') || 'all');
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment_status') || 'all');
  const [accountFilter, setAccountFilter] = useState(searchParams.get('account_status') || 'all');
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'create');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  // Selected student
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create Form State
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createPhone, setCreatePhone] = useState('+998 ');
  const [createCourseId, setCreateCourseId] = useState('');
  const [createGroupId, setCreateGroupId] = useState('');
  const [createMonthlyFee, setCreateMonthlyFee] = useState<number>(0);
  const [creating, setCreating] = useState(false);

  // Edit Form State
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMonthlyFee, setEditMonthlyFee] = useState(0);
  const [editing, setEditing] = useState(false);

  // Status Override State
  const [overrideAction, setOverrideAction] = useState<'activate' | 'restrict' | 'deactivate'>('restrict');
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  // Credentials Generated State
  const [createdCredentials, setCreatedCredentials] = useState<StudentCredentials | null>(null);
  const [createdStudentName, setCreatedStudentName] = useState('');

  const { showToast } = useToast();

  const fetchFiltersData = async () => {
    try {
      const [crsRes, grpRes] = await Promise.all([api.getCourses(), api.getGroups()]);
      setCourses(crsRes.results || []);
      setGroups(grpRes.results || []);
    } catch {
      //
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStudents({
        search: search.trim() || undefined,
        course_id: courseFilter !== 'all' ? courseFilter : undefined,
        group_id: groupFilter !== 'all' ? groupFilter : undefined,
        payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
        account_status: accountFilter !== 'all' ? accountFilter : undefined,
        page,
        page_size: 8,
      });
      setStudents(res.results || []);
      setTotalCount(res.count || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve student records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, courseFilter, groupFilter, paymentFilter, accountFilter, page]);

  // When course changes in create modal, prefill fee and filter compatible groups
  const handleCourseChange = (cid: string) => {
    setCreateCourseId(cid);
    setCreateGroupId(''); // Reset group to force compatible selection
    const selectedCourse = courses.find((c) => c.id === cid);
    if (selectedCourse) {
      setCreateMonthlyFee(selectedCourse.default_monthly_fee);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFirstName.trim() || !createLastName.trim() || !createCourseId) {
      showToast('First name, last name, and course selection are required.', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await api.createStudent({
        first_name: createFirstName.trim(),
        last_name: createLastName.trim(),
        phone: createPhone.trim(),
        course_id: createCourseId,
        group_id: createGroupId || undefined,
        monthly_fee: createMonthlyFee,
      });

      showToast(`Student ${response.student.full_name} created successfully.`, 'success');
      setIsCreateOpen(false);

      // Open credential dialog
      setCreatedCredentials(response.credentials);
      setCreatedStudentName(response.student.full_name);

      // Reset form
      setCreateFirstName('');
      setCreateLastName('');
      setCreatePhone('+998 ');
      setCreateCourseId('');
      setCreateGroupId('');

      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to create student.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setEditFirstName(student.first_name);
    setEditLastName(student.last_name);
    setEditPhone(student.phone);
    setEditMonthlyFee(student.monthly_fee);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setEditing(true);
    try {
      await api.updateStudent(selectedStudent.id, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone.trim(),
      });
      if (Number(editMonthlyFee) !== Number(selectedStudent.monthly_fee)) {
        throw new Error('Enrollment fee changes are not yet supported by the backend. Student profile changes were saved.');
      }
      showToast('Student details updated successfully.', 'success');
      setIsEditOpen(false);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to update student.', 'error');
    } finally {
      setEditing(false);
    }
  };

  const openDetailsModal = async (student: Student) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
    setLoadingDetails(true);
    try {
      const full = await api.getStudent(student.id);
      setStudentDetails(full);
    } catch {
      setStudentDetails(student);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openOverrideModal = (student: Student) => {
    setSelectedStudent(student);
    setOverrideAction(student.account_status === 'restricted' ? 'activate' : 'restrict');
    setOverrideReason('');
    setIsOverrideOpen(true);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      showToast('Please provide an audit justification note (at least 5 characters).', 'error');
      return;
    }
    if (overrideAction === 'restrict') {
      showToast('Tuition restrictions are applied by the server billing policy; manual restrictions are unavailable.', 'error');
      return;
    }

    setOverriding(true);
    try {
      await api.overrideStudentStatus(selectedStudent.id, overrideAction, overrideReason.trim());
      showToast(`Account status updated to ${overrideAction}.`, 'success');
      setIsOverrideOpen(false);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', 'error');
    } finally {
      setOverriding(false);
    }
  };

  // Compatible groups for the selected course in create modal
  const compatibleGroups = groups.filter((g) => g.course_id === createCourseId);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Enrolled Students</h2>
          <p className="text-xs text-slate-500">
            Manage academic profiles, course assignments, tuition standing, and credentials
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            if (courses.length > 0 && !createCourseId) {
              handleCourseChange(courses[0].id);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>Create Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by student name, ID (AVL-...), or phone..."
            />
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-400"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-400"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="restricted">Restricted (Overdue)</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-400"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="restricted">Restricted Accounts</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <LoadingState message="Fetching student records from database..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStudents} />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students match criteria"
            description="Adjust your search keywords or filter settings to view records."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setCourseFilter('all');
              setGroupFilter('all');
              setPaymentFilter('all');
              setAccountFilter('all');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Course & Group</th>
                  <th className="py-3 px-4 text-right">Tuition Fee</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student ID */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      {student.student_id}
                    </td>

                    {/* Name & Phone */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{student.phone}</div>
                    </td>

                    {/* Course & Group */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{student.course_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{student.group_name}</div>
                    </td>

                    {/* Monthly Fee */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {student.monthly_fee.toLocaleString()} UZS
                    </td>

                    {/* Balance Due */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className={student.balance_due > 0 ? 'text-rose-700 font-semibold' : 'text-slate-500'}>
                        {student.balance_due.toLocaleString()} UZS
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={student.payment_status} type="payment" />
                    </td>

                    {/* Account Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={student.account_status} type="account" />
                    </td>

                    {/* Registered Date */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] tabular-nums whitespace-nowrap">
                      {new Date(student.registered_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openDetailsModal(student)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="View student profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openOverrideModal(student)}
                          className={`p-1.5 rounded-md transition-colors ${
                            student.account_status === 'restricted'
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-amber-700 hover:bg-amber-50'
                          }`}
                          title="Override restriction status"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={8}
          onPageChange={setPage}
        />
      </div>

      {/* CREATE STUDENT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Student"
        subtitle="Credentials will be generated by the secure backend authority"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={createFirstName}
                onChange={(e) => setCreateFirstName(e.target.value)}
                placeholder="e.g. Alisher"
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={createLastName}
                onChange={(e) => setCreateLastName(e.target.value)}
                placeholder="e.g. Navoiy"
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400" />
              Phone Number
            </label>
            <input
              type="text"
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Course *
              </label>
              <select
                value={createCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              >
                <option value="">Select a course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.default_monthly_fee.toLocaleString()} UZS)
                  </option>
                ))}
              </select>
            </div>

            {/* Compatible Group selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Group Assignment
              </label>
              <select
                value={createGroupId}
                onChange={(e) => setCreateGroupId(e.target.value)}
                disabled={!createCourseId}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {createCourseId ? 'Leave unassigned or select group...' : 'First select a course'}
                </option>
                {compatibleGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} · {g.teacher_name} ({g.schedule})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Tuition Fee */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Monthly Agreed Tuition Fee (UZS) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={createMonthlyFee}
              onChange={(e) => setCreateMonthlyFee(parseInt(e.target.value, 10) || 0)}
              required
              className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Prefilled with course default. Can be adjusted for sanctioned scholarships or discounts.
            </p>
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
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Register Student</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Student Record"
        subtitle={`Editing ${selectedStudent?.student_id}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Agreed Monthly Tuition (UZS)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={editMonthlyFee}
              onChange={(e) => setEditMonthlyFee(parseInt(e.target.value, 10) || 0)}
              required
              className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900"
            />
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

      {/* STUDENT DETAILS MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedStudent?.full_name || 'Student Details'}
        subtitle={`System ID: ${selectedStudent?.student_id}`}
        maxWidth="2xl"
      >
        {loadingDetails ? (
          <LoadingState height="h-48" message="Loading student records..." />
        ) : selectedStudent ? (
          <div className="space-y-5 text-xs">
            {/* Top Stat Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Tuition Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedStudent.payment_status} type="payment" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Balance Due</span>
                <span className="text-sm font-bold font-mono text-slate-900 tabular-nums block mt-0.5">
                  {selectedStudent.balance_due.toLocaleString()} UZS
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Avlod Coins</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                    {selectedStudent.coin_balance}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Attendance</span>
                <span className="text-sm font-bold font-mono text-emerald-700 tabular-nums block mt-0.5">
                  {selectedStudent.attendance_percentage}%
                </span>
              </div>
            </div>

            {/* Academic & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200/90 bg-white">
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Enrolled Course</span>
                  <p className="font-semibold text-slate-900">{selectedStudent.course_name}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Current Group</span>
                  <p className="font-semibold text-slate-800 font-mono">{selectedStudent.group_name}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Registration Date</span>
                  <p className="text-slate-600 font-mono">
                    {new Date(selectedStudent.registered_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Phone</span>
                  <p className="font-mono text-slate-800">{selectedStudent.phone}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Account Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedStudent.account_status} type="account" />
                  </div>
                </div>
                {selectedStudent.restriction_reason && (
                  <div>
                    <span className="text-[11px] text-rose-500 uppercase font-semibold">Restriction Note</span>
                    <p className="text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 mt-0.5">
                      {selectedStudent.restriction_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial History */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>Recorded Payment Transactions</span>
              </h4>

              {studentDetails?.payments && studentDetails.payments.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Ref</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentDetails.payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-mono text-slate-800">{p.reference}</td>
                          <td className="p-2.5 uppercase font-mono text-slate-600">{p.payment_method}</td>
                          <td className="p-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                            {p.amount.toLocaleString()} UZS
                          </td>
                          <td className="p-2.5 font-mono text-slate-400">{p.payment_date}</td>
                          <td className="p-2.5">
                            <StatusBadge status={p.verification_status} type="verification" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 p-3 bg-slate-50 rounded-lg text-center">
                  No payment records registered for this student yet.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* STATUS OVERRIDE MODAL */}
      <Modal
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        title="Administrative Account Status Override"
        subtitle={`Target: ${selectedStudent?.full_name} (${selectedStudent?.student_id})`}
        maxWidth="md"
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Modifying account restriction overrides system automated financial policies. Every change requires an audit note logged in the backend.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Desired Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOverrideAction('activate')}
                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  overrideAction === 'activate'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Activate
              </button>

              <button
                type="button"
                onClick={() => setOverrideAction('restrict')}
                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  overrideAction === 'restrict'
                    ? 'border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Restrict
              </button>

              <button
                type="button"
                onClick={() => setOverrideAction('deactivate')}
                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  overrideAction === 'deactivate'
                    ? 'border-slate-800 bg-slate-100 text-slate-900 ring-1 ring-slate-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Deactivate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Audit Justification Note *
            </label>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Granted 10-day extension by Director memo #49, pending sponsor wire transfer."
              required
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOverrideOpen(false)}
              disabled={overriding}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={overriding}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              {overriding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Commit Status Override</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CREDENTIALS GENERATED PRESENTATION DIALOG */}
      <CredentialModal
        isOpen={!!createdCredentials}
        onClose={() => setCreatedCredentials(null)}
        credentials={createdCredentials}
        studentName={createdStudentName}
      />
    </div>
  );
};
