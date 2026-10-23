import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  FileCheck2,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  UserPlus,
  PlusCircle,
  Receipt,
  PackagePlus,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardData } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { LoadingState, ErrorState } from '../../components/common/States';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingState message="Aggregating academic and financial metrics..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to connect to backend server'} onRetry={fetchDashboard} />;
  }

  const { metrics, recent_activities, charts } = data;

  const formatUZS = (val: number) => {
    return `${val.toLocaleString()} UZS`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Quick Actions:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/students?action=create')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Student</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/groups?action=create')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Create Group</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/payments?action=register')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Register Payment</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/shop?action=add')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <PackagePlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Shop Product</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/payment-verification')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Verification ({metrics.pending_payment_verifications})</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={metrics.total_students}
          subtitle={`${metrics.active_students} active accounts`}
          icon={<Users className="w-5 h-5 text-slate-700" />}
          accentColor="navy"
          onClick={() => navigate('/admin/students')}
        />

        <StatCard
          title="Active Groups"
          value={metrics.total_groups}
          subtitle={`Across ${metrics.available_courses} courses`}
          icon={<GraduationCap className="w-5 h-5 text-indigo-700" />}
          accentColor="indigo"
          onClick={() => navigate('/admin/groups')}
        />

        <StatCard
          title="Payments This Month"
          value={formatUZS(metrics.payments_this_month)}
          subtitle="Confirmed tuition revenue"
          icon={<CreditCard className="w-5 h-5 text-emerald-700" />}
          accentColor="emerald"
          onClick={() => navigate('/admin/payments')}
        />

        <StatCard
          title="Outstanding Balance"
          value={formatUZS(metrics.outstanding_payments)}
          subtitle="Unpaid student accounts"
          icon={<AlertCircle className="w-5 h-5 text-rose-700" />}
          accentColor="rose"
          onClick={() => navigate('/admin/students?payment_status=unpaid')}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Courses"
          value={metrics.available_courses}
          subtitle="Active curricula"
          icon={<BookOpen className="w-5 h-5 text-slate-700" />}
          accentColor="navy"
          onClick={() => navigate('/admin/courses')}
        />

        <StatCard
          title="Pending Verification"
          value={metrics.pending_payment_verifications}
          subtitle="Receipt claims to review"
          icon={<FileCheck2 className="w-5 h-5 text-amber-700" />}
          accentColor="amber"
          onClick={() => navigate('/admin/payment-verification')}
        />

        <StatCard
          title="Pending Shop Orders"
          value={metrics.pending_shop_orders}
          subtitle="Awaiting fulfillment"
          icon={<ShoppingBag className="w-5 h-5 text-indigo-700" />}
          accentColor="indigo"
          onClick={() => navigate('/admin/shop-orders')}
        />

        <StatCard
          title="Attendance Rate"
          value="94.2%"
          subtitle="Overall academic presence"
          icon={<TrendingUp className="w-5 h-5 text-emerald-700" />}
          accentColor="emerald"
        />
      </div>

      {/* Analytics and Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tuition Revenue Trend</h3>
              <p className="text-xs text-slate-500">Monthly confirmed revenue in UZS</p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Active Semester
            </span>
          </div>

          {/* Clean CSS Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {charts.monthly_revenue.map((item, idx) => {
              const maxVal = Math.max(...charts.monthly_revenue.map((m) => m.amount), 1);
              const heightPct = Math.round((item.amount / maxVal) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-mono font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums whitespace-nowrap">
                    {(item.amount / 1000000).toFixed(1)}M
                  </span>
                  <div
                    style={{ height: `${Math.max(12, heightPct)}%` }}
                    className="w-full max-w-[42px] bg-slate-900 group-hover:bg-amber-500 rounded-t-md transition-all duration-300"
                  />
                  <span className="text-xs font-medium text-slate-500 mt-1">{item.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2">
            <span>Values shown in millions (UZS)</span>
            <button
              type="button"
              onClick={() => navigate('/admin/payments')}
              className="font-medium text-slate-700 hover:text-slate-950 inline-flex items-center gap-1"
            >
              Full Payment Ledger <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Payment Methods & Order Pipeline Breakdown */}
        <div className="space-y-6">
          {/* Payment Providers */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Payment Method Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Channel share by transaction count</p>

            <div className="space-y-3">
              {Object.entries(charts.payment_methods_breakdown).map(([method, count]) => {
                const total = Object.values(charts.payment_methods_breakdown).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 uppercase tracking-wide">
                        {method}
                      </span>
                      <span className="text-slate-500 font-mono tabular-nums">
                        {count} tx ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-slate-800 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shop Orders status */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Academy Shop Orders</h3>
              <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                {Object.values(charts.shop_order_status).reduce((a, b) => a + b, 0)} total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                <span className="text-slate-500 block text-[11px]">Pending</span>
                <span className="text-base font-bold text-amber-900 font-mono tabular-nums">
                  {charts.shop_order_status.pending || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100">
                <span className="text-slate-500 block text-[11px]">Ready</span>
                <span className="text-base font-bold text-teal-900 font-mono tabular-nums">
                  {charts.shop_order_status.ready || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Operations & Activities</h3>
            <p className="text-xs text-slate-500">Live operational events recorded in Avlod database</p>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Refresh
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recent_activities.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recent activities recorded.</p>
          ) : (
            recent_activities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                    {act.type.includes('payment') ? (
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    ) : act.type.includes('student') ? (
                      <UserPlus className="w-3.5 h-3.5 text-slate-700" />
                    ) : (
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{act.title}</p>
                    <p className="text-slate-500">{act.subtitle}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                  {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
