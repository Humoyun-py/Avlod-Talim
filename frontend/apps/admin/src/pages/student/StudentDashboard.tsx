import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Coins,
  CreditCard,
  ShoppingBag,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Student, ShopProduct } from '../../types';
import { LoadingState } from '../../components/common/States';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [stdRes, prdRes] = await Promise.all([
          api.getStudents({ search: user?.username || '' }),
          api.getProducts(),
        ]);
        if (stdRes.results && stdRes.results.length > 0) {
          setStudent(stdRes.results[0]);
        }
        setProducts(prdRes.results || []);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/avlod_brand_mark_1792586439669.jpg"
              alt="Avlod Ta'lim"
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-emerald-500/40"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Avlod Student Portal</h1>
              <p className="text-xs text-slate-400 font-mono">Academic Learning & Rewards</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Student Profile Overview Box */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase">
                Enrolled Student ID: {user?.username}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{user?.full_name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {student?.course_name || 'Enrolled Academic Course'} · Group {student?.group_name || 'Assigned'}
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-700 self-start sm:self-auto">
              <Coins className="w-6 h-6 text-amber-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Coin Balance</span>
                <span className="text-lg font-bold font-mono text-white tabular-nums">
                  {student?.coin_balance || 100} Coins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Academic Standing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 uppercase font-mono">Tuition Status</span>
            <p className="text-base font-bold text-white mt-1 capitalize">
              {student?.payment_status?.replace('_', ' ') || 'Paid'}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Monthly: {student?.monthly_fee?.toLocaleString() || '1,200,000'} UZS
            </span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 uppercase font-mono">Current Balance Due</span>
            <p className={`text-base font-bold font-mono mt-1 tabular-nums ${student?.balance_due ? 'text-rose-400' : 'text-emerald-400'}`}>
              {(student?.balance_due || 0).toLocaleString()} UZS
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {student?.balance_due ? 'Please pay tuition at reception' : 'Tuition up to date'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 uppercase font-mono">Attendance Rate</span>
            <p className="text-base font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              {student?.attendance_percentage || 95}%
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Semester attendance record</span>
          </div>
        </div>

        {/* Store Rewards Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Academy Merchandise Rewards</span>
          </h3>
          <p className="text-xs text-slate-400">
            Earn coins through perfect homework submissions and high quiz performance to redeem exclusive items.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {products.slice(0, 3).map((p) => (
              <div key={p.id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-36 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-3 space-y-1">
                  <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-amber-400 font-mono font-bold">{p.coin_price} Coins</span>
                    <span className="text-[10px] text-slate-400">{p.stock_quantity} left</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
