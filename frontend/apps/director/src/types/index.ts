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
}

