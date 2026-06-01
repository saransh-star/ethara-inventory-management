import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function ProductList({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setPrice('');
    setQuantity('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price.toString());
    setQuantity(product.quantity_in_stock.toString());
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!name.trim()) return setFormError('Product Name is required.');
    if (!sku.trim()) return setFormError('Product SKU/Code is required.');
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return setFormError('Price must be a valid non-negative number.');
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return setFormError('Stock Quantity must be a valid non-negative integer.');
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: parsedPrice,
      quantity_in_stock: parsedQty,
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, payload, () => setIsModalOpen(false), (err) => setFormError(err));
    } else {
      onAddProduct(payload, () => setIsModalOpen(false), (err) => setFormError(err));
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="dashboard-title">Product Catalog</h1>
          <p className="dashboard-subtitle">Manage inventory stock, descriptions, pricing and SKU references.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <h3>No Products Found</h3>
          <p>No products match your criteria. Click 'Add Product' to insert new catalog items.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock Quantity</th>
                <th>Status</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td style={{ fontWeight: '600' }}>{product.name}</td>
                  <td style={{ color: 'var(--color-primary)' }}>{product.sku}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.quantity_in_stock} units</td>
                  <td>
                    {product.quantity_in_stock === 0 ? (
                      <span className="tag tag-danger">Out of stock</span>
                    ) : product.quantity_in_stock <= 5 ? (
                      <span className="tag tag-warning">Low stock</span>
                    ) : (
                      <span className="tag tag-success">In stock</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-secondary btn-icon" onClick={() => openEditModal(product)} title="Edit details">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon" onClick={() => onDeleteProduct(product.id)} title="Delete item">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out/Central Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Catalog Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="tag tag-danger" style={{ display: 'block', width: '100%', marginBottom: '1.25rem', borderRadius: '0.5rem', padding: '0.75rem', textTransform: 'none' }}>
                    ⚠️ {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter product title..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unique SKU/Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g., PROD-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={!!editingProduct} // Recommended: prevent sku edits, or allow it
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity in Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
