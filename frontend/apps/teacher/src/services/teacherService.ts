import {
  User,
  Group,
  Student,
  Lesson,
  AttendanceRecord,
  Homework,
  HomeworkSubmission,
  Notification,
  Announcement,
  TeacherSalaryRecord,
  DashboardStats,
  AttendanceStatus,
  CoinTransaction,
  ShopItem,
} from '../types';
import {
  INITIAL_TEACHER,
  INITIAL_GROUPS,
  INITIAL_STUDENTS,
  INITIAL_LESSONS,
  INITIAL_ATTENDANCE,
  INITIAL_HOMEWORK,
  INITIAL_SUBMISSIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SALARY_RECORDS,
  INITIAL_COIN_TRANSACTIONS,
  INITIAL_SHOP_ITEMS,
} from './mockData';
import { apiClient } from './apiClient';

const paged = async <T,>(url: string): Promise<T[]> => {
  const { data } = await apiClient.get(url);
  return Array.isArray(data) ? data : data.results || [];
};
const mapGroup = (g: any): Group => ({ id: String(g.id), name: g.name, course_name: g.course_name || '', level: '', student_count: g.enrollments?.length || 0, days: [], start_time: '', end_time: '', room: '', status: g.active ? 'active' : 'paused', start_date: g.start_date, end_date: g.end_date || '' });
const mapStudent = (s: any, group?: any): Student => ({ id: String(s.id), student_code: s.student_id || '', full_name: s.full_name || `${s.first_name} ${s.last_name}`.trim(), group_id: String(group?.id || ''), group_name: group?.name || '', course_name: group?.course_name || '', phone: s.phone || '', enrollment_status: s.is_active ? 'active' : 'graduated', attendance_rate: 0, total_lessons: 0, attended_lessons: 0, missed_lessons: 0, late_lessons: 0, coins_balance: 0 });
const mapLesson = (l: any): Lesson => ({ id: String(l.id), group_id: String(l.group), group_name: l.group_name || '', course_name: l.course_name || '', date: l.scheduled_date || '', start_time: '', end_time: '', room: '', status: l.status === 'cancelled' ? 'cancelled' : l.status === 'completed' ? 'completed' : 'planned', topic: l.title, topic_id: l.topic_id, attendance_submitted: false });

export const MAX_COIN_REWARD_LIMIT = 50;

