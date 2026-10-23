import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  PlusCircle,
  Coins,
  Package,
  Edit2,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { ShopProduct } from '../../types';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';

export const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'add');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

  // Toggle active confirmation
  const [productToToggle, setProductToToggle] = useState<ShopProduct | null>(null);
  const [toggling, setToggling] = useState(false);

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCoins, setCreateCoins] = useState(250);
  const [createStock, setCreateStock] = useState(20);
  const [createActive, setCreateActive] = useState(true);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCoins, setEditCoins] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editActive, setEditActive] = useState(true);
  const [editing, setEditing] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProducts({ search: search.trim() || undefined });
      setProducts(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load shop merchandise.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateImageFile(file);
      const url = URL.createObjectURL(file);
      setCreateImagePreview(url);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast('Product name is required.', 'error');
      return;
    }
    if (createCoins <= 0) {
      showToast('Coin price must be a positive integer.', 'error');
      return;
    }
    if (createStock < 0) {
      showToast('Stock quantity must be non-negative.', 'error');
      return;
    }

    setCreating(true);
    try {
      if (createImageFile) throw new Error('Product image upload is not supported by the configured Django API yet.');
      const finalImageUrl = '';

      await api.createProduct({
        name: createName.trim(),
        description: createDesc.trim(),
        coin_price: createCoins,
        stock_quantity: createStock,
        is_active: createActive,
        image_url: finalImageUrl,
      });

      showToast(`Product "${createName}" added to the academy store.`, 'success');
      setIsCreateOpen(false);
      setCreateName('');
      setCreateDesc('');
      setCreateImageFile(null);
      setCreateImagePreview(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to add product.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (prod: ShopProduct) => {
    setSelectedProduct(prod);
    setEditName(prod.name);
    setEditDesc(prod.description);
    setEditCoins(prod.coin_price);
    setEditStock(prod.stock_quantity);
    setEditActive(prod.is_active);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setEditing(true);
    try {
      await api.updateProduct(selectedProduct.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        coin_price: editCoins,
        stock_quantity: editStock,
        is_active: editActive,
      });
      showToast(`Product "${editName}" updated.`, 'success');
      setIsEditOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to update product.', 'error');
    } finally {
      setEditing(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!productToToggle) return;
    const newStatus = !productToToggle.is_active;

    setToggling(true);
    try {
      await api.updateProduct(productToToggle.id, { is_active: newStatus });
      showToast(
        `Product "${productToToggle.name}" is now ${newStatus ? 'active' : 'inactive'}.`,
        'info'
      );
      setProductToToggle(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to change product status.', 'error');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academy Shop Inventory</h2>
          <p className="text-xs text-slate-500">
            Manage student reward merchandise, coin pricing schedules, and physical inventory stock
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/admin/shop-orders')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4 text-slate-600" />
            <span>Fulfillment Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products by title or description..."
        />
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <LoadingState message="Loading store merchandise..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products in store"
          description="Add your first branded merchandise or reward item."
          actionLabel="Add Product"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Product Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1 shadow-xs">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{prod.coin_price} Coins</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold text-[11px] uppercase tracking-wider ${
                        prod.is_active ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {prod.is_active ? 'Active Listing' : 'Archived'}
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {prod.stock_quantity > 0 ? `${prod.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{prod.name}</h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => openEditModal(prod)}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-800 hover:text-slate-950 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductToToggle(prod)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    prod.is_active
                      ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      : 'text-emerald-700 hover:bg-emerald-50 font-semibold'
                  }`}
                >
                  {prod.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateImagePreview(null);
          setCreateImageFile(null);
        }}
        title="Add Shop Merchandise"
        subtitle="List new merchandise available for student coin redemption"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Title *
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Avlod Academy Commuter Backpack"
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Material details, size specifications, styling notes..."
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coin Price *
              </label>
              <input
                type="number"
                min="1"
                value={createCoins}
                onChange={(e) => setCreateCoins(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={createStock}
                onChange={(e) => setCreateStock(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Image
            </label>
            {!createImagePreview ? (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 bg-white transition-colors">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-700">Select product photo</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</span>
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
              </label>
            ) : (
              <div className="relative inline-block border border-slate-200 rounded-lg overflow-hidden">
                <img
                  src={createImagePreview}
                  alt="Product preview"
                  className="w-32 h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCreateImagePreview(null);
                    setCreateImageFile(null);
                  }}
                  className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setCreateImagePreview(null);
                setCreateImageFile(null);
              }}
              disabled={creating}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Publish Product</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Merchandise"
        subtitle={`Editing ${selectedProduct?.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Title
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coin Price
              </label>
              <input
                type="number"
                min="1"
                value={editCoins}
                onChange={(e) => setEditCoins(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={editStock}
                onChange={(e) => setEditStock(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              disabled={editing}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              {editing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM TOGGLE STATUS DIALOG */}
      <ConfirmDialog
        isOpen={!!productToToggle}
        onClose={() => setProductToToggle(null)}
        onConfirm={confirmToggleStatus}
        title={`${productToToggle?.is_active ? 'Deactivate' : 'Activate'} Product?`}
        message={`Are you sure you want to ${
          productToToggle?.is_active ? 'deactivate' : 'activate'
        } "${productToToggle?.name}"? Deactivating removes it from student redemption while preserving all previous orders.`}
        confirmLabel={productToToggle?.is_active ? 'Deactivate' : 'Activate'}
        isDestructive={productToToggle?.is_active}
        isLoading={toggling}
      />
    </div>
  );
};
