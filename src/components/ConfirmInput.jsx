import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function ConfirmInput({ isOpen, onClose, onConfirm, title, message, expectedText, confirmLabel = 'Eliminar' }) {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const matches = input === expectedText;

  const handleConfirm = () => {
    if (!matches) return;
    onConfirm();
    setInput('');
    onClose();
  };

  const handleClose = () => {
    setInput('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal confirm-dialog">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={handleClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="confirm-icon danger">
            <AlertTriangle size={22} />
          </div>
          <p>{message}</p>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label" style={{ fontSize: 13 }}>
              Escribí <strong>{expectedText}</strong> para confirmar:
            </label>
            <input
              className="form-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={expectedText}
              autoFocus
              style={{ borderColor: input && !matches ? 'var(--danger)' : undefined }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={!matches}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
