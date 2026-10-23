import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Building2,
  Download,
  Calendar,
  Phone,
  MessageSquare,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, Payment } from '../../types';
import { StudentApiService } from '../../services/studentApi';
import { useToast } from '../../context/ToastContext';

export const StudentPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyFee, setMonthlyFee] = useState(1200000);
  const [paymentStatus, setPaymentStatus] = useState<string>('paid');

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [inquiryText, setInquiryText] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);

  const loadPayments = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const res = await StudentApiService.getStudentPayments(student.id);
      setPayments(res.payments);
      setMonthlyFee(res.monthlyFee);
      setPaymentStatus(res.status);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [student?.id]);

  if (!student) return null;

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleSendAccountingInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    setSendingInquiry(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      success('So‘rov yuborildi', 'Buxgalteriya bo‘limi tez orada siz bilan bog‘lanadi.');
      setInquiryText('');
      setContactModalOpen(false);
    } catch {
      error('Xatolik', 'So‘rovni yuborib bo‘lmadi');
    } finally {
      setSendingInquiry(false);
    }
  };

  const formatUZS = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Moliyaviy Hisob-Kitob</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            To‘lov Ma’lumotlari
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Kurs: <strong className="text-white">{student.courseName}</strong> · Guruh:{' '}
            <strong className="text-cyan-300">{student.groupName}</strong>
          </p>
        </div>

        <button
          onClick={() => setContactModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-xs transition-colors shrink-0"
        >
          Buxgalteriyaga murojaat
        </button>
      </div>

      {/* Payment Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Tuition */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Oylik O‘quv To‘lovi
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatUZS(monthlyFee)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Har oyning 10-sanasigacha</p>
        </div>

        {/* Current Payment Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            To‘lov Holati
          </span>
          <div className="mt-2">
            {paymentStatus === 'paid' && (
              <span className="inline-flex items-center gap-1.5 text-base font-bold text-emerald-700 font-mono">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>To‘langan (Qarzdorlik yo‘q)</span>
              </span>
            )}
            {paymentStatus === 'pending' && (
              <span className="inline-flex items-center gap-1.5 text-base font-bold text-amber-700 font-mono">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Kutilmoqda (Muddat yaqin)</span>
              </span>
            )}
            {paymentStatus === 'overdue' && (
              <span className="inline-flex items-center gap-1.5 text-base font-bold text-rose-700 font-mono">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Qarzdorlik mavjud</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Joriy o‘quv oyi uchun</p>
        </div>

        {/* Total Payments Made */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Jami Amalga Oshirilgan
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {formatUZS(totalPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tasdiqlangan kvitansiyalar bo‘yicha</p>
        </div>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Moliyaviy xavfsizlik:</strong> Ushbu sahifa faqat sizning shaxsiy to‘lov tarixingizni ko‘rsatadi. Boshqa talabalarning moliyaviy hisobotlari to‘liq sir saqlanadi. Kvitansiya yoki hisob raqami masalasida o‘quv markaz buxgalteriyasiga murojaat qilishingiz mumkin.
        </p>
      </div>

      {/* Payment Receipts History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">To‘lovlar Tarixi & Kvitansiyalar</h3>
          <p className="text-xs text-slate-500">Bank va to‘lov tizimlari orqali tasdiqlangan to‘lovlar</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">Kvitansiya / Chek</th>
                <th className="px-5 py-3 font-semibold">To‘lov Miqdori</th>
                <th className="px-5 py-3 font-semibold">To‘lov Usuli</th>
                <th className="px-5 py-3 font-semibold">Holati</th>
                <th className="px-5 py-3 font-semibold text-right">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Hozircha to‘lov yozuvlari topilmadi
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900">
                        {payment.receiptNumber || 'REC-' + payment.id.slice(-6)}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-sans">
                        {payment.courseName}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900 text-sm">
                      {formatUZS(payment.amount)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {payment.method}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {payment.status === 'paid' && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          Qabul qilingan
                        </span>
                      )}
                      {payment.status === 'pending' && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          Tekshirilmoqda
                        </span>
                      )}
                      {payment.status === 'overdue' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                          Muddati o‘tgan
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono text-slate-500 text-[11px]">
                      {payment.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accounting Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Buxgalteriya bo‘limiga murojaat
              </h3>
              <button
                onClick={() => setContactModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendAccountingInquiry} className="py-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 space-y-1">
                <p>
                  <strong>Avlod Ta’lim Moliya Bo‘limi:</strong>
                </p>
                <p>Telefon: +998 71 200 45 45</p>
                <p>Ish vaqti: Dushanba - Shanba, 09:00 - 18:00</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Murojaat mazmuni (Kvitansiya tekshirish yoki hisob raqam so‘rovi):
                </label>
                <textarea
                  rows={4}
                  required
                  value={inquiryText}
                  onChange={e => setInquiryText(e.target.value)}
                  placeholder="To‘lov cheki yoki summa bo‘yicha savolingizni yozing..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={sendingInquiry || !inquiryText.trim()}
                  className="px-4 py-2 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {sendingInquiry ? 'Yuborilmoqda...' : 'Murojaatni jo‘natish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
