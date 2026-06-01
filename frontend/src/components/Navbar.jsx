import React from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Activity size={20} />
        </div>
        <span>Ethara Systems</span>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }}
                >
                  <IconComponent />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