// Frontend state store with localStorage persistence for a complete frontend-only experience
class FrontendDataStore {
  private teacher: User = { ...INITIAL_TEACHER };
  private groups: Group[] = [...INITIAL_GROUPS];
  private students: Student[] = [...INITIAL_STUDENTS];
  private lessons: Lesson[] = [...INITIAL_LESSONS];
  private attendance: AttendanceRecord[] = [...INITIAL_ATTENDANCE];
  private homework: Homework[] = [...INITIAL_HOMEWORK];
  private submissions: HomeworkSubmission[] = [...INITIAL_SUBMISSIONS];
  private notifications: Notification[] = [...INITIAL_NOTIFICATIONS];
  private announcements: Announcement[] = [...INITIAL_ANNOUNCEMENTS];
  private salary: TeacherSalaryRecord[] = [...INITIAL_SALARY_RECORDS];
  private coinTransactions: CoinTransaction[] = [...INITIAL_COIN_TRANSACTIONS];
  private shopItems: ShopItem[] = [...INITIAL_SHOP_ITEMS];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem('avlod_frontend_store_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.teacher) this.teacher = parsed.teacher;
        if (parsed.groups) this.groups = parsed.groups;
        if (parsed.students) this.students = parsed.students;
        if (parsed.lessons) this.lessons = parsed.lessons;
        if (parsed.attendance) this.attendance = parsed.attendance;
        if (parsed.homework) this.homework = parsed.homework;
        if (parsed.submissions) this.submissions = parsed.submissions;
        if (parsed.notifications) this.notifications = parsed.notifications;
        if (parsed.coinTransactions) this.coinTransactions = parsed.coinTransactions;
        if (parsed.shopItems) this.shopItems = parsed.shopItems;
      }
    } catch {
      // Fallback to initial seeds
    }
  }

  public save() {
    try {
      localStorage.setItem(
        'avlod_frontend_store_v3',
        JSON.stringify({
          teacher: this.teacher,
          groups: this.groups,
          students: this.students,
          lessons: this.lessons,
          attendance: this.attendance,
          homework: this.homework,
          submissions: this.submissions,
          notifications: this.notifications,
          coinTransactions: this.coinTransactions,
          shopItems: this.shopItems,
        })
      );
    } catch {
      // ignore
    }
  }

  public resetToDefault() {
    this.teacher = { ...INITIAL_TEACHER };
    this.groups = [...INITIAL_GROUPS];
    this.students = [...INITIAL_STUDENTS];
    this.lessons = [...INITIAL_LESSONS];
    this.attendance = [...INITIAL_ATTENDANCE];
    this.homework = [...INITIAL_HOMEWORK];
    this.submissions = [...INITIAL_SUBMISSIONS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.announcements = [...INITIAL_ANNOUNCEMENTS];
    this.salary = [...INITIAL_SALARY_RECORDS];
    this.coinTransactions = [...INITIAL_COIN_TRANSACTIONS];
    this.shopItems = [...INITIAL_SHOP_ITEMS];
    localStorage.removeItem('avlod_frontend_store');
  }

  public getTeacher() { return this.teacher; }
  public getGroups() { return this.groups; }
  public getStudents() { return this.students; }
  public getLessons() { return this.lessons; }
  public getAttendance() { return this.attendance; }
  public getHomework() { return this.homework; }
  public getSubmissions() { return this.submissions; }
  public getNotifications() { return this.notifications; }
  public getAnnouncements() { return this.announcements; }
  public getSalary() { return this.salary; }
  public getCoinTransactions() { return this.coinTransactions; }
  public getShopItems() { return this.shopItems; }

  public updateTeacher(data: Partial<User>) {
    this.teacher = { ...this.teacher, ...data };
    this.save();
    return this.teacher;
  }

  public addAttendanceRecords(records: AttendanceRecord[]) {
    // Avoid duplicate entries for same student and lesson
    const existingKeys = new Set(records.map(r => `${r.lesson_id}_${r.student_id}`));
    this.attendance = this.attendance.filter(r => !existingKeys.has(`${r.lesson_id}_${r.student_id}`));
    this.attendance.push(...records);

    // Update lesson attendance status
    const lessonId = records[0]?.lesson_id;
    if (lessonId) {
      const l = this.lessons.find(item => item.id === lessonId);
      if (l) {
        l.attendance_submitted = true;
      }
    }
    this.recalculateStudentStats();
    this.save();
  }

  public createLesson(data: {
    group_id: string;
    topic?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    room?: string;
  }): Lesson {
    const group = this.groups.find(g => g.id === data.group_id);
    const todayStr = new Date().toISOString().slice(0, 10);
    const newLesson: Lesson = {
      id: `lsn-${Date.now()}`,
      group_id: data.group_id,
      group_name: group?.name || 'Group',
      course_name: group?.course_name || 'Course',
      date: data.date || todayStr,
      start_time: data.start_time || '14:00',
      end_time: data.end_time || '16:00',
      room: data.room || group?.room || 'Lab 101',
      status: 'planned',
      topic: data.topic || `${group?.course_name || 'Dars'}: Yangi amaliy mashg‘ulot`,
      attendance_submitted: false,
    };
    this.lessons.unshift(newLesson);
    this.save();
    return newLesson;
  }

  public startLesson(lessonId: string) {
    const lesson = this.lessons.find(l => l.id === lessonId);
    if (!lesson) throw new Error('Dars topilmadi');
    lesson.status = 'in_progress';
    (lesson as any).started_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
    this.save();
    return lesson;
  }

  public completeLesson(lessonId: string, details: {
    topic: string;
    summary: string;
    covered_material: string;
    homework_assigned?: string;
    additional_notes?: string;
  }) {
    const lesson = this.lessons.find(l => l.id === lessonId);
    if (!lesson) throw new Error('Dars topilmadi');
    lesson.status = 'completed';
    lesson.topic = details.topic;
    lesson.summary = details.summary;
    lesson.covered_material = details.covered_material;
    lesson.homework_assigned = details.homework_assigned;
    lesson.additional_notes = details.additional_notes;
    lesson.completed_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
    lesson.completed_by = this.teacher.full_name;
    this.save();
    return lesson;
  }

  public submitVideo(lessonId: string, videoUrl: string) {
    const lesson = this.lessons.find(l => l.id === lessonId);
    if (!lesson) throw new Error('Dars topilmadi');
    lesson.video_status = 'pending_review';
    lesson.video_url = videoUrl;
    lesson.video_submitted_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
    this.save();
    return lesson;
  }

  public addHomework(data: Omit<Homework, 'id' | 'created_at' | 'submissions_count' | 'reviewed_count'>) {
    const group = this.groups.find(g => g.id === data.group_id);
    const newHw: Homework = {
      ...data,
      id: `hw-${Date.now()}`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      group_name: group?.name || 'Group',
      course_name: group?.course_name || 'Course',
      total_students: group?.student_count || 14,
      submissions_count: 0,
      reviewed_count: 0,
    };
    this.homework.unshift(newHw);
    this.save();
    return newHw;
  }

  public submitHomework(data: {
    homework_id: string;
    student_id: string;
    file_name: string;
    code_content: string;
    code_language?: string;
    file_size?: string;
    comment?: string;
  }): HomeworkSubmission {
    const student = this.students.find(s => s.id === data.student_id);
    const hw = this.homework.find(h => h.id === data.homework_id);
    const newSub: HomeworkSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      homework_id: data.homework_id,
      student_id: data.student_id,
      student_name: student?.full_name || 'Talaba',
      student_code: student?.student_code || 'AVL-0000',
      submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      file_name: data.file_name,
      file_size: data.file_size || '4.2 KB',
      code_content: data.code_content,
      code_language: data.code_language || 'python',
      comment: data.comment,
      status: 'submitted',
    };
    this.submissions.unshift(newSub);
    if (hw) {
      hw.submissions_count = this.submissions.filter(s => s.homework_id === hw.id).length;
    }
    this.save();
    return newSub;
  }

  public reviewSubmission(
    submissionId: string,
    score: number,
    feedback: string,
    coins?: number
  ) {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error('Topshiriq topilmadi');
    sub.status = 'reviewed';
    sub.score = score;
    sub.feedback = feedback;
    sub.reviewed_at = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const hw = this.homework.find(h => h.id === sub.homework_id);
    if (hw) {
      hw.reviewed_count = this.submissions.filter(
        s => s.homework_id === hw.id && s.status === 'reviewed'
      ).length;
    }

    // Award 1 to 20 coins according to teacher's evaluation
    if (coins && coins > 0) {
      const validCoins = Math.min(20, Math.max(1, Math.round(coins)));
      sub.coins_awarded = validCoins;
      try {
        this.awardCoins({
          student_id: sub.student_id,
          amount: validCoins,
          reason: `Uy vazifasi uchun rag‘bat: "${hw?.title || 'Vazifa'}" (${score} ball)`,
          comment: feedback || undefined,
        });
      } catch {
        // Continue if coin already awarded
      }
    }

    this.save();
    return sub;
  }

  public markNotificationRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
    }
  }

  public markAllNotificationsRead() {
    this.notifications.forEach(n => { n.read = true; });
    this.save();
  }

  // --- Student Coin Reward Methods ---
  public awardCoins(params: {
    student_id: string;
    amount: number;
    reason: string;
    comment?: string;
    lesson_id?: string;
  }): { success: boolean; new_balance: number; transaction: CoinTransaction } {
    const student = this.students.find(s => s.id === params.student_id);
    if (!student) {
      throw new Error('Talaba tizimda topilmadi.');
    }

    // Verify student belongs to assigned groups
    const assignedGroupIds = new Set(this.groups.map(g => g.id));
    if (!assignedGroupIds.has(student.group_id)) {
      throw new Error('Siz faqat o‘zingizga biriktirilgan guruh talabalariga coin bera olasiz.');
    }

    if (!params.amount || params.amount <= 0 || !Number.isInteger(params.amount)) {
      throw new Error('Coin miqdori 0 dan katta butun son bo‘lishi lozim.');
    }

    if (params.amount > MAX_COIN_REWARD_LIMIT) {
      throw new Error(`Bitta rag‘batlantirish uchun maksimal limit ${MAX_COIN_REWARD_LIMIT} coin.`);
    }

    if (!params.reason || !params.reason.trim()) {
      throw new Error('Rag‘batlantirish sababini ko‘rsatish majburiy.');
    }

    // Atomically increment student's coin balance
    student.coins_balance = (student.coins_balance || 0) + params.amount;

    // Create separate audit transaction record
    const newTx: CoinTransaction = {
      id: `ctx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      student_id: student.id,
      student_name: student.full_name,
      student_code: student.student_code,
      teacher_id: this.teacher.id,
      teacher_name: this.teacher.full_name,
      group_id: student.group_id,
      group_name: student.group_name,
      lesson_id: params.lesson_id,
      amount: params.amount,
      transaction_type: 'reward',
      reason: params.reason.trim(),
      comment: params.comment?.trim() || undefined,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    this.coinTransactions.unshift(newTx);
    this.save();

    return {
      success: true,
      new_balance: student.coins_balance,
      transaction: newTx,
    };
  }

  // Coin spending in Student Panel / Shop
  public spendCoins(student_id: string, item_id: string): {
    success: boolean;
    new_balance: number;
    transaction: CoinTransaction;
  } {
    const student = this.students.find(s => s.id === student_id);
    if (!student) throw new Error('Talaba topilmadi.');

    const item = this.shopItems.find(i => i.id === item_id);
    if (!item) throw new Error('Do‘kon mahsuloti topilmadi.');

    if (item.stock <= 0) throw new Error('Mahsulot qolmagan.');

    if (student.coins_balance < item.cost_coins) {
      throw new Error(`Yetarli coin mavjud emas. Balans: ${student.coins_balance}, Kerak: ${item.cost_coins}`);
    }

    // Deduct coins & reduce stock
    student.coins_balance -= item.cost_coins;
    item.stock -= 1;

    const newTx: CoinTransaction = {
      id: `ctx-spent-${Date.now()}`,
      student_id: student.id,
      student_name: student.full_name,
      student_code: student.student_code,
      teacher_id: 'shop-system',
      teacher_name: 'Avlod Ta’lim Do‘koni',
      group_id: student.group_id,
      group_name: student.group_name,
      amount: -item.cost_coins,
      transaction_type: 'spent',
      reason: `Xarid qilindi: ${item.title}`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    this.coinTransactions.unshift(newTx);
    this.save();

    return {
      success: true,
      new_balance: student.coins_balance,
      transaction: newTx,
    };
  }

  private recalculateStudentStats() {
    this.students.forEach(student => {
      const records = this.attendance.filter(r => r.student_id === student.id);
      if (records.length > 0) {
        student.total_lessons = records.length;
        student.attended_lessons = records.filter(r => r.status === 'present').length;
        student.missed_lessons = records.filter(r => r.status === 'absent').length;
        student.late_lessons = records.filter(r => r.status === 'late').length;
        student.attendance_rate = Math.round(
          ((student.attended_lessons + student.late_lessons * 0.8) / student.total_lessons) * 1000
        ) / 10;
      }
    });
  }
}

export const localStore = new FrontendDataStore();

// Complete Frontend Service Layer
export const teacherService = {
  // 1. Dashboard Stats (dynamically calculated)
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get('/dashboard/');
    return {
      my_groups_count: data.groups || 0, my_students_count: data.students || 0,
      lessons_today_count: 0, lessons_this_month: data.lessons || 0, attendance_rate: 0, pending_homework_count: 0,
    };
  },

  // 2. Groups
  async getGroups(): Promise<Group[]> {
    const rows = await paged<any>('/groups/'); return rows.map(g => mapGroup({ ...g, course_name: g.course_name || g.course }));
  },

  async getGroupById(id: string): Promise<Group | undefined> {
    const { data } = await apiClient.get(`/groups/${id}/`); return mapGroup(data);
  },

  // 3. Students
  async getStudents(groupId?: string): Promise<Student[]> {
    if (groupId) { const { data: group } = await apiClient.get(`/groups/${groupId}/`); const students = await paged<any>(`/groups/${groupId}/students/`); return students.map(s => mapStudent(s, group)); }
    const groups = await this.getGroups();
    return (await Promise.all(groups.map(g => this.getStudents(g.id)))).flat();
  },

  async getStudentById(id: string): Promise<Student | undefined> {
    for (const group of await this.getGroups()) {
      const students = await this.getStudents(group.id);
      const student = students.find(s => s.id === id);
      if (student) return student;
    }
    return undefined;
  },

  // 4. Schedule & Lessons
  async getSchedule(dateFilter?: string): Promise<Lesson[]> {
    const rows = await paged<any>('/lessons/'); return rows.filter(l => !dateFilter || l.scheduled_date === dateFilter).map(mapLesson);
  },

  async getLessonById(id: string): Promise<Lesson | undefined> {
    const { data } = await apiClient.get(`/lessons/${id}/`); return mapLesson(data);
  },

  // 5. Attendance Management
  async getAttendance(): Promise<AttendanceRecord[]> {
    return (await paged<any>('/attendance/')).map(a => ({ id: String(a.id), lesson_id: String(a.lesson), student_id: String(a.student), student_name: '', student_code: '', status: a.status, marked_by: '', marked_at: a.created_at }));
  },

  async getLessonAttendance(lessonId: string): Promise<AttendanceRecord[]> {
    return (await paged<any>(`/attendance/?lesson=${lessonId}`)).map(a => ({ id: String(a.id), lesson_id: String(a.lesson), student_id: String(a.student), student_name: a.student_name || '', student_code: '', status: a.status, marked_by: '', marked_at: a.created_at }));
  },

  async submitLessonAttendance(
    lessonId: string,
    records: {
      student_id: string;
      status: AttendanceStatus;
      late_minutes?: number;
      notes?: string;
      auto_reward_coins?: boolean;
    }[]
  ): Promise<{ success: boolean; count: number; totalCoinsAwarded: number; rewardsCount: number }> {
    if (records.some(r => r.status === 'late')) throw new Error('Backend attendance statuses support present, absent, and excused only.');
    const payload = { lesson: Number(lessonId), records: records.map(r => ({ student_id: Number(r.student_id), status: r.status })) };
    const { data } = await apiClient.post('/attendance/bulk/', payload);
    return { success: true, count: data.length, totalCoinsAwarded: 0, rewardsCount: 0 };
  },

  // 6. Lesson Completion
  async completeLesson(
    lessonId: string,
    details: {
      topic: string;
      summary: string;
      covered_material: string;
      homework_assigned?: string;
      additional_notes?: string;
    }
  ): Promise<Lesson> {
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) throw new Error('Lesson not found');
    if (!(lesson as any).topic_id) throw new Error('This lesson has no topic to mark as taught.');
    await apiClient.post(`/lessons/${lessonId}/mark-taught/`, { topic_id: Number((lesson as any).topic_id) });
    return lesson;
  },

  async startLesson(lessonId: string): Promise<Lesson> {
    throw new Error('The backend has no separate lesson-start state.');
  },

  async createLesson(data: {
    group_id: string;
    topic?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    room?: string;
  }): Promise<Lesson> {
    const [group, lessons, me] = await Promise.all([apiClient.get(`/groups/${data.group_id}/`), paged<any>('/lessons/'), apiClient.get('/auth/me/')]);
    const next = lessons.filter(l => String(l.group) === data.group_id).reduce((n, l) => Math.max(n, l.number), 0) + 1;
    const { data: lesson } = await apiClient.post('/lessons/', { course: group.data.course, group: Number(data.group_id), number: next, title: data.topic || `Lesson ${next}`, description: '', scheduled_date: data.date || null, status: 'planned', teacher: me.data.id });
    return mapLesson(lesson);
  },

  // 7. Video Submission
  async submitLessonVideo(lessonId: string, videoUrl: string): Promise<Lesson> {
    throw new Error('Video submissions are not implemented by the backend.');
  },

  // 8. Homework Management
  async getHomework(groupId?: string): Promise<Homework[]> {
    const rows = await paged<any>('/assignments/');
    return rows.filter(a => !groupId || String(a.lesson_data?.group) === String(groupId)).map(a => ({ id: String(a.id), group_id: String(a.lesson_data?.group || ''), group_name: a.lesson_data?.group_name || '', course_name: '', title: a.title, description: a.description, deadline: a.due_at || '', total_students: 0, submissions_count: 0, reviewed_count: 0, created_at: a.created_at }));
  },

  async createHomework(data: {
    group_id: string;
    title: string;
    description: string;
    deadline: string;
    attachments?: { name: string; url: string; size: string }[];
  }): Promise<Homework> {
    const lessons = (await paged<any>('/lessons/')).filter(l => String(l.group) === data.group_id);
    const lesson = lessons[0]; if (!lesson) throw new Error('Create or select a lesson before adding an assignment.');
    const { data: assignment } = await apiClient.post('/assignments/', { lesson: lesson.id, title: data.title, description: data.description, due_at: data.deadline || null });
    return { id: String(assignment.id), group_id: data.group_id, group_name: '', course_name: '', title: assignment.title, description: assignment.description, deadline: assignment.due_at || '', total_students: 0, submissions_count: 0, reviewed_count: 0, created_at: assignment.created_at };
  },

  async getSubmissions(homeworkId: string): Promise<HomeworkSubmission[]> {
    return (await paged<any>(`/submissions/?assignment=${homeworkId}`)).map(s => ({ id: String(s.id), homework_id: String(s.assignment), student_id: String(s.student), student_name: '', student_code: '', submitted_at: s.submitted_at, code_content: s.text, status: s.score == null ? 'submitted' : 'reviewed', score: s.score, feedback: s.feedback }));
  },

  async submitHomework(data: {
    homework_id: string;
    student_id: string;
    file_name: string;
    code_content: string;
    code_language?: string;
    file_size?: string;
    comment?: string;
  }): Promise<HomeworkSubmission> {
    const { data: submission } = await apiClient.post('/submissions/', { assignment: Number(data.homework_id), text: data.code_content || data.comment || '' });
    return { id: String(submission.id), homework_id: String(submission.assignment), student_id: String(submission.student), student_name: '', student_code: '', submitted_at: submission.submitted_at, code_content: submission.text, status: submission.score == null ? 'submitted' : 'reviewed' };
  },

  async reviewSubmission(
    submissionId: string,
    score: number,
    feedback: string,
    coins?: number
  ): Promise<HomeworkSubmission> {
    const { data } = await apiClient.patch(`/submissions/${submissionId}/`, { score, feedback });
    return { id: String(data.id), homework_id: String(data.assignment), student_id: String(data.student), student_name: '', student_code: '', submitted_at: data.submitted_at, code_content: data.text, status: 'reviewed', score: data.score, feedback: data.feedback };
  },

  // 9. Notifications
  async getNotifications(): Promise<Notification[]> {
    return (await paged<any>('/notifications/')).map(n => ({ id: String(n.id), title: n.title, message: n.message, type: 'admin', read: !!n.read_at, created_at: n.created_at }));
  },

  async markNotificationRead(id: string): Promise<void> {
    await apiClient.post(`/notifications/${id}/read/`);
  },

  async markAllNotificationsRead(): Promise<void> {
    throw new Error('Bulk notification updates are not supported by this backend.');
  },

  // 10. Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    return [];
  },

  // 11. Profile
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get('/auth/me/'); return { ...data, full_name: data.full_name || `${data.first_name} ${data.last_name}`.trim() };
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const { data: user } = await apiClient.patch('/auth/me/', { first_name: data.full_name?.split(' ')[0], last_name: data.full_name?.split(' ').slice(1).join(' '), phone: data.phone }); return { ...user, full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim() };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    await apiClient.post('/auth/password/change/', { old_password: currentPassword, new_password: newPassword }); return { success: true, message: 'Password updated.' };
  },

  // 12. Salary (Permission-based)
  async getSalaryInfo(): Promise<TeacherSalaryRecord[]> {
    throw new Error('Teacher salary details are restricted to the Director API.');
  },

  // 13. Reports
  async getReports(params?: { groupId?: string; dateRange?: string }) {
    const [lessons, groups] = await Promise.all([this.getSchedule(), this.getGroups()]);
    const students = await this.getStudents();
    const completedLessons = lessons.filter(l => l.status === 'completed');
    const plannedLessons = lessons.filter(l => l.status === 'planned');

    return {
      total_lessons: lessons.length,
      completed_lessons: completedLessons.length,
      planned_lessons: plannedLessons.length,
      attendance_rate: 0,
      groups_summary: groups.map(g => {
        const gStudents = students.filter(s => s.group_id === g.id);
        const avgAtt = gStudents.length
          ? Math.round((gStudents.reduce((a, b) => a + b.attendance_rate, 0) / gStudents.length) * 10) / 10
          : 0;
        return {
          group_id: g.id,
          group_name: g.name,
          course_name: g.course_name,
          student_count: g.student_count,
          avg_attendance: avgAtt,
          completed_lessons: lessons.filter(l => l.group_id === g.id && l.status === 'completed').length,
        };
      }),
    };
  },

  // 14. Student Coin Rewards & Shop API
  async awardCoins(
    studentId: string,
    amount: number,
    reason: string,
    comment?: string,
    lessonId?: string
  ): Promise<{ success: boolean; new_balance: number; transaction: CoinTransaction }> {
    const { data: transaction } = await apiClient.post('/coins/', { student: Number(studentId), amount, reason, reference: lessonId || '' });
    const { data: balance } = await apiClient.get('/coins/');
    return { success: true, new_balance: balance.balance, transaction: { id: String(transaction.id), student_id: studentId, student_name: '', student_code: '', teacher_id: '', teacher_name: '', group_id: '', group_name: '', amount, reason, created_at: new Date().toISOString() } };
  },

  async getCoinTransactions(studentId?: string): Promise<CoinTransaction[]> {
    const { data } = await apiClient.get('/coins/');
    return (data.transactions || []).filter((tx: any) => !studentId || String(tx.student_id) === studentId).map((tx: any) => ({ id: String(tx.id), student_id: String(tx.student_id), student_name: '', student_code: '', teacher_id: '', teacher_name: '', group_id: '', group_name: '', amount: tx.amount, reason: tx.reason, created_at: tx.created_at }));
  },

  async getShopItems(): Promise<ShopItem[]> {
    return (await paged<any>('/shop/products/')).map(p => ({ id: String(p.id), title: p.name, description: p.description, cost_coins: p.coin_price, category: 'study', stock: p.stock }));
  },

  async purchaseShopItem(studentId: string, itemId: string): Promise<{
    success: boolean;
    new_balance: number;
    transaction: CoinTransaction;
  }> {
    throw new Error('Purchases can only be made from the authenticated student panel.');
  },
};
