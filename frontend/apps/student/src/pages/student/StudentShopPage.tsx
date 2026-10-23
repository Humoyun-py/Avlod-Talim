import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Coins,
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  X,
  Eye,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, Product, ShopOrder } from '../../types';
import { StudentApiService } from '../../services/studentApi';
import { useToast } from '../../context/ToastContext';

export const StudentShopPage: React.FC = () => {
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;
  const { success, error } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Purchase modal
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const [purchasePassword, setPurchasePassword] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccessOrder, setPurchaseSuccessOrder] = useState<ShopOrder | null>(null);

  // Product detail view modal
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const loadShopData = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const [prods, myOrders] = await Promise.all([
        StudentApiService.getShopProducts(),
        StudentApiService.getStudentOrders(student.id)
      ]);
      setProducts(prods);
      setOrders(myOrders);
    } catch (err) {
      console.error('Shop loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, [student?.id]);

  useEffect(() => {
    window.addEventListener('orders-updated', loadShopData);
    window.addEventListener('students-updated', loadShopData);
    return () => {
      window.removeEventListener('orders-updated', loadShopData);
      window.removeEventListener('students-updated', loadShopData);
    };
  }, [student?.id]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handlePurchase = async (password: string) => {
    if (!confirmProduct || !student) return;
    setPurchasing(true);
    try {
      const res = await StudentApiService.purchaseProductWithPassword(confirmProduct.id, password);
      success('Xarid amalga oshirildi!', `"${confirmProduct.name}" buyurtma qilindi.`);
      setPurchaseSuccessOrder(res.order);
      setConfirmProduct(null);
      setPurchasePassword('');
      await loadShopData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xarid qilishda xatolik yuz berdi';
      error('Xarid amalga oshmadi', msg);
    } finally {
      setPurchasing(false);
    }
  };

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Avlod Ta’lim Rasmiy Merch Do‘koni</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Coinlaringizni haqiqiy sovg‘alarga almashtiring
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
            Darslardagi a’lo natijalaringiz va faolligingiz evaziga to‘plagan coinlaringiz orqali buyurtma bering.
          </p>
        </div>

        {/* Live Balance Box */}
        <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-right shrink-0">
          <span className="text-[11px] text-slate-400 font-medium block">Sizdagi coinlar miqdori:</span>
          <div className="flex items-center justify-end gap-1.5 font-mono font-bold text-2xl text-amber-300">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>{student.coins}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Active Tabs */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mahsulotlar katalogi ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Mening Buyurtmalarim</span>
            {orders.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-bold">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Search & Categories (shown on catalog tab) */}
        {activeTab === 'catalog' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Mahsulot nomi bo‘yicha..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700"
            >
              <option value="all">Barcha toifalar</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Catalog View */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Mos keluvchi mahsulotlar topilmadi
            </div>
          ) : (
            filteredProducts.map(product => {
              const canAfford = student.coins >= product.coinPrice;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all group"
                >
                  {/* Image area with safe fallback container */}
                  <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 -z-10">
                      <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-[10px] mt-1 text-slate-500">{product.name}</span>
                    </div>

                    {/* Stock Tag */}
                    <div className="absolute top-3 left-3">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                          Tugagan
                        </span>
                      ) : product.stock < 5 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-900">
                          Faqat {product.stock} ta qoldi
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                          Mavjud ({product.stock} dona)
                        </span>
                      )}
                    </div>

                    {/* Category Label */}
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-800 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Narxi:</span>
                        <div className="font-mono font-bold text-base text-slate-900 flex items-center gap-1">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>{product.coinPrice} coin</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewProduct(product)}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="Tafsilotlar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          disabled={!canAfford || isOutOfStock}
                          onClick={() => setConfirmProduct(product)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : !canAfford
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-[#0F172A] hover:bg-slate-800 text-white shadow-xs cursor-pointer'
                          }`}
                          title={
                            !canAfford
                              ? `Coin yetarli emas (${product.coinPrice - student.coins} coin kerak)`
                              : undefined
                          }
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Sotib olish</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Orders View */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Mening Buyurtmalarim</h3>
            <p className="text-xs text-slate-500">
              Buyurtmangiz tasdiqlangach, uni o‘quv markazining ma’muriyat bo‘limidan olib ketishingiz mumkin.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Buyurtma Kodi</th>
                  <th className="px-5 py-3 font-semibold">Mahsulot</th>
                  <th className="px-5 py-3 font-semibold">Sarflangan Coin</th>
                  <th className="px-5 py-3 font-semibold">Holati</th>
                  <th className="px-5 py-3 font-semibold text-right">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                      Hozircha buyurtmalar mavjud emas
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {order.productName}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-700">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>{order.coinAmount}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {order.status === 'Pending' && (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                            Kutilmoqda
                          </span>
                        )}
                        {order.status === 'Accepted' && (
                          <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                            Qabul qilindi
                          </span>
                        )}
                        {order.status === 'Completed' && (
                          <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                            Yetkazildi / Topshirildi
                          </span>
                        )}
                        {order.status === 'Rejected' && (
                          <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                            Rad etildi
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {order.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Purchase Modal */}
      {confirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Xaridni tasdiqlash</h3>
              <button
                onClick={() => setConfirmProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{confirmProduct.name}</p>
                  <p className="text-xs text-slate-500 font-mono">Narxi: {confirmProduct.coinPrice} coin</p>
                </div>
              </div>
              <label className="block text-xs font-medium text-slate-700">Xaridni tasdiqlash uchun parolingizni kiriting
                <input type="password" value={purchasePassword} onChange={e => setPurchasePassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" autoComplete="current-password" />
              </label>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Joriy balansingiz:</span>
                  <span className="font-mono font-bold text-slate-900">{student.coins} coin</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Mahsulot narxi:</span>
                  <span className="font-mono font-bold text-rose-600">-{confirmProduct.coinPrice} coin</span>
                </div>
                <div className="flex justify-between py-1 text-slate-900 font-semibold">
                  <span>Xariddan keyingi qoldiq:</span>
                  <span className="font-mono text-cyan-700">
                    {student.coins - confirmProduct.coinPrice} coin
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                disabled={purchasing}
                onClick={() => handlePurchase(purchasePassword)}
                disabled={purchasing || !purchasePassword}
                className="px-4 py-2 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {purchasing ? 'Xarid qilinmoqda...' : 'Tasdiqlayman va xarid qilaman'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{viewProduct.name}</h3>
              <button
                onClick={() => setViewProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="h-44 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                {viewProduct.imageUrl ? (
                  <img
                    src={viewProduct.imageUrl}
                    alt={viewProduct.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-slate-400" />
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Tavsif</p>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{viewProduct.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Toifa:</span>
                  <span className="text-xs font-bold text-slate-900">{viewProduct.category}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Mavjudlik:</span>
                  <span className="text-xs font-bold text-slate-900">{viewProduct.stock} dona</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="font-mono font-bold text-lg text-slate-900">
                {viewProduct.coinPrice} <span className="text-xs font-sans text-slate-500">coin</span>
              </div>
              <button
                disabled={student.coins < viewProduct.coinPrice || viewProduct.stock <= 0}
                onClick={() => {
                  setConfirmProduct(viewProduct);
                  setViewProduct(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                Xarid qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
