import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function OrderCreate({ customers, products, onSubmitOrder, onCancel }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Calculate frontend total
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find(p => p.id === parseInt(item.product_id, 10));
      if (prod) {
        return sum + (prod.price * (parseInt(item.quantity, 10) || 0));
      }
      return sum;
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!customerId) return setError('Please select a customer.');
    if (items.length === 0) return setError('Your order must contain at least one item.');

    const formattedItems = [];
    const seenProductIds = new Set();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) {
        return setError(`Please select a product in Row ${i + 1}.`);
      }

      const pId = parseInt(item.product_id, 10);
      if (seenProductIds.has(pId)) {
        return setError(`Duplicate product detected. Please merge quantities or remove duplicate items.`);
      }
      seenProductIds.add(pId);

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return setError(`Quantity in Row ${i + 1} must be at least 1.`);
      }

      // Check stock levels frontend-side
      const product = products.find(p => p.id === pId);
      if (product && product.quantity_in_stock < qty) {
        return setError(
          `Insufficient inventory for '${product.name}' in Row ${i + 1}. ` +
          `Available: ${product.quantity_in_stock}, Requested: ${qty}.`
        );
      }

      formattedItems.push({
        product_id: pId,
        quantity: qty
      });
    }

    const payload = {
      customer_id: parseInt(customerId, 10),
      items: formattedItems
    };

    onSubmitOrder(payload, (err) => setError(err));
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <button className="close-btn" onClick={onCancel} style={{ width: '1.75rem', height: '1.75rem' }}>
              <ArrowLeft size={16} />
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Back to Orders</span>
          </div>
          <h1 className="dashboard-title">Create Sales Order</h1>
          <p className="dashboard-subtitle">Construct multi-item client purchase transactions with stock level synchronizations.</p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {error && (
          <div className="tag tag-danger" style={{ display: 'block', width: '100%', marginBottom: '1.5rem', borderRadius: '0.5rem', padding: '0.75rem', textTransform: 'none' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer select */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontSize: '0.9rem' }}>Select Registered Customer</label>
            <select
              className="form-control"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">-- Choose a customer --</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.full_name} ({cust.email})
                </option>
              ))}
            </select>
          </div>

          {/* Cart Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Order items</h3>
            <button type="button" className="btn btn-secondary btn-icon" onClick={handleAddItem} title="Add another product row">
              <Plus size={16} />
            </button>
          </div>

          {/* Item rows */}
          <div className="order-builder">
            {items.map((item, index) => {
              const selectedProduct = products.find(p => p.id === parseInt(item.product_id, 10));
              const availableStock = selectedProduct ? selectedProduct.quantity_in_stock : 0;
              const unitPrice = selectedProduct ? selectedProduct.price : 0;
              const subtotal = unitPrice * (parseInt(item.quantity, 10) || 0);

              return (
                <div className="order-item-row" key={index}>
                  {/* Select product */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Product</label>
                    <select
                      className="form-control"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id} disabled={prod.quantity_in_stock === 0}>
                          {prod.name} ({prod.sku}) - ${prod.price.toFixed(2)} [{prod.quantity_in_stock} in stock]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity input */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </div>

                  {/* Subtotal display */}
                  <div className="form-group" style={{ margin: 0, minWidth: '90px' }}>
                    <label className="form-label">Subtotal</label>
                    <div style={{ padding: '0.75rem 0', color: 'var(--color-accent)', fontWeight: '600', fontSize: '0.95rem' }}>
                      ${subtotal.toFixed(2)}
                    </div>
                  </div>

                  {/* Remove action */}
                  <button
                    type="button"
                    className="btn btn-danger btn-icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cart totals */}
          <div className="order-totals">
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Calculated Grand Total</span>
            <span className="order-grand-total">${calculateTotal().toFixed(2)}</span>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <ShoppingBag size={16} />
              <span>Checkout & Place Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
