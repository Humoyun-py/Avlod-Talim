import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  PlusCircle,
  Receipt,
  Upload,
  FileCheck2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Loader2,
  UserCheck,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import { Payment, Student } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(searchParams.get('action') === 'register');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Register Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'click' | 'payme' | 'uzum'>('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, stdRes] = await Promise.all([
        api.getPayments({
          search: search.trim() || undefined,
          method: methodFilter !== 'all' ? methodFilter : undefined,
          verification_status: verificationFilter !== 'all' ? verificationFilter : undefined,
        }),
        api.getStudents({ page_size: 100 }),
      ]);
      setPayments(payRes.results || []);
      setStudents(stdRes.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, methodFilter, verificationFilter]);

  // When selected student changes in Register modal, prefill balance
  const activeStudent = students.find((s) => s.id === selectedStudentId);

  const handleStudentSelect = (sid: string) => {
    setSelectedStudentId(sid);
    const target = students.find((s) => s.id === sid);
    if (target) {
      setAmount(target.balance_due > 0 ? target.balance_due : target.monthly_fee);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setReceiptPreviewUrl(url);
      } else {
        setReceiptPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPreviewUrl(null);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !amount || amount <= 0) {
      showToast('Please select a student and enter a valid positive payment amount.', 'error');
      return;
    }

    if (paymentMethod !== 'cash') {
      showToast('Online payment receipt upload is not supported by the configured Django API yet.', 'error');
      return;
    }

    setRegistering(true);
    try {
      const newPayment = await api.registerPayment({
        student_id: selectedStudentId,
        amount,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        note: note.trim() || undefined,
        receipt_url: null,
      });

      if (paymentMethod !== 'cash') {
        showToast('Online payments are submitted for review; they do not increase the paid balance until approval.', 'info');
      }

      if (paymentMethod === 'cash') {
        showToast(
          `Cash payment of ${amount.toLocaleString()} UZS recorded and balance updated.`,
          'success'
        );
      } else {
        showToast(
          `Payment claim ${newPayment.reference} submitted to the verification queue.`,
          'info'
        );
      }

      setIsRegisterOpen(false);
      // Reset form
      setSelectedStudentId('');
      setAmount(0);
      setNote('');
      handleRemoveFile();
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register payment.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tuition & Payments Ledger</h2>
          <p className="text-xs text-slate-500">
            Financial transactions, reconciliation, receipt uploads, and cash receipts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/admin/payment-verification')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4 text-amber-600" />
            <span>Verification Queue</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Register Payment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by reference (PAY-...), student name, or ID..."
          />

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="payme">Payme</option>
            <option value="click">Click</option>
            <option value="uzum">Uzum</option>
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Verification Statuses</option>
            <option value="approved">Approved & Confirmed</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading financial transactions from database..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="Register a student payment or adjust your filter selection."
            actionLabel="Register Payment"
            onAction={() => setIsRegisterOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Registered By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Reference */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      {payment.reference}
                    </td>

                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{payment.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{payment.student_code}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {payment.amount.toLocaleString()} UZS
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded">
                        {payment.payment_method}
                      </span>
                    </td>

                    {/* Payment Date */}
                    <td className="py-3 px-4 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                      {payment.payment_date}
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={payment.verification_status} type="verification" />
                    </td>

                    {/* Registered By */}
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[160px]">
                      {payment.registered_by}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsDetailOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTER PAYMENT MODAL */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          handleRemoveFile();
        }}
        title="Register Student Payment"
        subtitle="Accept direct cash tuition or submit electronic receipt claim for director verification"
        maxWidth="xl"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          {/* Student Selector */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Student *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            >
              <option value="">Select student from roster...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.student_id}) · Due: {s.balance_due.toLocaleString()} UZS
                </option>
              ))}
            </select>
          </div>

          {/* Student financial context strip if selected */}
          {activeStudent && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] text-slate-400">Course & Group</span>
                <p className="font-semibold text-slate-800 truncate">{activeStudent.course_name}</p>
                <p className="font-mono text-[10px] text-slate-500">{activeStudent.group_name}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Monthly Tuition</span>
                <p className="font-mono font-semibold text-slate-900 tabular-nums">
                  {activeStudent.monthly_fee.toLocaleString()} UZS
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Current Balance Due</span>
                <p className="font-mono font-bold text-rose-700 tabular-nums">
                  {activeStudent.balance_due.toLocaleString()} UZS
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Amount (UZS) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="e.g. 50000 or 1200000"
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
              {activeStudent && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400">Quick set:</span>
                  {activeStudent.balance_due > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(activeStudent.balance_due)}
                      className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded font-mono font-medium transition-colors cursor-pointer"
                    >
                      Full Balance ({activeStudent.balance_due.toLocaleString()})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAmount(activeStudent.monthly_fee)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-mono font-medium transition-colors cursor-pointer"
                  >
                    Tuition ({activeStudent.monthly_fee.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(50000)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-mono font-medium transition-colors cursor-pointer"
                  >
                    50,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(100000)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-mono font-medium transition-colors cursor-pointer"
                  >
                    100,000
                  </button>
                </div>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['cash', 'click', 'payme', 'uzum'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-2.5 rounded-lg border text-center font-semibold text-xs uppercase font-mono transition-all ${
                    paymentMethod === method
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Electronic Transfer Receipt Upload Notice & Field */}
          {paymentMethod !== 'cash' ? (
            <div className="space-y-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
              <div className="flex items-start gap-2 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Electronic transfers require a bank transfer receipt. The payment will enter the <strong>Payment Verification Queue</strong> for banking statement reconciliation before tuition balance is cleared.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Upload Receipt (Screenshot or PDF) *
                </label>

                {!receiptFile ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 bg-white transition-colors">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-700">Choose receipt file to upload</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or PDF up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {receiptPreviewUrl ? (
                        <img
                          src={receiptPreviewUrl}
                          alt="Receipt Preview"
                          className="w-10 h-10 object-cover rounded border border-slate-200"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-500" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{receiptFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {(receiptFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-emerald-950 text-[11px] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                Cash payments collected directly at the academy reception will be verified immediately upon registration and will instantly update the student's payment balance.
              </p>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Administration Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Receipt #542 issued at front desk"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsRegisterOpen(false);
                handleRemoveFile();
              }}
              disabled={registering}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Receipt className="w-3.5 h-3.5" />}
              <span>{paymentMethod === 'cash' ? 'Register Cash Receipt' : 'Submit for Verification'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* PAYMENT DETAILS MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Transaction Record"
        subtitle={selectedPayment?.reference}
        maxWidth="lg"
      >
        {selectedPayment && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400">Student</span>
                <p className="font-semibold text-slate-900">{selectedPayment.student_name}</p>
                <p className="font-mono text-slate-500">{selectedPayment.student_code}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Amount Paid</span>
                <p className="font-mono font-bold text-base text-slate-900 tabular-nums">
                  {selectedPayment.amount.toLocaleString()} UZS
                </p>
                <span className="font-mono uppercase text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                  {selectedPayment.payment_method}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-mono text-slate-800">{selectedPayment.payment_date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Verification Status:</span>
                <StatusBadge status={selectedPayment.verification_status} type="verification" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registered By:</span>
                <span className="text-slate-800">{selectedPayment.registered_by}</span>
              </div>

              {selectedPayment.reviewed_by && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reviewed / Verified By:</span>
                  <span className="text-slate-800">{selectedPayment.reviewed_by}</span>
                </div>
              )}

              {selectedPayment.rejection_reason && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                  <span className="font-semibold block mb-0.5">Rejection Justification:</span>
                  <p>{selectedPayment.rejection_reason}</p>
                </div>
              )}

              {selectedPayment.note && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  <span className="font-semibold block mb-0.5">Notes:</span>
                  <p>{selectedPayment.note}</p>
                </div>
              )}
            </div>

            {/* Receipt Viewer if electronic */}
            {selectedPayment.receipt_url && (
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800 block mb-2">Uploaded Bank Receipt</span>
                <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 text-center">
                  <img
                    src={selectedPayment.receipt_url}
                    alt="Payment receipt proof"
                    className="max-h-64 mx-auto rounded-lg object-contain shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <a
                    href={selectedPayment.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 inline-block mt-2"
                  >
                    Open Full Image in New Tab &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
