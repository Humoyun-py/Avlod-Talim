import {
  CoinTransaction,
  Course,
  DirectorSettings,
  Group,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Product,
  ShopOrder,
  Student,
  Teacher,
  TeacherSalaryRecord
} from '../types';
import { api } from '../../../admin/src/services/api';
import { apiClient } from '../../../teacher/src/services/apiClient';

const pagedApi = async (url: string) => {
  let next: string | null = url;
  const rows: any[] = [];
  let first: any = null;
  while (next) {
    const page: any = (await apiClient.get<any>(next)).data;
    first ||= page;
    if (Array.isArray(page.results)) { rows.push(...page.results); next = page.next ? new URL(page.next).pathname + new URL(page.next).search : null; }
    else { return page; }
  }
  return { ...first, results: rows };
};

const mapDirectorStudent = (u: any): Student => { const e = u.enrollments?.[0]; return { id: String(u.id), studentId: u.student_id, firstName: u.first_name, lastName: u.last_name, fullName: u.full_name, phone: u.phone || '', courseId: e ? String(e.course) : '', courseName: e?.course_name || '', groupId: e ? String(e.group) : '', groupName: e?.group_name || '', teacherName: e?.teacher_name || '', monthlyPayment: Number(e?.monthly_fee || 0), paymentStatus: u.tuition_restricted ? 'blocked' : 'pending', attendanceRate: 0, coins: 0, status: u.is_active ? 'active' : 'blocked', createdAt: '' }; };
const mapDirectorCourse = (c: any): Course => ({ id: String(c.id), name: c.name, code: '', description: c.description, durationMonths: c.duration_months, monthlyPrice: Number(c.monthly_fee), studentsCount: 0, groupsCount: 0, status: c.active ? 'active' : 'inactive', category: '' });
const mapDirectorGroup = (g: any): Group => ({ id: String(g.id), name: g.name, courseId: String(g.course), courseName: g.course_name || '', teacherId: String(g.teacher), teacherName: g.teacher_name || '', studentsCount: g.enrollments?.length || 0, maxStudents: 0, schedule: JSON.stringify(g.schedule), room: '', status: g.active ? 'active' : 'archived', startDate: g.start_date, studentIds: (g.enrollments || []).map((e: any) => String(e.student)) });

