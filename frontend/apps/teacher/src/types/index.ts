export type UserRole = 'teacher' | 'director' | 'admin' | 'student';

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  subjects: string[];
  department?: string;
  status: 'active' | 'inactive';
}

export interface Group {
  id: string;
  name: string;
  course_name: string;
  level: string;
  student_count: number;
  days: string[]; // e.g. ["Du", "Chor", "Jum"] or ["Mon", "Wed", "Fri"]
  start_time: string; // "14:00"
  end_time: string;   // "16:00"
  room: string;
  status: 'active' | 'completed' | 'paused';
  start_date: string;
  end_date: string;
}

export interface Student {
  id: string;
  student_code: string; // e.g. "AVL-1042"
  full_name: string;
  group_id: string;
  group_name: string;
  course_name: string;
  phone: string;
  parent_phone?: string;
  enrollment_status: 'active' | 'on_leave' | 'graduated';
  attendance_rate: number; // e.g. 94.5
  total_lessons: number;
  attended_lessons: number;
  missed_lessons: number;
  late_lessons: number;
  coins_balance: number;
  avatar_url?: string;
}

export type TransactionType = 'reward' | 'spent';

export interface CoinTransaction {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  teacher_id: string;
  teacher_name: string;
  group_id: string;
  group_name: string;
  lesson_id?: string;
  amount: number;
  transaction_type: TransactionType;
  reason: string;
  comment?: string;
  created_at: string;
}

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  cost_coins: number;
  category: 'merch' | 'study' | 'privilege';
  stock: number;
}

export type LessonStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type VideoStatus = 'not_submitted' | 'pending_review' | 'approved' | 'rejected';

export interface Lesson {
  id: string;
  group_id: string;
  group_name: string;
  course_name: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  room: string;
  status: LessonStatus;
  topic_id?: number;
  topic?: string;
  summary?: string;
  covered_material?: string;
  homework_assigned?: string;
  additional_notes?: string;
  completed_at?: string;
  completed_by?: string;
  attendance_submitted: boolean;
  video_status?: VideoStatus;
  video_url?: string;
  video_feedback?: string;
  video_submitted_at?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  lesson_id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  status: AttendanceStatus;
  late_minutes?: number;
  coins_awarded?: number;
  notes?: string;
  marked_by: string;
  marked_at: string;
}

export interface Homework {
  id: string;
  group_id: string;
  group_name: string;
  course_name: string;
  title: string;
  description: string;
  deadline: string;
  requires_code?: boolean;
  allowed_file_types?: string[];
  attachments?: { name: string; url: string; size: string }[];
  total_students: number;
  submissions_count: number;
  reviewed_count: number;
  created_at: string;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  submitted_at: string;
  file_name?: string;
  file_size?: string;
  file_url?: string;
  code_content?: string;
  code_language?: string;
  comment?: string;
  status: 'submitted' | 'reviewed';
  score?: number; // 0-100
  coins_awarded?: number; // 1-20 coins
  feedback?: string;
  reviewed_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'lesson' | 'schedule' | 'announcement' | 'homework' | 'video' | 'admin';
  read: boolean;
  created_at: string;
  link_url?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  author_name: string;
  author_role: string;
  priority: 'normal' | 'important' | 'urgent';
  published_at: string;
  target_audience: string;
}

export interface TeacherSalaryRecord {
  id: string;
  month: string; // e.g. "2026-09"
  month_name: string; // e.g. "Sentabr 2026"
  base_rate_per_lesson: number;
  lessons_conducted: number;
  bonus_amount: number;
  deductions: number;
  approved_amount: number;
  currency: string;
  status: 'approved' | 'paid' | 'pending';
  payment_date?: string;
  payment_method?: string;
  note?: string;
}

export interface DashboardStats {
  my_groups_count: number;
  my_students_count: number;
  lessons_today_count: number;
  lessons_this_month: number;
  attendance_rate: number;
  pending_homework_count: number;
}
