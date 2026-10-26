/**
 * Student Panel API Service Layer
 * 
 * Centralized service layer implementing business logic, JWT authentication contracts,
 * and synchronized storage shared with the Director panel.
 */

import {
  Product,
  ShopOrder,
  CoinTransaction,
  AttendanceRecord,
  LessonSchedule,
  Homework,
  Announcement,
  StudentNotification,
  Student,
  StudentUser,
  Payment,
  Group,
  Course
} from '../types';
import { ApiClient } from './apiClient';

export const StudentApiService = {
  // -------------------------------------------------------------
  // AUTHENTICATION & SESSION
  // -------------------------------------------------------------

  async login(
    studentIdOrUsername: string,
    pass: string
  ): Promise<{ success: boolean; user?: StudentUser; error?: string; token?: string }> {
    {
      try {
        const res = await ApiClient.request<any>('/auth/student/login/', {
          method: 'POST',
          body: JSON.stringify({ student_id: studentIdOrUsername, password: pass })
        });
        const raw = res.data.user;
        const user: StudentUser = { id: String(raw.id), studentId: raw.student_id, username: raw.username, firstName: raw.first_name, lastName: raw.last_name, fullName: `${raw.first_name} ${raw.last_name}`.trim(), role: 'STUDENT', phone: raw.phone || '', bio: '', telegramUsername: '', preferredContact: 'Phone', groupId: '', groupName: '', courseName: '', teacherName: '', attendanceRate: 0, coins: 0, paymentStatus: raw.tuition_restricted ? 'restricted' : 'unknown' };
        ApiClient.setTokens(res.data.access, res.data.refresh);
        return { success: true, user, token: res.data.access };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Server bilan bog‘lanib bo‘lmadi' };
      }
    }

    return { success: false, error: 'Live API login is required.' };

  },

  async getCurrentStudent(studentId: string): Promise<StudentUser | null> {
    if (ApiClient.getAccessToken()) {
      const { data } = await ApiClient.request<any>('/auth/me/');
      if (data.role !== 'student' || String(data.id) !== String(studentId)) return null;
      const [{ data: dashboard }, { data: coins }, { data: attendance }] = await Promise.all([ApiClient.request<any>('/dashboard/'), ApiClient.request<any>('/coins/'), ApiClient.request<any>('/attendance/')]);
      const group = dashboard.groups?.[0];
      const records = attendance.results || attendance;
      const attendanceRate = records.length ? Math.round(records.filter((r: any) => r.status !== 'absent').length * 100 / records.length) : 100;
      return { id: String(data.id), studentId: data.student_id, username: data.username, firstName: data.first_name, lastName: data.last_name, fullName: data.full_name || `${data.first_name} ${data.last_name}`.trim(), role: 'STUDENT', phone: data.phone || '', bio: '', telegramUsername: '', preferredContact: 'Phone', groupId: String(group?.id || ''), groupName: group?.name || '', courseName: group?.course_name || '', teacherName: group?.teacher_name || '', attendanceRate, coins: coins.balance || 0, paymentStatus: data.tuition_restricted ? 'restricted' : 'unknown' };
    }
    return null;
  },

  async updateProfile(
    studentId: string,
    updates: { bio?: string; telegramUsername?: string; preferredContact?: 'Telegram' | 'Phone' | 'Email'; avatarUrl?: string }
  ): Promise<StudentUser> {
    if (updates.bio || updates.telegramUsername || updates.preferredContact || updates.avatarUrl) throw new Error('The backend does not currently store these student profile fields.');
    const user = await this.getCurrentStudent(studentId);
    if (!user) throw new Error('O‘quvchi topilmadi');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('student-profile-updated', { detail: { studentId } }));
    }
    return user;
  },

  async changePassword(studentId: string, currentPass: string, newPass: string): Promise<boolean> {
    if (ApiClient.getAccessToken()) {
      await ApiClient.request('/auth/password/change/', { method: 'POST', body: JSON.stringify({ old_password: currentPass, new_password: newPass }) });
      return true;
    }
    throw new Error('Authentication required to update password.');
  },

  // -------------------------------------------------------------
  // COIN BALANCE & TRANSACTIONS (SHARED SOURCE OF TRUTH)
  // -------------------------------------------------------------

  async getCoinBalance(studentId: string): Promise<{ balance: number; totalEarned: number; totalSpent: number }> {
    if (ApiClient.getAccessToken()) {
      const { data } = await ApiClient.request<any>('/coins/');
      const rows = data.transactions || [];
      return { balance: data.balance, totalEarned: rows.filter((r: any) => r.amount > 0).reduce((n: number, r: any) => n + r.amount, 0), totalSpent: Math.abs(rows.filter((r: any) => r.amount < 0).reduce((n: number, r: any) => n + r.amount, 0)) };
    }
    throw new Error('Authentication required to read coin balances.');
  },

  async getCoinTransactions(studentId: string): Promise<CoinTransaction[]> {
    if (ApiClient.getAccessToken()) {
      const { data } = await ApiClient.request<any>('/coins/');
      return (data.transactions || []).map((tx: any) => ({ id: String(tx.id), studentId, studentPublicId: '', studentName: '', groupName: '', amount: Math.abs(tx.amount), operation: tx.amount < 0 ? 'subtract' : 'add', previousBalance: 0, newBalance: 0, reason: tx.reason, date: tx.created_at, teacherName: '' }));
    }
    throw new Error('Authentication required to read coin transactions.');
  },

  // -------------------------------------------------------------
  // STUDENT SHOP & ORDERS
  // -------------------------------------------------------------

  async getShopProducts(): Promise<Product[]> {
    const { data } = await ApiClient.request<any>('/shop/products/');
    return (data.results || data).map((p: any) => ({ id: String(p.id), name: p.name, description: p.description, coinPrice: p.coin_price, stock: p.stock, status: !p.active || p.stock === 0 ? 'out_of_stock' : p.stock < 5 ? 'low_stock' : 'in_stock', imageUrl: p.image || '', category: '', createdAt: p.created_at }));
  },

  async purchaseProduct(
    studentId: string,
    productId: string
  ): Promise<{ order: ShopOrder; newBalance: number }> {
    throw new Error('Purchase requires password confirmation; call purchaseProductWithPassword.');
  },

  async purchaseProductWithPassword(productId: string, password: string): Promise<{ order: ShopOrder; newBalance: number }> {
    const { data } = await ApiClient.request<any>('/shop/purchase/', { method: 'POST', body: JSON.stringify({ product: Number(productId), quantity: 1, password }) });
    const [{ data: balance }, { data: products }, { data: me }] = await Promise.all([ApiClient.request<any>('/coins/'), ApiClient.request<any>('/shop/products/'), ApiClient.request<any>('/auth/me/')]);
    const product = (products.results || products).find((p: any) => String(p.id) === String(productId));
    return { order: { id: String(data.id), orderNumber: String(data.id), studentId: String(me.id), studentName: me.full_name, studentPublicId: me.student_id, productId, productName: product?.name || '', productImage: product?.image || '', coinAmount: product?.coin_price || 0, date: new Date().toISOString(), status: data.status }, newBalance: balance.balance };
  },

  async getStudentOrders(studentId: string): Promise<ShopOrder[]> {
    const { data } = await ApiClient.request<any>('/shop/orders/');
    return (data.results || data).map((o: any) => ({ id: String(o.id), orderNumber: String(o.id), studentId: String(o.student), studentName: o.student_name, studentPublicId: '', productId: String(o.product), productName: o.product_name, productImage: '', coinAmount: o.unit_price * o.quantity, date: o.created_at, status: o.status }));
  },

  // -------------------------------------------------------------
  // ATTENDANCE
  // -------------------------------------------------------------

  async getAttendance(studentId: string): Promise<{
    records: AttendanceRecord[];
    stats: {
      total: number;
      attended: number;
      missed: number;
      late: number;
      excused: number;
      percentage: number;
    };
  }> {
    const { data } = await ApiClient.request<any>('/attendance/');
    const lessons = await ApiClient.request<any>('/lessons/');
    const lessonList = lessons.data.results || lessons.data;
    const rows = (data.results || data).map((r: any) => ({ id: String(r.id), studentId, studentPublicId: '', groupId: String(r.group), groupName: '', courseName: '', date: r.date, dayOfWeek: '', topic: lessonList.find((l: any) => String(l.id) === String(r.lesson))?.title || '', status: r.status === 'present' ? 'Present' : r.status === 'absent' ? 'Absent' : 'Excused' }));
    const attended = rows.filter((r: any) => r.status === 'Present').length, missed = rows.filter((r: any) => r.status === 'Absent').length, excused = rows.filter((r: any) => r.status === 'Excused').length;
    return { records: rows, stats: { total: rows.length, attended, missed, late: 0, excused, percentage: rows.length ? Math.round(((attended + excused) / rows.length) * 100) : 100 } };
  },

  // -------------------------------------------------------------
  // SCHEDULE
  // -------------------------------------------------------------

  async getSchedule(groupId: string): Promise<LessonSchedule[]> {
    const { data } = await ApiClient.request<any>('/lessons/');
    const { data: groupData } = await ApiClient.request<any>(`/groups/${groupId}/`);
    return (data.results || data).filter((l: any) => String(l.group) === groupId).map((l: any) => ({ id: String(l.id), groupId, groupName: groupData.name, courseName: l.course_name || '', teacherName: '', date: l.scheduled_date || '', dayOfWeek: '', startTime: '', endTime: '', room: '', status: l.status, topic: l.title }));
  },

  // -------------------------------------------------------------
  // HOMEWORK
  // -------------------------------------------------------------

  async getHomework(groupId: string): Promise<Homework[]> {
    const { data } = await ApiClient.request<any>('/assignments/');
    return (data.results || data).filter((a: any) => String(a.lesson_data?.group) === groupId).map((a: any) => ({ id: String(a.id), title: a.title, description: a.description, groupId, groupName: '', courseName: '', teacherName: '', assignedDate: a.created_at, deadline: a.due_at || '', maxScore: 100, status: 'Pending' }));
  },

  async submitHomework(
    homeworkId: string,
    submission: { textContent: string; githubUrl?: string; previewUrl?: string }
  ): Promise<Homework> {
    const { data } = await ApiClient.request<any>('/submissions/', { method: 'POST', body: JSON.stringify({ assignment: Number(homeworkId), text: submission.textContent }) });
    return { id: String(data.assignment), title: '', description: '', groupId: '', groupName: '', courseName: '', teacherName: '', assignedDate: '', deadline: '', maxScore: 100, status: 'Submitted', submission: { submittedAt: data.submitted_at, textContent: data.text } };
  },

  // -------------------------------------------------------------
  // ANNOUNCEMENTS
  // -------------------------------------------------------------

  async getAnnouncements(): Promise<Announcement[]> {
    return [];
  },

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------

  async getNotifications(studentId: string): Promise<StudentNotification[]> {
    const { data } = await ApiClient.request<any>('/notifications/');
    return (data.results || data).map((n: any) => ({ id: String(n.id), studentId, type: 'announcement', title: n.title, message: n.message, linkTo: '', createdAt: n.created_at, read: !!n.read_at }));
  },

  async createNotification(payload: Omit<StudentNotification, 'id' | 'createdAt' | 'read'>): Promise<StudentNotification> {
    throw new Error('Creating notifications is restricted to server-side events.');
  },

  async markNotificationAsRead(id: string): Promise<void> {
    await ApiClient.request(`/notifications/${id}/read/`, { method: 'POST' });
  },

  async markAllNotificationsAsRead(studentId: string): Promise<void> {
    throw new Error('Bulk notification updates are not supported by the backend.');
  },

  // -------------------------------------------------------------
  // GROUP & COURSE
  // -------------------------------------------------------------

  async getGroupDetails(groupId: string): Promise<{ group: Group | null; course: Course | null; classmates: Partial<Student>[] }> {
    const me = await ApiClient.request<any>('/auth/me/');
    const { data } = await ApiClient.request<any>(`/students/${me.data.id}/group-profile/`);
    const g = data.group;
    return { group: g ? { id: String(g.id), name: g.name, courseId: String(g.course), courseName: g.course_name, teacherId: String(g.teacher), teacherName: g.teacher_name, studentsCount: g.enrollments?.length || 0, maxStudents: 0, schedule: JSON.stringify(g.schedule), room: '', status: g.active ? 'active' : 'archived', startDate: g.start_date, studentIds: (g.enrollments || []).map((e: any) => String(e.student)) } : null,
      course: data.course ? { id: String(data.course.id), name: data.course.name, code: '', description: data.course.description, durationMonths: data.course.duration_months, monthlyPrice: Number(data.course.monthly_fee), studentsCount: 0, groupsCount: 0, status: data.course.active ? 'active' : 'inactive', category: '' } : null,
      classmates: data.classmates || [] };

  },

  // -------------------------------------------------------------
  // PAYMENTS (READ-ONLY FOR STUDENT)
  // -------------------------------------------------------------

  async getStudentPayments(studentId: string): Promise<{
    payments: Payment[];
    monthlyFee: number;
    status: string;
  }> {
    const { data } = await ApiClient.request<any>('/payments/');
    const payments = (data.results || data).map((p: any) => ({ id: String(p.id), studentId, studentPublicId: '', studentName: '', courseName: '', groupName: '', amount: Number(p.amount), method: p.method, date: p.created_at, status: p.status === 'approved' ? 'paid' : p.status === 'pending' ? 'pending' : 'overdue', note: p.notes, receiptNumber: p.reference, receiptImage: p.receipt }));
    const { data: profile } = await ApiClient.request<any>('/auth/me/');
    const groupProfile = await ApiClient.request<any>(`/students/${profile.id}/group-profile/`);
    return { payments: payments.filter((p: any) => String(p.studentId) === String(profile.id)), monthlyFee: Number(groupProfile.data.group?.enrollments?.find((e: any) => String(e.student) === String(profile.id))?.monthly_fee || 0), status: profile.tuition_restricted ? 'restricted' : 'active' };
  }
};
