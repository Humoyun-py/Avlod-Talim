import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Award,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, CoinTransaction } from '../../types';
import { StudentApiService } from '../../services/studentApi';

export const StudentCoinsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;

  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<{ balance: number; totalEarned: number; totalSpent: number }>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0
  });
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'spent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadCoinData = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const [bal, txs] = await Promise.all([
        StudentApiService.getCoinBalance(student.id),
        StudentApiService.getCoinTransactions(student.id)
      ]);
      setBalanceData(bal);
      setTransactions(txs);
    } catch (err) {
      console.error('Error loading coin details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoinData();
  }, [student?.id]);

  useEffect(() => {
    window.addEventListener('coin-transactions-updated', loadCoinData);
    window.addEventListener('students-updated', loadCoinData);
    return () => {
      window.removeEventListener('coin-transactions-updated', loadCoinData);
      window.removeEventListener('students-updated', loadCoinData);
    };
  }, [student?.id]);

  // Filter & Search
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesType =
        filterType === 'all' ||
        (filterType === 'earned' && tx.operation === 'add') ||
        (filterType === 'spent' && tx.operation === 'subtract');

      const matchesSearch =
        tx.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.teacherName && tx.teacherName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.date.includes(searchQuery);

      return matchesType && matchesSearch;
    });
  }, [transactions, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance (Dominant) */}
        <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-cyan-400">Joriy Balans</span>
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-white">
              {balanceData.balance} <span className="text-sm font-sans font-medium text-slate-400">coin</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Avlod Ta’lim yagona markazlashgan hisobi
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
            <Link
              to="/student/shop"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Do‘konda sarflash &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider">Jami To‘plangan</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-emerald-600">
              +{balanceData.totalEarned}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Ustozlar tomonidan darsdagi faollik va topshiriqlar uchun berilgan
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Dars faolligi · Uy vazifalari · Olimpiada
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider">Jami Sarflangan</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-800">
              -{balanceData.totalSpent}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Avlod Brand Hoodie, aksessuar va gadjetlar xaridiga ishlatilgan
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Do‘kondagi barcha buyurtmalar bo‘yicha
          </div>
        </div>
      </div>

      {/* Security & Multi-Panel Transparency Notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-2.5 text-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p className="text-slate-700 leading-relaxed">
          <strong>Baza yaxlitligi:</strong> Talabalar o‘z coinlarini qo‘lda tahrirlay olmaydi yoki o‘ziga coin qo‘sha olmaydi.
          Barcha coinlar ustoz va direktor tomonidan tasdiqlangan holda avtomatik hisobga yoziladi.
        </p>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tranzaksiyalar Tarixi</h3>
            <p className="text-xs text-slate-500">Barcha hisoblangan va sarflangan coinlar balansi</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Sabab yoki sana bo‘yicha..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
              <button
                onClick={() => {
                  setFilterType('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Barchasi ({transactions.length})
              </button>
              <button
                onClick={() => {
                  setFilterType('earned');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filterType === 'earned' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Kirim (+)
              </button>
              <button
                onClick={() => {
                  setFilterType('spent');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filterType === 'spent' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Chiqim (-)
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">Turi</th>
                <th className="px-5 py-3 font-semibold">Miqdori</th>
                <th className="px-5 py-3 font-semibold">Sabab / Tavsif</th>
                <th className="px-5 py-3 font-semibold">Ustoz / Manba</th>
                <th className="px-5 py-3 font-semibold text-right">Sana va vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Mos keluvchi tranzaksiyalar topilmadi
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => {
                  const isEarned = tx.operation === 'add';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-semibold inline-flex items-center gap-1.5 ${
                            isEarned ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isEarned ? (
                            <>
                              <Award className="w-3.5 h-3.5" />
                              <span>Rag‘batlantirish</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Do‘kon xaridi</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-mono tabular-nums font-bold">
                        <span className={isEarned ? 'text-emerald-600 text-sm' : 'text-slate-900 text-sm'}>
                          {isEarned ? `+${tx.amount}` : `-${tx.amount}`}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 max-w-md">
                        <p className="font-semibold text-slate-900 truncate">{tx.reason}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Oldingi: {tx.previousBalance} &rarr; Keyingi: {tx.newBalance}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                        {tx.teacherName ? (
                          <span className="font-medium text-slate-900">{tx.teacherName}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Avlod Ta’lim do‘koni</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono text-slate-500 text-[11px]">
                        {tx.date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Sahifa <strong className="text-slate-900 font-mono">{currentPage}</strong> / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
