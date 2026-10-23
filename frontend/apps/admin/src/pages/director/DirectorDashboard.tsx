import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CreditCard, Users, GraduationCap, ArrowRight, FileCheck2, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DashboardData } from '../../types';
import { LoadingState } from '../../components/common/States';

export const DirectorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getAdminDashboard();
        setData(res);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/avlod_brand_mark_1792586439669.jpg"
              alt="Avlod Ta'lim"
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-amber-500/40"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">AVLOD TA'LIM — DIRECTOR CONSOLE</h1>
              <p className="text-xs text-slate-400 font-mono">Executive Institutional Oversight & Audit</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Access Admin Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Director Session: {user?.full_name}</h2>
              <p className="text-xs text-slate-400 font-mono">Institution: Avlod Ta'lim Academic Headquarters</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded-full uppercase">
              Supreme Authority
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            As Director, you have executive authority across academic registries, payment verification approvals, student fee adjustments, and cohort appointments.
          </p>
        </div>

        {/* Core Institutional Stats */}
        {loading ? (
          <LoadingState message="Connecting to central data server..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/70">
              <span className="text-xs font-mono uppercase text-slate-400">Total Enrolled</span>
              <p className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
                {data?.metrics.total_students || 0} Students
              </p>
              <span className="text-[11px] text-slate-500 mt-2 block">
                {data?.metrics.active_students || 0} active standing
              </span>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/70">
              <span className="text-xs font-mono uppercase text-slate-400">Confirmed Revenue</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                {(data?.metrics.payments_this_month || 0).toLocaleString()} UZS
              </p>
              <span className="text-[11px] text-slate-500 mt-2 block">Current academic month</span>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/70">
              <span className="text-xs font-mono uppercase text-slate-400">Outstanding Balance</span>
              <p className="text-2xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
                {(data?.metrics.outstanding_payments || 0).toLocaleString()} UZS
              </p>
              <span className="text-[11px] text-slate-500 mt-2 block">Accounts requiring follow-up</span>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/70">
              <span className="text-xs font-mono uppercase text-slate-400">Verification Queue</span>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
                {data?.metrics.pending_payment_verifications || 0} Claims
              </p>
              <button
                type="button"
                onClick={() => navigate('/admin/payment-verification')}
                className="text-[11px] text-amber-300 hover:underline mt-2 block font-medium"
              >
                Review claims now &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div
            onClick={() => navigate('/admin/students')}
            className="p-5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer transition-colors"
          >
            <Users className="w-6 h-6 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Student Registry</h4>
            <p className="text-xs text-slate-400">Inspect full student database, tuition contracts, and balances.</p>
          </div>

          <div
            onClick={() => navigate('/admin/payments')}
            className="p-5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer transition-colors"
          >
            <CreditCard className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Financial Ledger</h4>
            <p className="text-xs text-slate-400">Review all cash and provider transactions with bank references.</p>
          </div>

          <div
            onClick={() => navigate('/admin/groups')}
            className="p-5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer transition-colors"
          >
            <GraduationCap className="w-6 h-6 text-indigo-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Cohort Deployments</h4>
            <p className="text-xs text-slate-400">Monitor teacher assignments, schedule rooms, and rosters.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
