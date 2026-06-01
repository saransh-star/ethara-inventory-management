import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function Notification({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="tag-success" size={20} style={{ border: 'none', background: 'transparent' }} />;
      case 'error':
        return <XCircle className="tag-danger" size={20} style={{ border: 'none', background: 'transparent' }} />;
      case 'info':
      default:
        return <AlertCircle className="tag-primary" size={20} style={{ border: 'none', background: 'transparent' }} />;
    }
  };

  return (
    <div className={`notification ${type}`}>
      {renderIcon()}
      <div className="notification-message">{message}</div>
      <button className="notification-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
