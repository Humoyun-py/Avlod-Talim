import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  History,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Package,
} from 'lucide-react';
import { Student, CoinTransaction, ShopItem } from '../../types';
import { teacherService } from '../../services/teacherService';

interface Props {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdated?: (studentId: string, newBalance: number) => void;
}

export const StudentCoinHistoryModal: React.FC<Props> = ({
  student,
  isOpen,
  onClose,
  onBalanceUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'shop'>('history');
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(student?.coins_balance || 0);
  const [purchaseMsg, setPurchaseMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (student) {
      setCurrentBalance(student.coins_balance || 0);
      loadHistoryAndShop();
    }
  }, [student]);

  const loadHistoryAndShop = async () => {
    if (!student) return;
    const [txList, items] = await Promise.all([
      teacherService.getCoinTransactions(student.id),
      teacherService.getShopItems(),
    ]);
    setTransactions(txList);
    setShopItems(items);
  };

  if (!isOpen || !student) return null;

  const handlePurchase = async (item: ShopItem) => {
    setPurchaseMsg(null);
    try {
      const res = await teacherService.purchaseShopItem(student.id, item.id);
      setCurrentBalance(res.new_balance);
      setPurchaseMsg({
        success: true,
        text: `Tabriklaymiz! "${item.title}" xarid qilindi. -${item.cost_coins} coin yechildi.`,
      });
      if (onBalanceUpdated) {
        onBalanceUpdated(student.id, res.new_balance);
      }
      await loadHistoryAndShop();
    } catch (err: any) {
      setPurchaseMsg({
        success: false,
        text: err.message || 'Xaridni amalga oshirishda xatolik yuz berdi.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Talaba Tangalari (Student Coin & Shop)</h3>
              <p className="text-xs text-slate-400 font-mono">
                {student.full_name} · {student.student_code}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card Banner */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
              Joriy Coin Balansi
            </span>
            <div className="flex items-center gap-1.5 text-2xl font-mono font-extrabold text-amber-900 mt-0.5">
              <Coins className="w-6 h-6 text-amber-600" />
              <span>{currentBalance}</span>
              <span className="text-xs font-semibold text-amber-700 font-sans">Avlod Coin</span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-600 font-medium">
            <div>Guruhi: <strong className="text-slate-900">{student.group_name}</strong></div>
            <div className="text-[10px] text-slate-500">Avlod Ta’lim motivatsiya tizimi</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 pt-2 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Tranzaksiyalar tarixi ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'shop'
                ? 'border-amber-500 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Talaba Do‘koni (Coin Shop)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {purchaseMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                purchaseMsg.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {purchaseMsg.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{purchaseMsg.text}</span>
            </div>
          )}

          {activeTab === 'history' ? (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center p-8 text-slate-400">
                  Ushbu talabada hali tangalar tranzaksiyalari mavjud emas.
                </div>
              ) : (
                transactions.map((tx) => {
                  const isReward = tx.transaction_type === 'reward';

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isReward
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isReward ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-xs">{tx.reason}</div>
                          {tx.comment && (
                            <p className="text-[11px] text-slate-600 mt-0.5 italic">
                              &quot;{tx.comment}&quot;
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-1.5">
                            <span>{tx.created_at}</span>
                            <span>·</span>
                            <span>Ustoz: {tx.teacher_name}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
                          isReward
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isReward ? `+${tx.amount}` : tx.amount} coin
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600 text-xs">
                Talabalar to‘plagan tangalarini quyidagi brendli mahsulotlar va individual mentorlik mashg‘ulotlariga almashtirishlari mumkin:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shopItems.map((item) => {
                  const canAfford = currentBalance >= item.cost_coins && item.stock > 0;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400/80 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                          <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0 text-xs">
                            {item.cost_coins} coin
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Mavjud: {item.stock} dona
                        </span>
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={!canAfford}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Xarid qilish
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
