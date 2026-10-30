import {
  User,
  Course,
  Teacher,
  Group,
  Student,
  Payment,
  ShopProduct,
  ShopOrder,
  NotificationItem,
  DashboardData,
  StudentCredentials,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

class ApiService {
  private accessToken: string | null = null;
  private refreshTokenVal: string | null = null;

  constructor() {
    this.accessToken = sessionStorage.getItem('avlod_access_token') || localStorage.getItem('avlod_access_token');
    this.refreshTokenVal = sessionStorage.getItem('avlod_refresh_token') || localStorage.getItem('avlod_refresh_token');
  }

  public setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshTokenVal = refresh;
    sessionStorage.setItem('avlod_access_token', access);
    sessionStorage.setItem('avlod_refresh_token', refresh);
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshTokenVal = null;
    sessionStorage.removeItem('avlod_access_token');
    sessionStorage.removeItem('avlod_refresh_token');
    localStorage.removeItem('avlod_access_token');
    localStorage.removeItem('avlod_refresh_token');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    this.accessToken =
      sessionStorage.getItem('avlod_access_token') ||
      localStorage.getItem('avlod_access_token') ||
      this.accessToken;
    this.refreshTokenVal =
      sessionStorage.getItem('avlod_refresh_token') ||
      localStorage.getItem('avlod_refresh_token') ||
      this.refreshTokenVal;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration
    if (response.status === 401 && this.refreshTokenVal && !endpoint.includes('/auth/token/refresh/')) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText || 'An unexpected error occurred.' };
      }
      const message = errorData.detail || errorData.message || (typeof errorData === 'string' ? errorData : 'Request failed');
      const error: any = new Error(message);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshTokenVal) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshTokenVal }),
      });
      if (!res.ok) {
        this.clearTokens();
        return false;
      }
      const data = await res.json();
      if (data.access) {
        this.accessToken = data.access;
        sessionStorage.setItem('avlod_access_token', data.access);
        if (data.refresh) {
          this.refreshTokenVal = data.refresh;
          sessionStorage.setItem('avlod_refresh_token', data.refresh);
        }
        return true;
      }
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // ---------------- AUTH ----------------
  async loginStaff(username: string, password: string): Promise<{ access: string; refresh: string; user: User }> {
    const data = await this.request<{ access: string; refresh: string; user: User }>('/auth/staff/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setTokens(data.access, data.refresh);
    return data;
  }

  async loginStudent(student_id: string, password: string): Promise<{ access: string; refresh: string; user: User }> {
    const data = await this.request<{ access: string; refresh: string; user: User }>('/auth/student/login/', {
      method: 'POST',
      body: JSON.stringify({ student_id, password }),
    });
    this.setTokens(data.access, data.refresh);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me/');
  }

  async updateProfile(profileData: { full_name?: string; email?: string; phone?: string }): Promise<User> {
    const current = await this.getMe();
    const [first_name, ...last] = (profileData.full_name || current.full_name || '').split(' ');
    return this.request<User>('/auth/me/', { method: 'PATCH', body: JSON.stringify({ first_name, last_name: last.join(' '), email: profileData.email, phone: profileData.phone }) });
  }

  async changePassword(old_password: string, new_password: string): Promise<{ detail: string }> {
    return this.request<{ detail: string }>('/auth/password/change/', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password }),
    });
  }

  // ---------------- DASHBOARD ----------------
  async getAdminDashboard(): Promise<DashboardData> {
    return this.request<DashboardData>('/dashboard/');
  }

  // ---------------- COURSES ----------------
  async getCourses(params?: { search?: string; status?: string }): Promise<{ count: number; results: Course[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('active', params.status === 'active' ? 'true' : 'false');
    const page = await this.request<{ count: number; results: any[] }>(`/courses/?${query.toString()}`);
    return { count: page.count, results: page.results.map(c => ({ ...c, default_monthly_fee: Number(c.monthly_fee), status: c.active ? 'active' : 'archived' })) };
  }

  async createCourse(courseData: Partial<Course>): Promise<Course> {
    return this.request<Course>('/courses/', {
      method: 'POST',
      body: JSON.stringify({ name: courseData.name, description: courseData.description, duration_months: courseData.duration_months, monthly_fee: courseData.default_monthly_fee, active: courseData.status !== 'archived' }),
    });
  }

  async getCourse(id: string): Promise<Course> {
    return this.request<Course>(`/courses/${id}/`);
  }

  async updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
    return this.request<Course>(`/courses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ name: courseData.name, description: courseData.description, duration_months: courseData.duration_months, monthly_fee: courseData.default_monthly_fee, active: courseData.status === undefined ? undefined : courseData.status !== 'archived' }),
    });
  }

  // ---------------- TEACHERS ----------------
  async getTeachers(): Promise<{ count: number; results: Teacher[] }> {
    const response = await this.request<{ count: number; results: any[] }>('/students/?role=teacher');
    return { count: response.count, results: response.results.map(user => ({ ...user, full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim(), active_groups: 0 })) };
  }

  async updateUser(id: string, payload: Record<string, unknown>, role?: 'teacher' | 'student'): Promise<any> {
    const suffix = role ? `?role=${role}` : '';
    return this.request<any>(`/students/${id}/${suffix}`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  async createTeacher(payload: { first_name: string; last_name: string; username: string; phone?: string; password: string; confirm_password: string }): Promise<User> {
    return this.request<User>('/students/', { method: 'POST', body: JSON.stringify({ role: 'teacher', ...payload }) });
  }

  // ---------------- STUDENTS ----------------
  async getStudents(params?: {
    search?: string;
    course_id?: string;
    group_id?: string;
    payment_status?: string;
    account_status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ count: number; page: number; page_size: number; total_pages: number; results: Student[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.group_id) query.append('enrollments__group', params.group_id);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());
    const page = await this.request<{ count: number; next: string | null; previous: string | null; results: any[] }>(`/students/?${query.toString()}`);
    const results = page.results.map(user => { const enrollment = user.enrollments?.[0]; return { ...user, full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim(), course_id: enrollment?.course, course_name: enrollment?.course_name || '', group_id: enrollment?.group ?? null, group_name: enrollment?.group_name || '', monthly_fee: Number(enrollment?.monthly_fee || 0), amount_paid: 0, balance_due: 0, payment_status: 'unpaid', account_status: !user.is_active ? 'deactivated' : user.tuition_restricted ? 'restricted' : 'active', coin_balance: 0, attendance_percentage: 0 }; });
    return { count: page.count, page: params?.page || 1, page_size: params?.page_size || 25, total_pages: Math.max(1, Math.ceil(page.count / (params?.page_size || 25))), results };
  }

  async createStudent(payload: {
    first_name: string;
    last_name: string;
    phone?: string;
    course_id: string;
    group_id?: string;
    monthly_fee?: number;
  }): Promise<{ student: Student; credentials: StudentCredentials }> {
    if (!payload.group_id) throw new Error('Choose a group before creating the student.');
    const result = await this.request<any>('/students/', {
      method: 'POST',
      body: JSON.stringify({ first_name: payload.first_name, last_name: payload.last_name, phone: payload.phone, course: payload.course_id, group: payload.group_id, monthly_fee: payload.monthly_fee }),
    });
    const { initial_password, ...student } = result;
    return { student: { ...student, full_name: `${student.first_name} ${student.last_name}`.trim() }, credentials: { student_id: student.student_id, initial_password, notice: 'Save these credentials securely; the password will not be shown again.' } };
  }

  async getStudent(id: string): Promise<Student> {
    const u: any = await this.request<any>(`/students/${id}/`);
    const e = u.enrollments?.[0];
    return { ...u, full_name: u.full_name || `${u.first_name} ${u.last_name}`.trim(), course_id: e?.course || '', course_name: e?.course_name || '', group_id: e?.group ?? null, group_name: e?.group_name || '', monthly_fee: Number(e?.monthly_fee || 0), payment_status: u.tuition_restricted ? 'restricted' : 'unpaid', account_status: !u.is_active ? 'deactivated' : u.tuition_restricted ? 'restricted' : 'active', coin_balance: Number(e?.coin_balance || 0), amount_paid: 0, balance_due: 0, attendance_percentage: 0 } as Student;
  }

  async updateStudent(id: string, payload: Partial<Student>): Promise<Student> {
    const profile: Record<string, unknown> = { first_name: payload.first_name, last_name: payload.last_name, phone: payload.phone };
    if (payload.account_status !== undefined) profile.is_active = payload.account_status !== 'deactivated';
    const user = await this.request<any>(`/students/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
    return { ...payload, ...user, full_name: `${user.first_name} ${user.last_name}`.trim() } as Student;
  }

  async overrideStudentStatus(id: string, action: 'activate' | 'restrict' | 'deactivate', audit_reason: string): Promise<{ student: Student; message: string }> {
    if (action === 'restrict') throw new Error('Manual tuition restriction is not exposed by the backend.');
    const student = await this.request<any>(`/students/${id}/`, { method: 'PATCH', body: JSON.stringify({ is_active: action === 'activate' }) });
    return { student, message: `Account ${action}d. ${audit_reason}` };
  }

  // ---------------- GROUPS ----------------
  async getGroups(params?: { search?: string; course_id?: string; teacher_id?: string; status?: string }): Promise<{ count: number; results: Group[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.course_id) query.append('course', params.course_id);
    if (params?.teacher_id) query.append('teacher', params.teacher_id);
    if (params?.status) query.append('active', params.status === 'active' ? 'true' : 'false');
    const page = await this.request<{ count: number; results: any[] }>(`/groups/?${query.toString()}`);
    return { count: page.count, results: page.results.map(group => ({ ...group, course_id: group.course, teacher_id: group.teacher, student_ids: group.enrollments?.map((e: any) => String(e.student)) || [], students_count: group.enrollments?.length || 0 })) };
  }

  async createGroup(payload: {
    name: string;
    course_id: string;
    teacher_id: string;
    student_ids: string[];
    start_date: string;
    schedule: string;
  }): Promise<Group> {
    const group = await this.request<any>('/groups/', {
      method: 'POST',
      body: JSON.stringify({ name: payload.name, course: payload.course_id, teacher: payload.teacher_id, student_ids: payload.student_ids.map(Number), start_date: payload.start_date, schedule: { text: payload.schedule } }),
    });
    return { ...group, course_id: group.course, teacher_id: group.teacher, student_ids: payload.student_ids };
  }

  async getGroup(id: string): Promise<Group & { students: Student[] }> {
    const [group, students] = await Promise.all([this.request<any>(`/groups/${id}/`), this.request<any[]>(`/groups/${id}/students/`)]);
    return { ...group, course_id: group.course, teacher_id: group.teacher, student_ids: students.map(s => String(s.id)), students };
  }

  async updateGroup(id: string, payload: Partial<Group>): Promise<Group> {
    const normalized: any = { ...payload };
    if (payload.course_id) normalized.course = payload.course_id;
    if (payload.teacher_id) normalized.teacher = payload.teacher_id;
    if (typeof payload.schedule === 'string') normalized.schedule = { text: payload.schedule };
    if (payload.status !== undefined) normalized.active = payload.status === 'active';
    delete normalized.course_id; delete normalized.teacher_id; delete normalized.status;
    const group = await this.request<any>(`/groups/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(normalized),
    });
    return { ...group, course_id: group.course, teacher_id: group.teacher };
  }

  async addStudentsToGroup(groupId: string, studentIds: string[]): Promise<{ group_id: string; enrolled_count: number; detail: string }> {
    return this.request<{ group_id: string; enrolled_count: number; detail: string }>('/groups/enrollments/', { method: 'POST', body: JSON.stringify({ group: Number(groupId), student_ids: studentIds.map(Number) }) });
  }

  async removeStudentFromGroup(groupId: string, studentId: string): Promise<{ detail: string }> {
    return this.request<{ detail: string }>('/groups/enrollments/remove/', { method: 'POST', body: JSON.stringify({ group: Number(groupId), student: Number(studentId) }) });
  }

  // ---------------- PAYMENTS ----------------
  async getPayments(params?: {
    search?: string;
    student_id?: string;
    method?: string;
    verification_status?: string;
  }): Promise<{ count: number; results: Payment[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.student_id) query.append('student_id', params.student_id);
    if (params?.method) query.append('method', params.method);
    if (params?.verification_status) query.append('status', params.verification_status);
    const page = await this.request<{ count: number; results: any[] }>(`/payments/?${query.toString()}`);
    return { count: page.count, results: page.results.map(p => ({ ...p, student_id: String(p.student), student_code: '', student_name: p.student_name || '', payment_method: p.method, payment_date: p.created_at, verification_status: p.status, payment_status: p.status === 'approved' ? 'confirmed' : p.status === 'rejected' ? 'failed' : 'unverified', registered_by: p.received_by || '', reviewed_by: p.reviewed_by || null, receipt_url: p.receipt, note: p.notes })) };
  }

  async getPendingVerifications(): Promise<{ count: number; results: Payment[] }> {
    const page = await this.request<{ count: number; results: any[] }>('/payments/verification-queue/');
    return { count: page.count, results: page.results.map(p => ({ ...p, student_id: String(p.student), student_code: '', student_name: p.student_name || '', payment_method: p.method, payment_date: p.created_at, verification_status: p.status, payment_status: 'unverified', registered_by: p.received_by || '', reviewed_by: p.reviewed_by || null, receipt_url: p.receipt, note: p.notes })) };
  }

  async registerPayment(payload: {
    student_id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    note?: string;
    receipt_url?: string | null;
  }): Promise<Payment> {
    const created = await this.request<any>('/payments/', {
      method: 'POST',
      body: JSON.stringify({ student: Number(payload.student_id), amount: payload.amount, method: payload.payment_method, notes: payload.note || '' }),
    });
    return { ...created, student_id: String(created.student), student_code: '', student_name: '', payment_method: created.method, payment_date: created.created_at, verification_status: created.status, payment_status: created.status === 'approved' ? 'confirmed' : 'unverified', registered_by: created.received_by || '', reviewed_by: created.reviewed_by || null, receipt_url: created.receipt, note: created.notes };
  }

  async verifyPayment(id: string, action: 'approve' | 'reject', reason?: string): Promise<{ payment: Payment; student?: Student }> {
    const p: any = await this.request<any>(`/payments/${id}/${action === 'approve' ? 'approve' : 'reject'}/`, { method: 'POST', body: JSON.stringify({ reason }) });
    const payment = { ...p, student_id: String(p.student), student_code: '', student_name: '', payment_method: p.method, payment_date: p.created_at, verification_status: p.status, payment_status: p.status === 'approved' ? 'confirmed' : p.status === 'rejected' ? 'failed' : 'unverified', registered_by: p.received_by || '', reviewed_by: p.reviewed_by || null, receipt_url: p.receipt, note: p.notes } as Payment;
    return { payment };
  }

  // ---------------- SHOP ----------------
  async getProducts(params?: { search?: string }): Promise<{ count: number; results: ShopProduct[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    const page = await this.request<{ count: number; results: any[] }>(`/shop/products/?${query.toString()}`);
    return { count: page.count, results: page.results.map(p => ({ ...p, is_active: p.active, image_url: p.image, price_coins: p.coin_price, stock_quantity: p.stock })) };
  }

  async createProduct(payload: Partial<ShopProduct>): Promise<ShopProduct> {
    const data = { ...payload, active: (payload as any).is_active, coin_price: (payload as any).price_coins, stock: (payload as any).stock_quantity };
    delete (data as any).is_active; delete (data as any).price_coins; delete (data as any).stock_quantity;
    return this.request<ShopProduct>('/shop/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, payload: Partial<ShopProduct>): Promise<ShopProduct> {
    const data = { ...payload, active: (payload as any).is_active, coin_price: (payload as any).price_coins, stock: (payload as any).stock_quantity };
    delete (data as any).is_active; delete (data as any).price_coins; delete (data as any).stock_quantity;
    return this.request<ShopProduct>(`/shop/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getShopOrders(params?: { search?: string; status?: string }): Promise<{ count: number; results: ShopOrder[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    const page = await this.request<{ count: number; results: any[] }>(`/shop/orders/?${query.toString()}`);
    return { count: page.count, results: page.results.map(o => ({ ...o, student_id: String(o.student), student_name: o.student_name || '', student_code: '', product_id: String(o.product), product_name: o.product_name || '', total_coins: o.unit_price * o.quantity, order_number: String(o.id), order_date: o.created_at, status: ({ pending: 'pending', approved: 'processing', rejected: 'cancelled', fulfilled: 'completed' } as any)[o.status] || o.status })) };
  }

  async updateOrderStatus(id: string, status: string, admin_notes?: string): Promise<ShopOrder> {
    throw new Error('Order status changes are not implemented by the backend; this endpoint is read-only.');
  }

  // ---------------- NOTIFICATIONS ----------------
  async getNotifications(): Promise<{ count: number; unread_count: number; results: NotificationItem[] }> {
    const page = await this.request<{ count: number; results: any[] }>('/notifications/');
    return { count: page.count, unread_count: page.results.filter(n => !n.read_at).length, results: page.results.map(n => ({ ...n, is_read: !!n.read_at, type: n.kind })) };
  }

  async markNotificationRead(id: string): Promise<{ detail: string }> {
    return this.request<{ detail: string }>(`/notifications/${id}/read/`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead(): Promise<{ detail: string }> {
    throw new Error('Bulk notification marking is not exposed by the current backend API.');
  }

  // ---------------- FILE UPLOADS ----------------
  async uploadFile(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    throw new Error(`Direct upload endpoint is not exposed by the backend (file: ${file.name}).`);
  }
}

export const api = new ApiService();
