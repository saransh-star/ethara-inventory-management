import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import CustomerList from './components/CustomerList';
import OrderList from './components/OrderList';
import OrderCreate from './components/OrderCreate';
import Notification from './components/Notification';
import './App.css';

// Load API URL from env with docker-compose service fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: 'info' });

  // Load alert toast helper
  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeToast = () => {
    setNotification({ message: '', type: 'info' });
  };

  // Sync everything from database
  const refreshData = async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes, custRes, ordRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/summary`),
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/customers`),
        fetch(`${API_URL}/orders`)
      ]);

      if (!sumRes.ok || !prodRes.ok || !custRes.ok || !ordRes.ok) {
        throw new Error('Failed to synchronize one or more resources from database.');
      }

      const sumData = await sumRes.json();
      const prodData = await prodRes.json();
      const custData = await custRes.json();
      const ordData = await ordRes.json();

      setSummary(sumData);
      setProducts(prodData);
      setCustomers(custData);
      setOrders(ordData);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Unable to establish database server link.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // ==================== PRODUCT CONTROLLERS ====================
  const handleAddProduct = async (payload, onSuccess, onError) => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create product.');
      }

      showToast(`Product '${data.name}' has been successfully created.`, 'success');
      onSuccess();
      refreshData();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleUpdateProduct = async (id, payload, onSuccess, onError) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update product details.');
      }

      showToast(`Product details for '${data.name}' updated successfully.`, 'success');
      onSuccess();
      refreshData();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? All historical references will be lost.')) return;
    
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to delete product.');
      }

      showToast(data.message || 'Product deleted.', 'success');
      refreshData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== CUSTOMER CONTROLLERS ====================
  const handleAddCustomer = async (payload, onSuccess, onError) => {
    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to register customer profile.');
      }

      showToast(`Customer Profile for '${data.full_name}' created successfully.`, 'success');
      onSuccess();
      refreshData();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? All historical orders will also be deleted.')) return;

    try {
      const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to delete customer.');
      }

      showToast(data.message || 'Customer record deleted.', 'success');
      refreshData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== ORDER CONTROLLERS ====================
  const handleCreateOrder = async (payload, onError) => {
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to process checkout order.');
      }

      showToast(`Order #${data.id} has been successfully placed. stock decremented!`, 'success');
      setActiveTab('orders');
      refreshData();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order? Item stocks will be restored to catalog inventory.')) return;

    try {
      const res = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to cancel order.');
      }

      showToast(data.message || 'Order cancelled. Inventory restored.', 'success');
      refreshData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Switch display panel
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'products':
        return (
          <ProductList
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'customers':
        return (
          <CustomerList
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case 'orders':
        return (
          <OrderList
            orders={orders}
            onDeleteOrder={handleDeleteOrder}
            onCreateOrderClick={() => setActiveTab('create-order')}
          />
        );
      case 'create-order':
        return (
          <OrderCreate
            customers={customers}
            products={products}
            onSubmitOrder={handleCreateOrder}
            onCancel={() => setActiveTab('orders')}
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard
            summary={summary}
            loading={loading}
            onRefresh={refreshData}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Toast popup */}
      <div className="notification-container">
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeToast}
        />
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {renderActiveTab()}
      </main>
    </div>
  );
}
