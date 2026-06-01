import React, { useState } from 'react';
import { Plus, Trash2, Search, X } from 'lucide-react';

export default function CustomerList({ customers, onAddCustomer, onDeleteCustomer }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) return setFormError('Customer Full Name is required.');
    
    const emailTrimmed = email.trim();
    if (!emailTrimmed) return setFormError('Email address is required.');
    if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      return setFormError('Please enter a valid email address.');
    }

    if (!phoneNumber.trim()) return setFormError('Phone number is required.');

    const payload = {
      full_name: fullName.trim(),
      email: emailTrimmed.toLowerCase(),
      phone_number: phoneNumber.trim(),
    };

    onAddCustomer(payload, () => setIsModalOpen(false), (err) => setFormError(err));
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="dashboard-title">Customer Registry</h1>
          <p className="dashboard-subtitle">Maintain client contact profiles, contact details and linked orders.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <h3>No Customers Found</h3>
          <p>No client records match your query. Click 'Add Customer' to create profiles.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td style={{ fontWeight: '600' }}>{customer.full_name}</td>
                  <td style={{ color: 'var(--color-accent)' }}>{customer.email}</td>
                  <td>{customer.phone_number}</td>
                  <td>
                    <button className="btn btn-danger btn-icon" onClick={() => onDeleteCustomer(customer.id)} title="Delete customer profile">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register New Customer</h2>
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
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter customer full name..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="customer@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g., +1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
