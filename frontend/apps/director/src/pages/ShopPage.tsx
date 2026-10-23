import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Coins,
  Package,
  Edit2,
  Trash2,
  UploadCloud,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  Tag,
  FolderPlus,
  X,
  Filter
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { Product } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { ImageUpload } from '../components/common/ImageUpload';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_CATEGORIES = [
  'Kiyim',
  'Aksessuarlar',
  'Gadjetlar',
  'Stikerlar',
  'Kantselyariya',
  'Kitoblar'
];

export const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  // Custom Categories saved in localStorage
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('avlod_custom_shop_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null
  });

  // Modal Category creation mode
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Form State (Product name, Coin price, Image upload/preview, Stock, Description)
  const [formData, setFormData] = useState({
    name: '',
    coinPrice: 300,
    imageUrl: '',
    stock: 20,
    category: 'Kiyim',
    description: '',
    status: 'in_stock' as Product['status']
  });

  // All combined available categories
  const allCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    customCategories.forEach(c => set.add(c));
    products.forEach(p => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [customCategories, products]);

  // Persist custom categories
  const saveCustomCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed) && !DEFAULT_CATEGORIES.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('avlod_custom_shop_categories', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleCreateCategoryInModal = () => {
    const cat = newCategoryInput.trim();
    if (!cat) {
      error('Kategoriya nomi bo‘sh', 'Iltimos, yangi kategoriya nomini yozing');
      return;
    }
    saveCustomCategory(cat);
    setFormData(prev => ({ ...prev, category: cat }));
    setNewCategoryInput('');
    setIsAddingNewCategory(false);
    success('Kategoriya qo‘shildi', `"${cat}" kategoriyasi ro‘yxatga kiritildi va tanlandi`);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await DirectorService.getProducts();
      setProducts(data);
    } catch {
      error('Xatolik', 'Do‘kon mahsulotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingOrders = async () => {
    try {
      const orders = await DirectorService.getOrders();
      setPendingOrdersCount(orders.filter(o => o.status === 'Pending').length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadProducts();
    loadPendingOrders();
    window.addEventListener('orders-updated', loadPendingOrders);
    window.addEventListener('storage', loadPendingOrders);
    return () => {
      window.removeEventListener('orders-updated', loadPendingOrders);
      window.removeEventListener('storage', loadPendingOrders);
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategoryFilter === 'all' ||
      p.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setFormData({
      name: '',
      coinPrice: 300,
      imageUrl: '',
      stock: 25,
      category: allCategories[0] || 'Kiyim',
      description: '',
      status: 'in_stock'
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setFormData({
      name: prod.name,
      coinPrice: prod.coinPrice,
      imageUrl: prod.imageUrl,
      stock: prod.stock,
      category: prod.category,
      description: prod.description,
      status: prod.status
    });
    setCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Xatolik', 'Mahsulot nomi kiritilishi shart');
      return;
    }

    if (!formData.imageUrl.trim()) {
      error('Rasm tanlanmadi', 'Iltimos, mahsulot rasmini kompyuterdan yuklang');
      return;
    }

    // Determine final category (if user is currently typing a new category in creation field)
    let finalCategory = formData.category.trim();
    if (isAddingNewCategory && newCategoryInput.trim()) {
      finalCategory = newCategoryInput.trim();
      saveCustomCategory(finalCategory);
    }

    if (!finalCategory) {
      finalCategory = 'Boshqa';
      saveCustomCategory(finalCategory);
    } else {
      saveCustomCategory(finalCategory);
    }

    const calculatedStatus: Product['status'] =
      formData.stock === 0 ? 'out_of_stock' : formData.stock <= 5 ? 'low_stock' : 'in_stock';

    try {
      if (editingProduct) {
        await DirectorService.updateProduct(editingProduct.id, {
          ...formData,
          category: finalCategory,
          status: calculatedStatus
        });
        success('Yangilandi', 'Mahsulot ma’lumotlari saqlandi');
      } else {
        await DirectorService.createProduct({
          ...formData,
          category: finalCategory,
          status: calculatedStatus
        });
        success('Muvaffaqiyatli', `Yangi tovar "${formData.name}" do‘konga qo‘shildi`);
      }
      setIsAddingNewCategory(false);
      setNewCategoryInput('');
      setCreateModalOpen(false);
      loadProducts();
    } catch {
      error('Xatolik', 'Mahsulotni saqlashda xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await DirectorService.deleteProduct(id);
      setDeleteConfirm({ isOpen: false, product: null });
      loadProducts();
      success('O‘chirildi', 'Mahsulot muvaffaqiyatli o‘chirildi');
    } catch {
      error('Xatolik', 'O‘chirishda xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('shop.title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('shop.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/director/coins')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span>{t('topbar.award_coins')}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/director/orders')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Package className="w-4 h-4 text-[#5C42FD]" />
            <span>{t('nav.orders')}</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#5C42FD]/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('shop.new_product')}</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('shop.search_placeholder')}
              className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-[#5C42FD] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsAddingNewCategory(true);
                handleOpenCreate();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#5C42FD] hover:bg-[#5C42FD]/10 rounded-xl transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{t('shop.new_category')}</span>
            </button>
            <span className="text-xs text-gray-500 font-semibold hidden sm:block">
              Jami tovarlar: <strong className="text-gray-900">{filteredProducts.length} xil</strong>
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filtr:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#5C42FD] text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            Barchasi ({products.length})
          </button>
          {allCategories.map(cat => {
            const count = products.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = selectedCategoryFilter.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#5C42FD] text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Mahsulotlar topilmadi"
          description="Do‘konda hali mahsulotlar mavjud emas."
          icon={ShoppingBag}
          actionText="Yangi mahsulot qo‘shish"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-[#E9EAF3] hover:border-[#5C42FD]/40 transition-all shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C42FD] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-2xs">
                      {product.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={product.status} size="sm" />
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#5C42FD] transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    {/* Coin Price */}
                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl">
                      <Coins className="w-4 h-4" />
                      <span className="text-sm font-black">{product.coinPrice}</span>
                      <span className="text-[10px] font-bold">coin</span>
                    </div>

                    {/* Stock */}
                    <div className="text-xs text-gray-500 font-medium">
                      Omborda: <strong className="text-gray-900">{product.stock} dona</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit, Delete */}
              <div className="p-3 bg-[#FAF9FE] border-t border-gray-100 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(product)}
                  className="p-1.5 text-gray-400 hover:text-[#5C42FD] hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ isOpen: true, product })}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="O‘chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL (with drag & drop upload preview) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editingProduct ? 'Mahsulotni Tahrirlash' : 'Do‘konga Yangi Mahsulot Qo‘shish'}
        subtitle="Mahsulot narxi (coin), ombordagi soni va rasmini belgilang"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Mahsulot Nomi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masalan: Avlod Ta'lim Premium Hoodie"
              className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Coin Narxi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Coins className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formData.coinPrice === 0 || formData.coinPrice === ('' as any) ? '' : formData.coinPrice}
                  onChange={e => {
                    const clean = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
                    setFormData({ ...formData, coinPrice: clean === '' ? ('' as any) : Number(clean) });
                  }}
                  placeholder="300"
                  className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 font-bold shadow-2xs focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Ombordagi miqdor (Stock)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.stock === 0 || formData.stock === ('' as any) ? '' : formData.stock}
                onChange={e => {
                  const clean = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
                  setFormData({ ...formData, stock: clean === '' ? ('' as any) : Number(clean) });
                }}
                placeholder="20"
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold shadow-2xs focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Image Upload Area (Local Computer File Picker & Drag-and-Drop) */}
          <ImageUpload
            value={formData.imageUrl}
            onChange={url => setFormData({ ...formData, imageUrl: url })}
            label="Mahsulot Rasmi"
            helperText="PNG, JPG, WebP (maksimal 5MB)"
            aspectRatio="square"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#5C42FD]" />
                  <span>Kategoriya</span>
                  <span className="text-rose-500">*</span>
                </label>
                {!isAddingNewCategory ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewCategory(true);
                      setNewCategoryInput('');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5C42FD] hover:text-[#4d33eb] transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Yangi kategoriya qo‘shish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(false)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Ro‘yxatdan tanlash</span>
                  </button>
                )}
              </div>

              {isAddingNewCategory ? (
                <div className="space-y-2 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C42FD]">
                    <FolderPlus className="w-4 h-4" />
                    <span>Yangi Kategoriya Yaratish</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryInput}
                        onChange={e => setNewCategoryInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategoryInModal();
                          }
                        }}
                        placeholder="Yangi kategoriya nomi (masalan: Sport buyumlari)..."
                        className="w-full bg-white border border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 shadow-2xs focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateCategoryInModal}
                      className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#5C42FD] hover:bg-[#4d33eb] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Qo‘shish</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Kategoriya nomini yozib «Qo‘shish» tugmasini bosing yoki mahsulot saqlanganda o‘zi avtomatik qo‘shiladi.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={e => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewCategory(true);
                          setNewCategoryInput('');
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium shadow-2xs focus:outline-hidden transition-all cursor-pointer"
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__add_new__" className="text-[#5C42FD] font-bold">
                        + Yangi kategoriya kiritish...
                      </option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-gray-400 font-medium mr-0.5">Tezkor tanlov:</span>
                    {allCategories.slice(0, 5).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                          formData.category === cat
                            ? 'bg-[#5C42FD]/10 text-[#5C42FD] font-bold ring-1 ring-[#5C42FD]/20'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5 opacity-60" />
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Holati
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all cursor-pointer"
              >
                <option value="in_stock">In Stock (Mavjud)</option>
                <option value="low_stock">Low Stock (Kam qolgan)</option>
                <option value="out_of_stock">Out of Stock (Tugagan)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Mahsulot Tavsifi
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mahsulot materiali, o‘lchami va xususiyatlari..."
              className="w-full bg-white border border-gray-200 focus:border-[#5C42FD] focus:ring-2 focus:ring-[#5C42FD]/15 rounded-xl p-3.5 text-xs text-gray-900 shadow-2xs focus:outline-hidden transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5C42FD] hover:bg-[#4d33eb] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {editingProduct ? 'Saqlash' : 'Mahsulotni Yaratish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, product: null })}
        onConfirm={() => {
          if (deleteConfirm.product) handleDelete(deleteConfirm.product.id);
        }}
        title="Mahsulotni o‘chirish"
        message={`${deleteConfirm.product?.name} tovari do‘kondan o‘chiriladi.`}
        confirmText="O‘chirish"
        variant="danger"
      />
    </div>
  );
};