export const DirectorService = {
  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    const page = await api.getTeachers();
    const groups = await this.getGroups();
    return page.results.map((u: any) => { const owned = groups.filter(g => g.teacherId === String(u.id)); return { id: String(u.id), firstName: u.first_name, lastName: u.last_name, fullName: u.full_name, phone: u.phone || '', username: u.username, groupsCount: owned.length, studentsCount: owned.reduce((sum, group) => sum + group.studentsCount, 0), status: u.is_active ? 'active' : 'blocked', createdAt: '', subject: '', monthlySalary: 0, salaryPercentage: 40, attendanceRate: 0 }; });
  },

  async createTeacher(data: Omit<Teacher, 'id' | 'createdAt' | 'groupsCount' | 'studentsCount' | 'attendanceRate' | 'monthlySalary'> & { password: string; confirmPassword: string }): Promise<Teacher> {
    const password = data.password; const confirm_password = data.confirmPassword;
    if (!password || password !== confirm_password) throw new Error('Matching password and confirmation are required.');
    const created = await api.createTeacher({ first_name: data.firstName, last_name: data.lastName, username: data.username, phone: data.phone, password, confirm_password });
    return { ...data, id: String(created.id), createdAt: '', groupsCount: 0, studentsCount: 0, attendanceRate: 0, monthlySalary: 0 };
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher> {
    const [first_name, ...last] = (updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`).trim().split(' ');
    await api.updateUser(id, { first_name, last_name: last.join(' '), phone: updates.phone, is_active: updates.status === 'blocked' ? false : updates.status === 'active' ? true : undefined }, 'teacher');
    return { ...(await this.getTeachers()).find(t => t.id === id)!, ...updates };
  },

  async deleteTeacher(id: string): Promise<void> {
    throw new Error('Use the Director activation controls; teacher deletion is not supported.');
  },

  // Students
  async getStudents(): Promise<Student[]> {
    const page = await api.getStudents({ page_size: 100 });
    const paymentPage = await pagedApi('/payments/');
    const currentMonth = new Date().toISOString().slice(0, 7);
    const paidByStudent = new Map<string, number>();
    for (const payment of paymentPage.results || []) if (payment.status === 'approved' && payment.created_at?.startsWith(currentMonth)) paidByStudent.set(String(payment.student), (paidByStudent.get(String(payment.student)) || 0) + Number(payment.amount));
    return page.results.map((u: any) => { const student = mapDirectorStudent(u); student.coins = Number(u.enrollments?.[0]?.coin_balance || 0); student.paymentStatus = student.status === 'blocked' ? 'blocked' : (paidByStudent.get(student.id) || 0) >= student.monthlyPayment && student.monthlyPayment > 0 ? 'paid' : 'pending'; return student; });
  },

  async createStudent(payload: {
    firstName: string;
    lastName: string;
    phone: string;
    courseId?: string;
    courseName?: string;
    groupId?: string;
    groupName?: string;
    teacherName?: string;
    monthlyPayment: number;
    avatarUrl?: string;
  }): Promise<{ student: Student; generatedId: string; generatedPassword: string }> {
    if (!payload.groupId || !payload.courseId) throw new Error('Course and group must be selected before creating a student.');
    const result = await api.createStudent({ first_name: payload.firstName, last_name: payload.lastName, phone: payload.phone, course_id: payload.courseId, group_id: payload.groupId, monthly_fee: payload.monthlyPayment });
    return { student: mapDirectorStudent(result.student), generatedId: result.credentials.student_id, generatedPassword: result.credentials.initial_password };
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const data = await api.updateUser(id, { first_name: updates.firstName, last_name: updates.lastName, phone: updates.phone, is_active: updates.status === 'blocked' ? false : updates.status === 'active' ? true : undefined });
    return mapDirectorStudent(data);
  },

  async deleteStudent(id: string): Promise<void> {
    await api.updateUser(id, { is_active: false }, 'student');
  },

  async getCoinTransactions(): Promise<CoinTransaction[]> {
    const { data } = await apiClient.get('/coins/');
    return (data.transactions || []).map((tx: any) => ({ id: String(tx.id), studentId: String(tx.student_id), studentPublicId: '', studentName: '', groupName: '', amount: Math.abs(tx.amount), operation: tx.amount < 0 ? 'subtract' : 'add', previousBalance: 0, newBalance: 0, reason: tx.reason, date: tx.created_at }));

  },

  async awardStudentCoins(
    studentId: string,
    amount: number,
    operation: 'add' | 'subtract' | 'set' = 'add',
    reason?: string
  ): Promise<{ student: Student; newTotal: number }> {
    if (operation !== 'add') throw new Error('The ledger supports coin awards only; deductions and balance replacement are disabled.');
    const student = await this.getStudents().then(rows => rows.find(s => s.id === studentId || s.studentId === studentId));
    if (!student) throw new Error('Student not found');
    const { data } = await apiClient.post('/coins/', { student: Number(student.id), amount, reason: reason || 'Director award' });
    student.coins = data.balance;
    return { student, newTotal: data.balance };
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    const page = await api.getGroups(); return page.results.map(mapDirectorGroup);
  },

  async createGroup(data: Omit<Group, 'id' | 'studentsCount'> & { selectedStudentIds?: string[] }): Promise<Group> {
    const created = await api.createGroup({ name: data.name, course_id: data.courseId, teacher_id: data.teacherId, student_ids: (data.selectedStudentIds || data.studentIds || []).map(String), start_date: data.startDate, schedule: data.schedule });
    return { ...data, id: String(created.id), studentsCount: data.selectedStudentIds?.length || data.studentIds?.length || 0 };
  },

  async updateGroup(id: string, updates: Partial<Group> & { selectedStudentIds?: string[] }): Promise<Group> {
    if (updates.selectedStudentIds) {
      await api.addStudentsToGroup(id, updates.selectedStudentIds);
    }
    await api.updateGroup(id, { name: updates.name, course_id: updates.courseId, teacher_id: updates.teacherId, start_date: updates.startDate, schedule: updates.schedule } as any);
    const group = (await this.getGroups()).find(g => g.id === id); if (!group) throw new Error('Group not found'); return group;
  },

  async deleteGroup(id: string): Promise<void> {
    await api.updateGroup(id, { active: false } as any);
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    const page = await api.getCourses(); const groups = await this.getGroups();
    return page.results.map((c: any) => ({ ...mapDirectorCourse(c), groupsCount: groups.filter(g => g.courseId === String(c.id)).length, studentsCount: groups.filter(g => g.courseId === String(c.id)).reduce((n, g) => n + g.studentsCount, 0) }));
  },

  async createCourse(data: Omit<Course, 'id' | 'studentsCount' | 'groupsCount'>): Promise<Course> {
    const created = await api.createCourse({ name: data.name, description: data.description, duration_months: data.durationMonths, default_monthly_fee: data.monthlyPrice, status: data.status === 'active' ? 'active' : 'archived' } as any);
    return mapDirectorCourse(created);
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const updated = await api.updateCourse(id, { name: updates.name, description: updates.description, duration_months: updates.durationMonths, default_monthly_fee: updates.monthlyPrice, status: updates.status === 'active' ? 'active' : updates.status === 'inactive' ? 'archived' : undefined } as any);
    return mapDirectorCourse(updated);
  },

  async deleteCourse(id: string): Promise<void> {
    await api.updateCourse(id, { status: 'archived' } as any);
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    const payload = await pagedApi('/payments/'); const rows = payload.results || payload;
    const students = await this.getStudents();
    return rows.map((p: any) => { const s = students.find(x => x.id === String(p.student)); return { id: String(p.id), studentId: String(p.student), studentPublicId: s?.studentId || '', studentName: s?.fullName || '', courseName: s?.courseName || '', groupName: s?.groupName || '', amount: Number(p.amount), method: ({ cash: 'Naqd', click: 'Click', payme: 'Payme', uzum: 'Uzum' } as any)[p.method] || 'Naqd', receiptNumber: p.reference || '', date: p.created_at, status: p.status === 'approved' ? 'paid' : p.status === 'rejected' ? 'overdue' : 'pending', note: p.notes }; });
  },

  async addPayment(data: {
    studentId: string;
    studentPublicId: string;
    studentName: string;
    courseName: string;
    groupName: string;
    amount: number;
    method: PaymentMethod;
    receiptNumber?: string;
    receiptImage?: string;
    note?: string;
  }): Promise<Payment> {
    if (data.method !== 'Naqd') throw new Error('Online payment receipt upload is not available in this panel yet.');
    // 1. Validate positive payment amount
    if (!data.amount || data.amount <= 0) {
      throw new Error('To‘lov summasi 0 dan katta musbat son bo‘lishi lozim');
    }

    // 2. Validate receipt for non-cash payment
    if (data.method !== 'Naqd') {
      if (!data.receiptNumber?.trim() && !data.receiptImage?.trim()) {
        throw new Error('Elektron to‘lovlar (Click, Payme, Uzum) uchun haqiqiy chek raqami yoki rasmi talab etiladi');
      }
    }

    const paymentMethod: Record<PaymentMethod, string> = { Naqd: 'cash', Click: 'click', Payme: 'payme', Uzum: 'uzum' };
    const created = await api.registerPayment({ student_id: data.studentId, amount: data.amount, payment_method: paymentMethod[data.method], payment_date: new Date().toISOString().slice(0, 10), note: data.note || '' });
    const status: PaymentStatus = created.verification_status === 'approved' ? 'paid' : created.verification_status === 'rejected' ? 'overdue' : 'pending';
    return { id: String(created.id), studentId: data.studentId, studentPublicId: data.studentPublicId, studentName: data.studentName, courseName: data.courseName, groupName: data.groupName, amount: data.amount, method: data.method, receiptNumber: data.receiptNumber, date: created.payment_date, status, note: data.note };
  },

  // Teacher Salaries (Calculated dynamically or retrieved)
  async getSalaries(): Promise<TeacherSalaryRecord[]> {
    const rows = await pagedApi('/salaries/');
    return rows.map((s: any) => ({ id: String(s.period_id), teacherId: String(s.teacher_id), teacherName: s.teacher, subject: '', studentsCount: 0, paidStudentsCount: 0, totalRevenue: Number(s.eligible_tuition), teacherPercentage: Number(s.percentage), calculatedSalary: Number(s.calculated_salary), paidAmount: Number(s.paid), remainingAmount: Number(s.remaining), finalized: s.finalized, status: Number(s.remaining) <= 0 ? 'paid' : 'pending', month: `${s.year}-${String(s.month).padStart(2, '0')}`, studentBreakdown: [], history: [] } as any));
  },

  async markSalaryPaid(id: string): Promise<TeacherSalaryRecord> {
    const salaries = await pagedApi(`/salaries/?teacher=${id.split('-')[0]}`);
    const period = salaries.find((row: any) => String(row.period_id) === id);
    if (!period) throw new Error('Salary period not found.');
    if (!period.finalized) await apiClient.post('/salaries/', { teacher: period.teacher_id, year: period.year, month: period.month });
    const amount = Number(period.remaining);
    if (amount > 0) await apiClient.post('/salaries/payments/', { period: period.period_id, amount, reference: `salary-${period.period_id}` });
    return (await this.getSalaries()).find(row => row.id === id)!;
  },

  // Shop Products
  async getProducts(): Promise<Product[]> {
    const payload = await pagedApi('/shop/products/'); const rows = payload.results || payload;
    return rows.map((p: any) => ({ id: String(p.id), name: p.name, description: p.description || '', coinPrice: Number(p.coin_price), imageUrl: p.image || '', stock: p.stock, status: !p.active || p.stock === 0 ? 'out_of_stock' : p.stock < 5 ? 'low_stock' : 'in_stock', category: '', createdAt: p.created_at }));
  },

  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const p = await api.createProduct({ name: data.name, description: data.description, coin_price: data.coinPrice, stock: data.stock, active: data.status !== 'out_of_stock' } as any);
    return { ...data, id: String(p.id), createdAt: p.created_at };
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const p = await api.updateProduct(id, { name: updates.name, description: updates.description, coin_price: updates.coinPrice, stock: updates.stock, active: updates.status ? updates.status !== 'out_of_stock' : undefined } as any);
    return { ...(await this.getProducts()).find(x => x.id === id)!, ...updates, id: String(p.id) };
  },

  async deleteProduct(id: string): Promise<void> {
    await api.updateProduct(id, { active: false } as any);
  },

  // Shop Orders
  async getOrders(): Promise<ShopOrder[]> {
    const payload = await pagedApi('/shop/orders/'); const rows = payload.results || payload;
    return rows.map((o: any) => ({ id: String(o.id), orderNumber: String(o.id), studentId: String(o.student), studentName: o.student_name, studentPublicId: '', productId: String(o.product), productName: o.product_name, productImage: '', coinAmount: Number(o.unit_price) * o.quantity, date: o.created_at, status: o.status === 'fulfilled' ? 'Completed' : o.status === 'approved' ? 'Accepted' : o.status === 'rejected' ? 'Rejected' : 'Pending' }));
  },

  async updateOrderStatus(id: string, status: ShopOrder['status']): Promise<ShopOrder> {
    throw new Error('Order status changes are not exposed by the backend yet.');
  },

  // Director Settings
  async getSettings(): Promise<DirectorSettings> {
    throw new Error('Organization settings are not stored by the backend yet.');
  },

  async updateSettings(updates: Partial<DirectorSettings>): Promise<DirectorSettings> {
    throw new Error('Organization settings are not stored by the backend yet.');
  }
};
