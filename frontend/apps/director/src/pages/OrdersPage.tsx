import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Search,
  CheckCircle2,
  XCircle,
  Coins,
  Check,
  X,
  Eye,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { OrderStatus, ShopOrder } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export const OrdersPage: React.FC = () => {
  const { t } = useLanguage();
  const { success, error, info } = useToast();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View Details Modal
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await DirectorService.getOrders();
      setOrders(data);
    } catch {
      error('Xatolik', 'Buyurtmalar ro‘yxatini yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoadingId(orderId);
    try {
      const updated = await DirectorService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      window.dispatchEvent(new Event('orders-updated'));
      
      if (newStatus === 'Accepted') {
        success('Buyurtma qabul qilindi', `${updated.studentName} ning buyurtmasi tasdiqlandi`);
      } else if (newStatus === 'Completed') {
        success('Topshirildi', `${updated.studentName} ga mahsulot muvaffaqiyatli topshirildi`);
      } else if (newStatus === 'Rejected') {
        info('Rad etildi', `${updated.studentName} ning buyurtmasi rad etildi`);
      }
    } catch {
      error('Xatolik', 'Buyurtma holatini yangilashda xatolik yuz berdi');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('orders.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('orders.subtitle')}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('orders.search_placeholder')}
            className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden"
          />
        </div>

        <div className="flex bg-[#F8F8FC] p-1 rounded-xl border border-gray-200 text-xs font-semibold w-full sm:w-auto overflow-x-auto">
          {['all', 'Pending', 'Accepted', 'Completed', 'Rejected'].map(st => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-[#5C42FD] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {st === 'all'
                ? t('common.all')
                : st === 'Pending'
                ? t('status.pending')
                : st === 'Accepted'
                ? t('status.accepted')
                : st === 'Completed'
                ? t('status.completed')
                : t('status.rejected')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title={t('common.empty')}
          description="Hozircha hech qanday buyurtma ro‘yxatga olinmagan."
          icon={PackageCheck}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FE] text-gray-500 font-bold border-b border-[#F0F1F7] tracking-wider uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-4">{t('nav.orders')}</th>
                  <th className="px-6 py-4">{t('dashboard.th_student')}</th>
                  <th className="px-6 py-4">{t('dashboard.th_product')}</th>
                  <th className="px-6 py-4 text-center">{t('dashboard.th_coins')}</th>
                  <th className="px-6 py-4">{t('dashboard.th_date')}</th>
                  <th className="px-6 py-4">{t('dashboard.th_status')}</th>
                  <th className="px-6 py-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedOrders.map(order => {
                  const isProcessing = actionLoadingId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-[#FAF9FE] transition-colors">
                      {/* Order Number */}
                      <td className="px-6 py-3.5 font-mono font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="hover:text-[#5C42FD] hover:underline cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{order.orderNumber}</span>
                          <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-[#5C42FD]" />
                        </button>
                      </td>

                      {/* Student */}
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-gray-900">{order.studentName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">ID: {order.studentPublicId}</div>
                      </td>

                      {/* Product */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                          <span className="font-medium text-gray-800 truncate max-w-[160px]">
                            {order.productName}
                          </span>
                        </div>
                      </td>

                      {/* Coin */}
                      <td className="px-6 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{order.coinAmount} coin</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                        {order.date}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        <StatusBadge status={order.status} size="sm" />
                      </td>

                      {/* Direct One-Click Actions */}
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleStatusChange(order.id, 'Accepted')}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 text-xs disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isProcessing ? '...' : 'Tasdiqlash'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleStatusChange(order.id, 'Rejected')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 text-xs disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{isProcessing ? '...' : 'Rad etish'}</span>
                              </button>
                            </>
                          )}

                          {order.status === 'Accepted' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(order.id, 'Completed')}
                              className="px-3 py-1.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-xs disabled:opacity-50"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>{isProcessing ? 'Bajarilmoqda...' : 'Topshirildi'}</span>
                            </button>
                          )}

                          {(order.status === 'Completed' || order.status === 'Rejected') && (
                            <span className="text-gray-400 text-xs font-medium px-2 py-1 bg-gray-50 rounded-lg">
                              {order.status === 'Completed' ? 'Topshirilgan' : 'Rad etilgan'}
                            </span>
                          )}

                          {/* Quick View Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-gray-400 hover:text-[#5C42FD] hover:bg-[#5C42FD]/10 rounded-lg transition-colors cursor-pointer"
                            title="Batafsil ko‘rish"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Buyurtma: ${selectedOrder.orderNumber}`}
          subtitle="Mahsulot buyurtmasi to‘liq ma’lumotlari"
          maxWidth="md"
        >
          <div className="space-y-5">
            {/* Product Header Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F8F8FC] border border-[#E9EAF3]">
              <img
                src={selectedOrder.productImage}
                alt={selectedOrder.productName}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">
                  {selectedOrder.productName}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs">
                    <Coins className="w-3 h-3" />
                    <span>{selectedOrder.coinAmount} coin</span>
                  </span>
                  <StatusBadge status={selectedOrder.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Info Details List */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  O‘quvchi
                </span>
                <p className="font-bold text-gray-900">{selectedOrder.studentName}</p>
                <p className="text-[11px] font-mono text-gray-500">ID: {selectedOrder.studentPublicId}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Buyurtma sanasi
                </span>
                <p className="font-bold text-gray-900">{selectedOrder.date}</p>
                <p className="text-[11px] text-gray-500">Avlod Ta‘lim Shop</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
              {selectedOrder.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedOrder.id, 'Rejected')}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Rad etish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedOrder.id, 'Accepted')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Tasdiqlash</span>
                  </button>
                </>
              )}

              {selectedOrder.status === 'Accepted' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedOrder.id, 'Completed')}
                  className="px-5 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Topshirildi (Complete)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer text-xs"
              >
                Yopish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
