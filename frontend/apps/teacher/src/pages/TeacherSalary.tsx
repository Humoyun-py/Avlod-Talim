import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { TeacherSalaryRecord } from '../types';
import { useAuth } from '../context/AuthContext';

export const TeacherSalaryPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<TeacherSalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSalary();
  }, []);

  const loadSalary = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getSalaryInfo();
      setRecords(data);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, curr = 'UZS') => {
    return amount.toLocaleString('uz-UZ') + ' ' + curr;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Oylik maosh va hisob-kitoblar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            O‘tilgan darslar soni, ustamalar va Direktsiya tomonidan tasdiqlangan to‘lov hisoboti
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <Info className="w-4 h-4 text-cyan-600" />
          <span>Faqat shaxsiy tasdiqlangan to‘lovlar</span>
        </div>
      </div>

      {/* Security and Transparency Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1.5 border border-slate-800">
        <div className="font-bold text-cyan-400 flex items-center gap-2 text-sm">
          <ShieldAlert className="w-4 h-4" />
          Avlod Ta’lim Maosh Hisoblash Qoidasi (RBAC):
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          O‘qituvchi oylik maoshi o‘tilgan va tasdiqlangan darslar soniga qarab tizimda avtomatik hisoblanadi hamda faqat <strong>Bosh Direktor</strong> tomonidan tekshirilib tasdiqlanadi. O‘qituvchilar o‘z stavkalarini yoki to‘lov statusini o‘zgartirish huquqiga ega emas.
        </p>
      </div>

      {/* Salary Records List */}
      <div className="space-y-4">
        {records.map((record) => {
          const isPaid = record.status === 'paid';
          const isPending = record.status === 'pending';

          return (
            <div
              key={record.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-cyan-400/60 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{record.month_name}</h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Darslar soni: {record.lessons_conducted} ta dars
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : isPending
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-cyan-100 text-cyan-800'
                    }`}
                  >
                    {isPaid ? 'To‘langan' : isPending ? 'Hisoblanmoqda (Joriy oy)' : 'Tasdiqlangan'}
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-mono font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(record.approved_amount, record.currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    1 dars uchun stavka
                  </span>
                  <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                    {formatCurrency(record.base_rate_per_lesson, record.currency)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    O‘tilgan darslar
                  </span>
                  <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                    {record.lessons_conducted} mashg‘ulot
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Ustama va bonus
                  </span>
                  <span className="font-mono font-bold text-emerald-600 mt-0.5 block">
                    +{formatCurrency(record.bonus_amount, record.currency)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    To‘lov usuli
                  </span>
                  <span className="text-slate-800 font-medium text-[11px] mt-0.5 block truncate">
                    {record.payment_method || 'Bank o‘tkazmasi'}
                  </span>
                </div>
              </div>

              {record.note && (
                <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  Izoh: {record.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
