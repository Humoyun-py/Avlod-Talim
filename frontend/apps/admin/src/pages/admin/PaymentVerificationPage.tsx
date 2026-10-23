import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
  Calendar,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Payment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const PaymentVerificationPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review states
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [paymentToApprove, setPaymentToApprove] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPendingVerifications();
      setPayments(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load verification queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApproveConfirm = async () => {
    if (!paymentToApprove) return;

    setProcessing(true);
    try {
      await api.verifyPayment(paymentToApprove.id, 'approve');
      showToast(
        `Payment ${paymentToApprove.reference} verified and approved. Student tuition balance updated.`,
        'success'
      );
      setPaymentToApprove(null);
      fetchQueue();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve payment.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      showToast('Please provide a specific rejection reason for the student record.', 'error');
      return;
    }

    setProcessing(true);
    try {
      await api.verifyPayment(selectedPayment.id, 'reject', rejectionReason.trim());
      showToast(`Payment ${selectedPayment.reference} has been rejected.`, 'info');
      setIsRejectModalOpen(false);
      setRejectionReason('');
      fetchQueue();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject payment.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Payment Verification Queue</h2>
          <p className="text-xs text-slate-500">
            Reconcile electronic transfers (Click, Payme, Uzum) against uploaded bank receipts
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-950 text-xs flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-900">Official Banking Reconciliation Workflow</p>
          <p className="text-amber-800 leading-relaxed">
            Verify the bank transaction code, date, and exact amount on the uploaded receipt against your commercial bank statement. Approving a claim automatically credits the student's tuition ledger and unlocks restricted accounts.
          </p>
        </div>
      </div>

      {/* Verification Queue Grid */}
      {loading ? (
        <LoadingState message="Loading pending payment claims..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchQueue} />
      ) : payments.length === 0 ? (
        <EmptyState
          title="Verification queue is clear"
          description="There are currently no pending electronic payment claims requiring verification."
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {p.reference}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{p.student_name}</h3>
                    <span className="font-mono text-[11px] text-slate-400 block">{p.student_code}</span>
                  </div>

                  <span className="font-mono text-xs uppercase font-bold text-slate-700 bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded">
                    {p.payment_method}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs mb-3">
                  <div>
                    <span className="text-[11px] text-slate-400">Claimed Amount</span>
                    <p className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      {p.amount.toLocaleString()} UZS
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400">Submitted Date</span>
                    <p className="font-mono text-slate-700">{p.payment_date}</p>
                  </div>
                </div>

                {p.note && (
                  <p className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded border border-slate-100 italic mb-3">
                    "{p.note}"
                  </p>
                )}

                {/* Receipt Preview Thumbnail */}
                {p.receipt_url ? (
                  <div
                    onClick={() => {
                      setSelectedPayment(p);
                      setIsReceiptModalOpen(true);
                    }}
                    className="flex items-center gap-3 p-2 bg-slate-100/70 hover:bg-slate-200/70 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                  >
                    <img
                      src={p.receipt_url}
                      alt="Receipt Thumbnail"
                      className="w-12 h-12 object-cover rounded border border-slate-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Click to Inspect Receipt
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Verify bank timestamp and terminal ID
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-400 text-center">
                    No receipt image attached
                  </div>
                )}
              </div>

              {/* Review Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayment(p);
                    setRejectionReason('');
                    setIsRejectModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Claim</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentToApprove(p)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Credit Balance</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INSPECT RECEIPT MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Inspect Electronic Transfer Receipt"
        subtitle={selectedPayment ? `${selectedPayment.reference} · ${selectedPayment.student_name}` : ''}
        maxWidth="2xl"
      >
        {selectedPayment && selectedPayment.receipt_url && (
          <div className="space-y-4 text-xs">
            <div className="p-2 bg-slate-900 rounded-xl flex items-center justify-center max-h-[500px] overflow-hidden">
              <img
                src={selectedPayment.receipt_url}
                alt="Bank Receipt Full View"
                className="max-h-[460px] object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100">
              <span className="font-mono">
                Claim: {selectedPayment.amount.toLocaleString()} UZS ({selectedPayment.payment_method.toUpperCase()})
              </span>
              <a
                href={selectedPayment.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-900 hover:underline"
              >
                Open in Full Window &rarr;
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* REJECT CLAIM MODAL */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Payment Claim"
        subtitle={selectedPayment ? `Rejecting ${selectedPayment.reference}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Please enter a formal reason for rejecting this payment claim. This justification will be recorded in the student's transaction ledger.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Transaction code not found on merchant banking statement for 2026-03-09."
              required
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={processing}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
            >
              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* APPROVE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!paymentToApprove}
        onClose={() => setPaymentToApprove(null)}
        onConfirm={handleApproveConfirm}
        title="Confirm Payment Verification?"
        message={`Are you sure you have verified the receipt for ${paymentToApprove?.student_name} of ${paymentToApprove?.amount.toLocaleString()} UZS via ${paymentToApprove?.payment_method.toUpperCase()}? This will credit the student's balance and finalize the transaction.`}
        confirmLabel="Approve & Clear Tuition"
        isDestructive={false}
        isLoading={processing}
      />
    </div>
  );
};
