import React, { useState } from 'react';
import { Eye, Trash2, Plus, ShoppingCart, X } from 'lucide-react';

export default function OrderList({ orders, onDeleteOrder, onCreateOrderClick }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openDetails = (order) => {
    setSelectedOrder(order);
  };

  const getItemsCount = (order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="dashboard-title">Customer Orders</h1>
          <p className="dashboard-subtitle">Track orders, inspect item details, calculate totals, or cancel orders.</p>
        </div>
        <button className="btn btn-primary" onClick={onCreateOrderClick}>
          <Plus size={16} />
          <span>New Order</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={48} />
          <h3>No Orders Placed</h3>
          <p>No orders have been recorded. Click 'New Order' to build a custom cart.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Total Items</th>
                <th>Total Price</th>
                <th>Date Placed</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td style={{ fontWeight: '600' }}>{order.customer?.full_name}</td>
                  <td>{getItemsCount(order)} items</td>
                  <td style={{ color: 'var(--color-accent)' }}>${order.total_amount.toFixed(2)}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-secondary btn-icon" onClick={() => openDetails(order)} title="View items invoice">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon" onClick={() => onDeleteOrder(order.id)} title="Cancel order and restore stock">
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

      {/* Invoice Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Order Summary #{selectedOrder.id}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Customer summary */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                  Client Profile
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Name:</span>{' '}
                    <strong style={{ color: 'white' }}>{selectedOrder.customer?.full_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Email:</span>{' '}
                    <span style={{ color: 'var(--color-accent)' }}>{selectedOrder.customer?.email}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span>{' '}
                    <span style={{ color: 'white' }}>{selectedOrder.customer?.phone_number}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Placed At:</span>{' '}
                    <span style={{ color: 'white' }}>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                Cart Invoice Details
              </h3>
              <div className="table-responsive" style={{ background: 'none' }}>
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '600' }}>{item.product?.name || 'Deleted Product'}</td>
                        <td style={{ color: 'var(--color-primary)' }}>{item.product?.sku || 'N/A'}</td>
                        <td style={{ textAlign: 'right' }}>${(item.product?.price || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-accent)' }}>
                          ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div className="order-totals" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Total Billing Amount</span>
                <span className="order-grand-total">${selectedOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close Invoice</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onDeleteOrder(selectedOrder.id);
                  setSelectedOrder(null);
                }}
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
