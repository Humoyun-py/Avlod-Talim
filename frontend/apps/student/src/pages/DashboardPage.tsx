import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Layers,
  DollarSign,
  Wallet,
  Clock,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  Plus,
  TrendingUp,
  Award,
  ChevronRight,
  Coins
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { RevenueChart } from '../components/charts/RevenueChart';
import { StudentsGrowthChart } from '../components/charts/StudentsGrowthChart';
import { AttendanceChart } from '../components/charts/AttendanceChart';
import { PaymentStatsChart } from '../components/charts/PaymentStatsChart';
import { StatusBadge } from '../components/common/StatusBadge';
import { DirectorService } from '../services/mockService';
import { Payment, ShopOrder, Student, Teacher, Group, TeacherSalaryRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [salaries, setSalaries] = useState<TeacherSalaryRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pay, stu, ord, tch, grp, sal] = await Promise.all([
          DirectorService.getPayments(),
          DirectorService.getStudents(),
          DirectorService.getOrders(),
          DirectorService.getTeachers(),
          DirectorService.getGroups(),
          DirectorService.getSalaries()
        ]);
        setPayments(pay);
        setStudents(stu);
        setOrders(ord);
        setTeachers(tch);
        setGroups(grp);
        setSalaries(sal);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Dynamic calculations from real records
  const totalStudentsCount = students.length;
  const activeStudentsCount = students.filter(s => s.status === 'active').length;
  const blockedStudentsCount = students.filter(s => s.status === 'blocked').length;

  const totalTeachersCount = teachers.length;
  const activeTeachersCount = teachers.filter(t => t.status === 'active').length;

  const totalGroupsCount = groups.length;
  const activeGroupsCount = groups.length;

  // Monthly Revenue from confirmed payments
  const totalPaidRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const cashRevenue = payments
    .filter(p => p.status === 'paid' && p.method === 'Naqd')
    .reduce((sum, p) => sum + p.amount, 0);

  const onlineRevenue = totalPaidRevenue - cashRevenue;

  // Teacher Salary from records
  const totalSalaries = salaries.reduce((sum, s) => sum + s.calculatedSalary, 0);
  const paidSalaries = salaries
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + s.calculatedSalary, 0);
  const pendingSalaries = totalSalaries - paidSalaries;

  // Pending Payments from students
  const pendingStudents = students.filter(
    s => s.paymentStatus === 'pending' || s.paymentStatus === 'overdue'
  );
  const pendingCount = pendingStudents.length;
  const overdueCount = students.filter(s => s.paymentStatus === 'overdue').length;
  const pendingAmount = pendingStudents.reduce((sum, s) => sum + s.monthlyPayment, 0);

  // Shop Orders stats
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const totalCoinVolume = orders.reduce((sum, o) => sum + (o.coinAmount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#F2EFFF] p-6 rounded-3xl border border-[#E9EAF3] shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-bold tracking-wider uppercase text-[#5C42FD] bg-purple-50 px-2.5 py-1 rounded-md">
            {t('dashboard.badge')}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('dashboard.welcome_prefix')}, Sardor Rahmonov
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('dashboard.welcome_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/director/coins')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs shadow-amber-500/30 transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>{t('dashboard.give_coins_btn')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/director/payments')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>{t('dashboard.view_payments_btn')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/director/students')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#5C42FD]/30 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('dashboard.new_student_btn')}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Primary Key Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {t('dashboard.key_metrics')}
          </h3>
          <span className="text-xs text-gray-400">{t('dashboard.live_update')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('dashboard.total_students')}
            value={totalStudentsCount}
            subtitle={t('dashboard.total_students_sub')}
            icon={GraduationCap}
            accentColor="#5C42FD"
            trend={{ value: '14.2%', isPositive: true }}
            subStats={[
              { label: t('dashboard.active'), value: activeStudentsCount, highlight: 'emerald' },
              { label: t('dashboard.blocked'), value: blockedStudentsCount, highlight: 'rose' }
            ]}
            onClick={() => navigate('/director/students')}
          />

          <StatCard
            title={t('dashboard.total_teachers')}
            value={totalTeachersCount}
            subtitle={t('dashboard.total_teachers_sub')}
            icon={Users}
            accentColor="#4F46E5"
            trend={{ value: `${totalTeachersCount} mentor`, isPositive: true }}
            subStats={[
              { label: t('dashboard.active_teachers'), value: activeTeachersCount, highlight: 'emerald' },
              { label: t('dashboard.all_groups'), value: `${totalGroupsCount} ${t('common.groups_count_suffix')}`, highlight: 'indigo' }
            ]}
            onClick={() => navigate('/director/teachers')}
          />

          <StatCard
            title={t('dashboard.total_groups')}
            value={`${totalGroupsCount} ${t('common.groups_count_suffix')}`}
            subtitle={t('dashboard.total_groups_sub')}
            icon={Layers}
            accentColor="#0284C7"
            subStats={[
              { label: t('dashboard.active_groups'), value: `${activeGroupsCount} ${t('common.groups_count_suffix')}`, highlight: 'emerald' },
              { label: t('dashboard.student_reach'), value: `${totalStudentsCount} ${t('common.students_count_suffix')}`, highlight: 'amber' }
            ]}
            onClick={() => navigate('/director/groups')}
          />

          <StatCard
            title={t('dashboard.monthly_revenue')}
            value={`${totalPaidRevenue.toLocaleString()} ${t('common.uzs')}`}
            subtitle={t('dashboard.monthly_revenue_sub')}
            icon={DollarSign}
            accentColor="#10B981"
            trend={{ value: t('dashboard.live_update'), isPositive: true }}
            subStats={[
              { label: t('dashboard.cash_desk'), value: `${cashRevenue.toLocaleString()} ${t('common.uzs')}`, highlight: 'gray' },
              { label: t('dashboard.online_pay'), value: `${onlineRevenue.toLocaleString()} ${t('common.uzs')}`, highlight: 'emerald' }
            ]}
            onClick={() => navigate('/director/payments')}
          />
        </div>
      </div>

      {/* Row 2: Financial & Operational Sub-Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('dashboard.teacher_salary')}
          value={`${totalSalaries.toLocaleString()} ${t('common.uzs')}`}
          subtitle={t('dashboard.teacher_salary_sub')}
          icon={Wallet}
          accentColor="#8B5CF6"
          subStats={[
            { label: t('dashboard.paid_out'), value: `${paidSalaries.toLocaleString()} ${t('common.uzs')}`, highlight: 'emerald' },
            { label: t('dashboard.awaiting'), value: `${pendingSalaries.toLocaleString()} ${t('common.uzs')}`, highlight: 'amber' }
          ]}
          onClick={() => navigate('/director/teacher-salary')}
        />

        <StatCard
          title={t('dashboard.pending_payments')}
          value={`${pendingCount} ${t('common.students_count_suffix')}`}
          subtitle={t('dashboard.pending_payments_sub')}
          icon={Clock}
          accentColor="#F59E0B"
          subStats={[
            { label: t('dashboard.pending_sum'), value: `${pendingAmount.toLocaleString()} ${t('common.uzs')}`, highlight: 'amber' },
            { label: t('dashboard.overdue'), value: `${overdueCount} ${t('common.students_count_suffix')}`, highlight: 'rose' }
          ]}
          onClick={() => navigate('/director/payments')}
        />

        <StatCard
          title={t('dashboard.shop_orders')}
          value={`${orders.length} ta`}
          subtitle={t('dashboard.shop_orders_sub')}
          icon={ShoppingBag}
          accentColor="#EC4899"
          subStats={[
            { label: t('dashboard.needs_approval'), value: `${pendingOrdersCount} ta`, highlight: 'amber' },
            { label: t('dashboard.coin_turnover'), value: `${totalCoinVolume.toLocaleString()} ${t('common.coins')}`, highlight: 'indigo' }
          ]}
          onClick={() => navigate('/director/orders')}
        />
      </div>

      {/* Row 3: Modern Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <StudentsGrowthChart />
      </div>

      {/* Row 4: Secondary Charts (Attendance & Payment Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <PaymentStatsChart />
      </div>

      {/* Row 5: Recent Activity (Tables) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            {t('dashboard.recent_operations')}
          </h3>
          <span className="text-xs text-gray-500">{t('dashboard.realtime_activity')}</span>
        </div>

        {/* 1. Recent Payments Table */}
        <div className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-[#F0F1F7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#5C42FD]" />
              <h4 className="text-sm font-bold text-gray-900">{t('dashboard.recent_payments')}</h4>
            </div>
            <button
              onClick={() => navigate('/director/payments')}
              className="text-xs text-[#5C42FD] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('common.view_all')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FE] text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">{t('dashboard.th_student')}</th>
                  <th className="px-6 py-3">{t('dashboard.th_group_course')}</th>
                  <th className="px-6 py-3">{t('dashboard.th_amount')}</th>
                  <th className="px-6 py-3">{t('dashboard.th_method')}</th>
                  <th className="px-6 py-3">{t('dashboard.th_date')}</th>
                  <th className="px-6 py-3">{t('dashboard.th_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {payments.slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-[#FAF9FE] transition-colors">
                    <td className="px-6 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#5C42FD]/10 text-[#5C42FD] flex items-center justify-center font-bold text-[10px]">
                        {p.studentName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{p.studentName}</div>
                        <div className="text-[10px] text-gray-400 font-normal">ID: {p.studentPublicId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">{p.groupName}</td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">
                      {p.amount.toLocaleString()} {t('common.uzs')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{p.date}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2-Column Split: Recent Students & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Students */}
          <div className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden shadow-xs flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 border-b border-[#F0F1F7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#5C42FD]" />
                  <h4 className="text-sm font-bold text-gray-900">{t('dashboard.recent_students')}</h4>
                </div>
                <button
                  onClick={() => navigate('/director/students')}
                  className="text-xs text-[#5C42FD] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('common.view_all')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9FE] text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-2.5">{t('dashboard.th_student')}</th>
                      <th className="px-5 py-2.5">{t('students.th_group')}</th>
                      <th className="px-5 py-2.5">{t('dashboard.th_date')}</th>
                      <th className="px-5 py-2.5">{t('dashboard.th_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {students.slice(0, 4).map(s => (
                      <tr key={s.id} className="hover:bg-[#FAF9FE] transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {s.fullName}
                          <span className="block text-[10px] text-gray-400 font-normal">ID: {s.studentId}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{s.groupName}</td>
                        <td className="px-5 py-3 text-gray-400">{s.createdAt}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={s.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden shadow-xs flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 border-b border-[#F0F1F7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#5C42FD]" />
                  <h4 className="text-sm font-bold text-gray-900">{t('dashboard.recent_orders')}</h4>
                </div>
                <button
                  onClick={() => navigate('/director/orders')}
                  className="text-xs text-[#5C42FD] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('common.view_all')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9FE] text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-2.5">{t('dashboard.th_student')}</th>
                      <th className="px-5 py-2.5">{t('dashboard.th_product')}</th>
                      <th className="px-5 py-2.5">{t('dashboard.th_coins')}</th>
                      <th className="px-5 py-2.5">{t('dashboard.th_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {orders.slice(0, 4).map(o => (
                      <tr key={o.id} className="hover:bg-[#FAF9FE] transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {o.studentName}
                          <span className="block text-[10px] text-gray-400 font-normal">{o.orderNumber}</span>
                        </td>
                        <td className="px-5 py-3 truncate max-w-[130px]">{o.productName}</td>
                        <td className="px-5 py-3 font-bold text-amber-600">
                          {o.coinAmount} {t('common.coins')}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={o.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
