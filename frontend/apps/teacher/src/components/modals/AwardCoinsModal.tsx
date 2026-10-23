import React, { useState } from 'react';
import {
  X,
  Coins,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Student, Lesson } from '../../types';
import { teacherService, MAX_COIN_REWARD_LIMIT } from '../../services/teacherService';

interface Props {
  student: Student | null;
  lesson?: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onAwarded: (studentId: string, newBalance: number, amountAwarded: number, reason: string) => void;
}

const PRESET_REASONS = [
  'Darsga o‘z vaqtida keldi (Davomat: Bor)',
  'Kechikdi — 5 daqiqagacha kechikkan',
  'Kechikdi — 5 daqiqadan ko‘p kechikkan',
  'Darsdagi faol ishtiroki uchun (Active participation)',
  'Savolga to‘g‘ri va asosli javob uchun (Correct answer)',
  'Uy vazifasini a’lo darajada bajargan (Completed homework)',
  'Darsdagi yuqori natija va intizom (Excellent performance)',
  'Tengdoshiga yordam berganlik uchun (Helping classmates)',
  'Boshqa sabab (Other)',
];

const PRESET_AMOUNTS = [1, 2, 5, 10, 15, 20, 25, 50];

export const AwardCoinsModal: React.FC<Props> = ({
  student,
  lesson,
  isOpen,
  onClose,
  onAwarded,
}) => {
  const [amount, setAmount] = useState<number>(2);
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    if (reason === 'Darsga o‘z vaqtida keldi (Davomat: Bor)' || reason === 'Kechikdi — 5 daqiqagacha kechikkan') {
      setAmount(2);
    } else if (reason === 'Kechikdi — 5 daqiqadan ko‘p kechikkan') {
      setAmount(1);
    }
  };

  const handleAmountChange = (val: number) => {
    if (isNaN(val)) {
      setAmount(0);
    } else {
      setAmount(Math.min(Math.max(0, val), MAX_COIN_REWARD_LIMIT));
    }
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    if (!amount || amount <= 0) {
      setErrorMsg('Coin miqdori kamida 1 bo‘lishi kerak.');
      return;
    }

    if (amount > MAX_COIN_REWARD_LIMIT) {
      setErrorMsg(`Bitta rag‘batlantirish uchun maksimal miqdor: ${MAX_COIN_REWARD_LIMIT} coin.`);
      return;
    }

    const finalReason =
      selectedReason === 'Boshqa sabab (Other)'
        ? customReason.trim()
        : selectedReason;

    if (!finalReason) {
      setErrorMsg('Iltimos, rag‘batlantirish sababini yozing.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await teacherService.awardCoins(
        student.id,
        amount,
        finalReason,
        comment.trim() || undefined,
        lesson?.id
      );

      setIsSubmitting(false);
      onAwarded(student.id, res.new_balance, amount, finalReason);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Tangalarni berishda xatolik yuz berdi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Talabaga Coin Berish</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Rag‘batlantirish va faollik uchun tangalar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. Student Info (Read-only) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Talaba F.I.Sh (Read-only)
              </span>
              <span className="font-bold text-slate-900 text-sm">{student.full_name}</span>
              <span className="text-[11px] text-slate-500 font-mono block">
                {student.student_code} · {student.group_name}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Joriy Balans
              </span>
              <div className="flex items-center justify-end gap-1.5 font-mono font-extrabold text-amber-600 text-base">
                <Coins className="w-4 h-4" />
                <span>{student.coins_balance || 0}</span>
              </div>
            </div>
          </div>

          {/* 2. Number of coins */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800">
                Beriladigan coin miqdori <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Maksimal: {MAX_COIN_REWARD_LIMIT} coin
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min={1}
                max={MAX_COIN_REWARD_LIMIT}
                value={amount}
                onChange={(e) => handleAmountChange(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 font-semibold font-mono text-xs">
                COIN
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 font-medium mr-1">Tezkor:</span>
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAmountChange(val)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                    amount === val
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Reward Reason */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Rag‘batlantirish sababi <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => handleReasonSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
            >
              {PRESET_REASONS.map((reason, idx) => (
                <option key={idx} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            {selectedReason === 'Boshqa sabab (Other)' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Sababni aniq yozing..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 text-xs"
                  required
                />
              </div>
            )}
          </div>

          {/* 4. Optional Teacher Comment */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              O‘qituvchi izohi (Ixtiyoriy)
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="masalan: Algoritmni sinfda eng birinchi bo‘lib tushuntirib berdi..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 text-xs"
            />
          </div>

          {/* Calculation Preview */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
            <span className="font-medium">Yangi kutilayotgan balans:</span>
            <span className="font-mono font-bold text-amber-800 text-xs">
              {(student.coins_balance || 0)} + {amount || 0} = {(student.coins_balance || 0) + (amount || 0)} coin
            </span>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Berilmoqda...' : `+${amount} Coin Berish`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
