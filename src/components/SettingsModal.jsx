import { useState } from 'react';
import { X, AlertCircle, Moon, Sun } from 'lucide-react';
import { db } from '../data/db';
import { ConfirmDialog } from './UI';
import { ConfirmInput } from './ConfirmInput';

export default function SettingsModal({ edificioId, onClose, onDeleted }) {
  const edificio = db.getEdificios().find(e => e.id === edificioId);
  const [config, setConfig] = useState({
    nombre: edificio?.nombre || '',
    direccion: edificio?.direccion || '',
    admin: edificio?.admin || '',
    metros_totales: edificio?.metros_totales || '',
  });
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(() => (localStorage.getItem('theme') || 'light') === 'dark');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteInput, setShowDeleteInput] = useState(false);

  const handleThemeToggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    const theme = next ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.getElementById('theme-color');
    if (meta) meta.setAttribute('content', next ? '#111318' : '#F4F5F7');
  };

  const errors = {};
  if (!config.nombre.trim()) errors.nombre = 'Requerido';
  if (!config.admin.trim()) errors.admin = 'Requerido';
  if (!config.direccion.trim()) errors.direccion = 'Requerido';
  if (!config.metros_totales || config.metros_totales <= 0) errors.metros_totales = 'Debe ser mayor a 0';

  const handleSave = () => {
    if (Object.keys(errors).length) return;
    db.saveEdificio({ ...edificio, ...config, metros_totales: Number(config.metros_totales) });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const handleDeleteFirst = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteSecond = () => {
    setShowDeleteInput(true);
  };

  const handleDeleteFinal = () => {
    db.deleteEdificio(edificioId);
    onDeleted?.();
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <h3>Configuración del edificio</h3>
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre del consorcio</label>
              <input className={`form-input ${errors.nombre ? 'error' : ''}`} value={config.nombre}
                onChange={e => setConfig(c => ({ ...c, nombre: e.target.value }))}
                placeholder="Ej: Consorcio Belgrano 1240" maxLength={100} />
              {errors.nombre && <div className="error-msg"><AlertCircle size={12} /> {errors.nombre}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Administrador</label>
                <input className={`form-input ${errors.admin ? 'error' : ''}`} value={config.admin}
                  onChange={e => setConfig(c => ({ ...c, admin: e.target.value }))}
                  placeholder="Nombre del administrador" maxLength={100} />
                {errors.admin && <div className="error-msg"><AlertCircle size={12} /> {errors.admin}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Metros² totales</label>
                <input className={`form-input ${errors.metros_totales ? 'error' : ''}`} type="number"
                  value={config.metros_totales}
                  onChange={e => setConfig(c => ({ ...c, metros_totales: e.target.value }))}
                  placeholder="Ej: 800" />
                {errors.metros_totales && <div className="error-msg"><AlertCircle size={12} /> {errors.metros_totales}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección del edificio</label>
              <input className={`form-input ${errors.direccion ? 'error' : ''}`} value={config.direccion}
                onChange={e => setConfig(c => ({ ...c, direccion: e.target.value }))}
                placeholder="Ej: Belgrano 1240, Córdoba" maxLength={200} />
              {errors.direccion && <div className="error-msg"><AlertCircle size={12} /> {errors.direccion}</div>}
            </div>

            <div className="theme-toggle">
              <span className="theme-toggle-label">
                {darkMode ? <><Moon size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Modo oscuro</> : <><Sun size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Modo claro</>}
              </span>
              <div className={`toggle-switch ${darkMode ? 'active' : ''}`} onClick={handleThemeToggle}>
                <div className="toggle-knob" />
              </div>
            </div>

            <div className="danger-zone">
              <div className="danger-zone-title">Zona peligrosa</div>
              <p className="danger-zone-desc">
                Al eliminar este edificio se desactivarán todos sus departamentos. Esta acción no se puede deshacer.
              </p>
              <button className="btn btn-danger-outline" onClick={handleDeleteFirst}>
                Eliminar este edificio
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); setShowDeleteInput(true); }}
        title="¿Eliminar edificio?"
        message={`Se desactivarán "${config.nombre}" y todos sus departamentos. Esta acción no se puede deshacer.`}
        danger={true}
      />

      <ConfirmInput
        isOpen={showDeleteInput}
        onClose={() => setShowDeleteInput(false)}
        onConfirm={handleDeleteFinal}
        title="Eliminar edificio"
        message="Para confirmar la eliminación, escribí el nombre exacto del edificio."
        expectedText={config.nombre}
        confirmLabel="Eliminar permanentemente"
      />
    </>
  );
}
