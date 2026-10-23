export type UserRole = 'admin' | 'director' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  duration_months: number;
  default_monthly_fee: number;
  status: 'active' | 'archived';
  groups_count: number;
  created_at: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specializations: string[];
  active_groups: number;
}

export interface Group {
  id: string;
  name: string;
  course_id: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
  start_date: string;
  schedule: string;
  status: 'active' | 'planned' | 'completed';
  student_ids: string[];
  students_count?: number;
  created_at: string;
}

export type PaymentStatus = 'paid' | 'partially_paid' | 'unpaid' | 'restricted';
export type AccountStatus = 'active' | 'restricted' | 'deactivated';

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  course_id: string;
  course_name: string;
  group_id: string | null;
  group_name: string;
  monthly_fee: number;
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  account_status: AccountStatus;
  restriction_reason: string | null;
  coin_balance: number;
  attendance_percentage: number;
  registered_at: string;
  last_payment_date: string | null;
  payments?: Payment[];
  orders?: ShopOrder[];
}

export type PaymentMethod = 'cash' | 'click' | 'payme' | 'uzum';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: string;
  reference: string;
  student_id: string;
  student_code: string;
  student_name: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  verification_status: VerificationStatus;
  payment_status: 'confirmed' | 'unverified' | 'failed';
  registered_by: string;
  reviewed_by: string | null;
  receipt_url: string | null;
  note?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  coin_price: number;
  stock_quantity: number;
  is_active: boolean;
  image_url: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'approved' | 'processing' | 'ready' | 'completed' | 'rejected' | 'cancelled';

export interface ShopOrder {
  id: string;
  order_number: string;
  student_id: string;
  student_name: string;
  student_code: string;
  product_id: string;
  product_name: string;
  quantity: number;
  total_coins: number;
  status: OrderStatus;
  order_date: string;
  admin_notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'shop' | 'group' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  total_students: number;
  active_students: number;
  total_groups: number;
  available_courses: number;
  payments_this_month: number;
  outstanding_payments: number;
  pending_payment_verifications: number;
  pending_shop_orders: number;
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recent_activities: DashboardActivity[];
  charts: {
    monthly_revenue: { month: string; amount: number }[];
    student_registrations: { month: string; count: number }[];
    payment_methods_breakdown: Record<string, number>;
    shop_order_status: Record<string, number>;
  };
}

export interface StudentCredentials {
  student_id: string;
  initial_password: string;
  notice: string;
}
