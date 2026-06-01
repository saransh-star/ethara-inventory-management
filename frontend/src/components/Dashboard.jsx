import React from 'react';
import { Package, Users, ShoppingCart, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

export default function Dashboard({ summary, loading, onRefresh }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <RefreshCw className="spin-animation" size={32} style={{ color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing analytics...</p>
      </div>
    );
  }

  const { total_products, total_customers, total_orders, low_stock_products } = summary;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title-section">
          <h1 className="dashboard-title">Operational Dashboard</h1>
          <p className="dashboard-subtitle">Real-time tracking of products, customers, orders, and inventory states.</p>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh} title="Sync data">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <Package size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Products</span>
            <span className="metric-value">{total_products}</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Customers</span>
            <span className="metric-value">{total_customers}</span>
          </div>
        </div>

        <div className="metric-card primary">
          <div className="metric-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Orders</span>
            <span className="metric-value">{total_orders}</span>
          </div>
        </div>

        <div className={`metric-card ${low_stock_products.length > 0 ? 'danger' : 'success'}`}>
          <div className="metric-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Low Stock items</span>
            <span className="metric-value">{low_stock_products.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom section: Low stock panel & quick info */}
      <div className="dashboard-sections">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title" style={{ color: 'var(--color-danger)' }}>
              <AlertTriangle size={18} />
              <span>Low Stock Alerts</span>
              <span className="badge-count">{low_stock_products.length}</span>
            </h2>
          </div>

          {low_stock_products.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlignment: 'center', color: 'var(--text-secondary)' }}>
              <p>🎉 All inventory levels are healthy! No low stock warnings.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Stock Level</th>
                  </tr>
                </thead>
                <tbody>
                  {low_stock_products.map((product) => (
                    <tr key={product.id}>
                      <td style={{ color: 'var(--color-primary)' }}>{product.sku}</td>
                      <td>{product.name}</td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>
                        <span className={`tag ${product.quantity_in_stock === 0 ? 'tag-danger' : 'tag-warning'}`}>
                          {product.quantity_in_stock} remaining
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-header">
              <h2 className="panel-title">
                <TrendingUp size={18} style={{ color: 'var(--color-accent)' }} />
                <span>System Summary</span>
              </h2>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '1rem' }}>
                Welcome to <strong>Ethara.ai Inventory Manager</strong>. Use this administration portal to supervise catalog items, register client files, monitor transactional history, and log sales.
              </p>
              <p>
                Database connectivity status: <span className="tag tag-success" style={{ textTransform: 'none' }}>Active</span>
              </p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last synced: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
