import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/products';

export default function Products() {
  const { activeBusiness } = useBusiness();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and filter state
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    description: '',
    is_active: true
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load products
  const fetchProductList = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts();
      // Filter list on backend returns all products of user. We filter by activeBusiness.id
      const dataArray = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.results || []);
      const businessProducts = dataArray.filter(
        p => p.business === activeBusiness.id
      );
      setProducts(businessProducts);
    } catch (err) {
      console.error("Failed to load products", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductList();
  }, [activeBusiness]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      price: '',
      description: '',
      is_active: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      price: product.price,
      description: product.description || '',
      is_active: product.is_active
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBusiness) return;
    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (isNaN(formData.price) || parseFloat(formData.price) < 0) {
      setFormError("Please enter a valid positive price.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      setIsModalOpen(false);
      fetchProductList();
    } catch (err) {
      console.error("Form submit error", err);
      const errMsg = err.response?.data?.detail || err.response?.data?.sku?.[0] || err.response?.data?.non_field_errors?.[0] || "An error occurred while saving the product.";
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      fetchProductList();
    } catch (err) {
      console.error("Failed to delete product", err);
      alert("Failed to delete product. Please try again.");
    }
  };

  // Filtered list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.sku || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterActive === 'all' 
      ? true 
      : filterActive === 'active' 
        ? p.is_active 
        : !p.is_active;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-display">
            Products Catalog
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Manage your product inventory list, SKUs, and baseline catalog prices.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300 gap-1.5 self-start sm:self-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Product
        </button>
      </div>

      {/* Filters / Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-sm transition-all duration-300 outline-none text-gray-900 dark:text-white"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-gray-50/80 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-900 p-1.5 rounded-xl self-start md:self-center">
          {['all', 'active', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterActive(status)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                filterActive === status
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-slate-400 space-y-3">
            <svg className="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-semibold">Loading product catalog...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-semibold">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-12 h-12 text-gray-300 dark:text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h4 className="text-lg font-bold text-gray-700 dark:text-slate-300">No products found</h4>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
              {search ? "Try adjusting your search terms or filter status." : "Create your first catalog product to start tracking details."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                   <th className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">Product Name</th>
                   <th className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">SKU</th>
                   <th className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">Price</th>
                   <th className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">Status</th>
                   <th className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider text-right">Actions</th>
                 </tr>
               </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id}
                    className="hover:bg-indigo-50/10 dark:hover:bg-slate-800/20 transition-colors cursor-default"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-slate-300">
                      {product.sku || '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      ₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        product.is_active 
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40' 
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-all duration-200"
                          title="Edit Product"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all duration-200"
                          title="Delete Product"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* Modal Dialog for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b dark:border-slate-800/80 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-sm transition-all duration-200 outline-none text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* SKU & Price Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    SKU / Product Code
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. SKU-892"
                    className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-sm transition-all duration-200 outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 2999.00"
                    className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-sm transition-all duration-200 outline-none text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us more about this product..."
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl text-sm transition-all duration-200 outline-none text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4.5 h-4.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-pointer">
                  This product is active and visible to analytics
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 transition-all duration-300"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
