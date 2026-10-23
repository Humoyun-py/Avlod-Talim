import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  RotateCcw,
  Coins,
  Search,
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';
import { ShopOrder, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';

export const ShopOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Status Update State
  const [newStatus, setNewStatus] = useState<OrderStatus>('processing');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Destructive cancel/reject confirmation
  const [orderToCancel, setOrderToCancel] = useState<{ order: ShopOrder; targetStatus: 'rejected' | 'cancelled' } | null>(null);

  const { showToast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getShopOrders({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setOrders(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load shop orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const openStatusModal = (ord: ShopOrder) => {
    setSelectedOrder(ord);
    setNewStatus(ord.status);
    setAdminNotes(ord.admin_notes || '');
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    // If changing to rejected or cancelled, trigger safety confirmation
    if (newStatus === 'rejected' || newStatus === 'cancelled') {
      setIsStatusModalOpen(false);
      setOrderToCancel({ order: selectedOrder, targetStatus: newStatus });
      return;
    }

    setUpdating(true);
    try {
      await api.updateOrderStatus(selectedOrder.id, newStatus, adminNotes.trim());
      showToast(`Order ${selectedOrder.order_number} status updated to ${newStatus}.`, 'success');
      setIsStatusModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const confirmDestructiveStatusChange = async () => {
    if (!orderToCancel) return;

    setUpdating(true);
    try {
      await api.updateOrderStatus(orderToCancel.order.id, orderToCancel.targetStatus, adminNotes.trim());
      showToast(
        `Order ${orderToCancel.order.order_number} ${orderToCancel.targetStatus}. ${orderToCancel.order.total_coins} coins refunded to student ledger.`,
        'info'
      );
      setOrderToCancel(null);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Shop Order Fulfillment</h2>
          <p className="text-xs text-slate-500">
            Process student merchandise redemptions, manage fulfillment stages, and inspect coin ledgers
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by order number (ORD-...), student name, or item..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Order Stages</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready for Pickup</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading fulfillment orders..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchOrders} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="Adjust search keywords or status filter to view orders."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Merchandise Item</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Coins</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      {ord.order_number}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ord.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{ord.student_code}</div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {ord.product_name}
                    </td>

                    <td className="py-3 px-4 text-center font-mono tabular-nums">
                      {ord.quantity}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 tabular-nums">
                      {ord.total_coins} Coins
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] tabular-nums whitespace-nowrap">
                      {new Date(ord.order_date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={ord.status} type="order" />
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsDetailOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="View order details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openStatusModal(ord)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          Update Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Order Status"
        subtitle={selectedOrder ? `${selectedOrder.order_number} · ${selectedOrder.product_name}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Fulfillment Pipeline Stage *
            </label>
            <div className="space-y-2">
              {[
                { val: 'pending', label: 'Pending Review', desc: 'Order placed, awaiting administrator approval' },
                { val: 'approved', label: 'Approved', desc: 'Verified and queued for warehouse preparation' },
                { val: 'processing', label: 'Processing', desc: 'Items being packed in admin store room' },
                { val: 'ready', label: 'Ready for Pickup', desc: 'Packaged and ready at academy reception desk' },
                { val: 'completed', label: 'Completed', desc: 'Handed to student in person' },
                { val: 'rejected', label: 'Reject Order', desc: 'Denies order and automatically refunds coins to student' },
                { val: 'cancelled', label: 'Cancel Order', desc: 'Cancels order and automatically refunds coins' },
              ].map((stage) => (
                <label
                  key={stage.val}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    newStatus === stage.val
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="order_stage"
                    value={stage.val}
                    checked={newStatus === stage.val}
                    onChange={() => setNewStatus(stage.val as OrderStatus)}
                    className="mt-0.5 text-slate-900"
                  />
                  <div>
                    <span className="font-semibold block">{stage.label}</span>
                    <span
                      className={`text-[11px] block ${
                        newStatus === stage.val ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {stage.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Storage / Admin Notes
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Placed in Locker A-4 with student name label"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={updating}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Order State</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ORDER DETAILS MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Shop Order Record"
        subtitle={selectedOrder?.order_number}
        maxWidth="md"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Order Status:</span>
                <StatusBadge status={selectedOrder.status} type="order" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Placed On:</span>
                <span className="font-mono text-slate-700">{new Date(selectedOrder.order_date).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Coins Deducted:</span>
                <span className="font-mono font-bold text-amber-700 tabular-nums">
                  {selectedOrder.total_coins} Coins
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Student Recipient</span>
              <p className="font-bold text-slate-900">{selectedOrder.student_name}</p>
              <p className="font-mono text-slate-500">{selectedOrder.student_code}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Ordered Merchandise</span>
              <p className="font-bold text-slate-900">{selectedOrder.product_name}</p>
              <p className="text-slate-600">Quantity: {selectedOrder.quantity} unit(s)</p>
            </div>

            {selectedOrder.admin_notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-0.5">Admin Notes</span>
                <p className="text-slate-700 italic">{selectedOrder.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CONFIRM REFUND / CANCELLATION DIALOG */}
      <ConfirmDialog
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={confirmDestructiveStatusChange}
        title={`Confirm ${orderToCancel?.targetStatus === 'rejected' ? 'Rejection' : 'Cancellation'} & Refund?`}
        message={`Are you sure you want to mark order ${orderToCancel?.order.order_number} as ${orderToCancel?.targetStatus}? This will trigger an automatic backend refund of ${orderToCancel?.order.total_coins} Coins to ${orderToCancel?.order.student_name}'s coin account balance and increment product inventory stock.`}
        confirmLabel={`Refund & Mark ${orderToCancel?.targetStatus}`}
        isDestructive={true}
        isLoading={updating}
      />
    </div>
  );
};
