export type Role = 'DIRECTOR' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export type UserStatus = 'active' | 'blocked' | 'pending';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'blocked';

export type PaymentMethod = 'Naqd' | 'Click' | 'Payme' | 'Uzum';

export type OrderStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Completed';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  username: string;
  password?: string;
  avatarUrl?: string;
  groupsCount: number;
  studentsCount: number;
  status: UserStatus;
  createdAt: string;
  subject: string;
  monthlySalary: number;
  salaryPercentage: number;
  attendanceRate: number; // e.g. 96%
  bio?: string;
}

export interface Student {
  id: string;
  studentId: string; // 8-digit unique code, e.g. "38172645"
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  courseId: string;
  courseName: string;
  groupId: string;
  groupName: string;
  teacherName: string;
  monthlyPayment: number;
  paymentStatus: PaymentStatus;
  attendanceRate: number; // e.g. 92%
  coins: number;
  status: UserStatus;
  createdAt: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  studentsCount: number;
  maxStudents: number;
  schedule: string; // e.g. "Dush-Chor-Juma 14:00 - 16:00"
  room: string;
  status: 'active' | 'archived' | 'planned';
  startDate: string;
  studentIds: string[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  durationMonths: number;
  monthlyPrice: number;
  studentsCount: number;
  groupsCount: number;
  status: 'active' | 'inactive';
  iconName?: string;
  category: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentPublicId: string;
  studentName: string;
  courseName: string;
  groupName: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber?: string;
  receiptImage?: string;
  date: string;
  status: PaymentStatus;
  note?: string;
}

export interface TeacherSalaryRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  studentsCount: number;
  paidStudentsCount: number;
  totalRevenue: number;
  teacherPercentage: number; // Default 40%
  calculatedSalary: number;
  status: 'paid' | 'pending' | 'processing';
  month: string;
  studentBreakdown: {
    studentId: string;
    studentName: string;
    monthlyPayment: number;
    shareAmount: number;
    paymentStatus: PaymentStatus;
  }[];
  history: {
    month: string;
    collected: number;
    salary: number;
    status: 'paid' | 'pending';
  }[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  coinPrice: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  imageUrl: string;
  category: string;
  createdAt: string;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  studentId: string;
  studentName: string;
  studentPublicId: string;
  productId: string;
  productName: string;
  productImage: string;
  coinAmount: number;
  date: string;
  status: OrderStatus;
}

export interface DirectorSettings {
  centerName: string;
  logoUrl: string;
  primaryColor: string;
  paymentDeadlineDay: number;
  defaultMonthlyPayment: number;
  teacherSalaryPercentage: number;
  requireTwoFactor: boolean;
  sessionTimeoutMinutes: number;
  allowCashReceipts: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface CoinTransaction {
  id: string;
  studentId: string;
  studentPublicId: string;
  studentName: string;
  groupName: string;
  amount: number;
  operation: 'add' | 'subtract' | 'set';
  previousBalance: number;
  newBalance: number;
  reason: string;
  date: string;
  type?: 'reward' | 'shop_purchase' | 'adjustment';
  teacherName?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentPublicId: string;
  groupId: string;
  groupName: string;
  courseName: string;
  date: string;
  dayOfWeek: string;
  topic: string;
  status: AttendanceStatus;
  note?: string;
  teacherName?: string;
}

export interface LessonSchedule {
  id: string;
  groupId: string;
  groupName: string;
  courseName: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Dushanba, Seshanba, etc.
  startTime: string; // '14:00'
  endTime: string; // '16:00'
  room: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  topic: string;
  homeworkAssigned?: boolean;
}

export type HomeworkStatus = 'Pending' | 'Submitted' | 'Graded' | 'Overdue';

export interface HomeworkSubmission {
  submittedAt: string;
  textContent: string;
  githubUrl?: string;
  previewUrl?: string;
  grade?: number;
  teacherFeedback?: string;
  gradedAt?: string;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  groupId: string;
  groupName: string;
  courseName: string;
  teacherName: string;
  assignedDate: string;
  deadline: string;
  maxScore: number;
  coinReward?: number;
  status: HomeworkStatus;
  submission?: HomeworkSubmission;
}

export type AnnouncementPriority = 'Urgent' | 'Academic' | 'General';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: AnnouncementPriority;
  author: string;
  authorRole: string;
  targetGroups?: string[];
  pinned?: boolean;
}

export type NotificationType = 'coin' | 'order' | 'lesson' | 'schedule' | 'homework' | 'announcement';

export interface StudentNotification {
  id: string;
  studentId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkTo?: string;
  createdAt: string;
  read: boolean;
}

export interface StudentUser {
  id: string;
  studentId: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'STUDENT';
  email?: string;
  phone: string;
  avatarUrl?: string;
  groupId: string;
  groupName: string;
  courseName: string;
  teacherName: string;
  bio?: string;
  telegramUsername?: string;
  preferredContact?: 'Telegram' | 'Phone' | 'Email';
  attendanceRate: number;
  coins: number;
  paymentStatus: PaymentStatus | 'restricted' | 'unknown';
}
