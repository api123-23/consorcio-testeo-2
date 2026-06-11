import { X, AlertTriangle } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, size = '' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, danger = true }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal confirm-dialog">
        <div className="modal-body">
          <div className={`confirm-icon ${danger ? 'danger' : ''}`}>
            <AlertTriangle size={22} />
          </div>
          <h4>{title}</h4>
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export function Badge({ type = 'gray', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function Alert({ type = 'warning', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={40} />}
      <p>{message}</p>
    </div>
  );
}
