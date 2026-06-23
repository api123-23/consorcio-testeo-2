import { useState } from 'react';
import { X, AlertCircle, Moon, Sun, Building2, User, LogOut, Lock, CheckCircle2 } from 'lucide-react';
import { db } from '../data/db';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { ConfirmDialog } from './UI';
import { ConfirmInput } from './ConfirmInput';

export default function SettingsModal({ edificioId, onClose, onDeleted }) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState('edificio');
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

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

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

  const handleDeleteFirst = () => setShowDeleteConfirm(true);
  const handleDeleteSecond = () => setShowDeleteInput(true);
  const handleDeleteFinal = () => {
    db.deleteEdificio(edificioId);
    onDeleted?.();
    onClose();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwForm.current_password) { setPwError('Ingresá tu contraseña actual'); return; }
    if (!pwForm.new_password || pwForm.new_password.length < 6) { setPwError('La nueva contraseña debe tener al menos 6 caracteres'); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('Las contraseñas nuevas no coinciden'); return; }

    setPwSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess('Contraseña actualizada correctamente');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const tabs = [
    { id: 'edificio', label: 'Edificio', icon: Building2 },
    { id: 'cuenta', label: 'Cuenta', icon: User },
  ];

  return (
    <>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <h3>Configuración</h3>
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>

          <div className="modal-tabs">
            {tabs.map(t => (
              <button key={t.id}
                className={`modal-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}>
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'edificio' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="modal-body">
                <div className="section-card">
                  <div className="section-card-title">
                    <User size={15} />
                    Tu cuenta
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                  </div>
                </div>

                <div className="section-card">
                  <div className="section-card-title">
                    <Lock size={15} />
                    Cambiar contraseña
                  </div>
                  <form onSubmit={handleChangePassword}>
                    {pwError && (
                      <div className="login-error" style={{ marginBottom: 12 }}>
                        <AlertCircle size={14} />
                        {pwError}
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="login-success" style={{ marginBottom: 12 }}>
                        <CheckCircle2 size={14} />
                        {pwSuccess}
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Contraseña actual</label>
                      <input className="form-input" type="password" value={pwForm.current_password}
                        onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                        placeholder="••••••••" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Nueva contraseña</label>
                        <input className="form-input" type="password" value={pwForm.new_password}
                          onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                          placeholder="Mín. 6 caracteres" minLength={6} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirmar</label>
                        <input className="form-input" type="password" value={pwForm.confirm_password}
                          onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                          placeholder="Repetí la contraseña" />
                      </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={pwSubmitting}
                      style={{ marginTop: 4 }}>
                      {pwSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
                    </button>
                  </form>
                </div>

                <div className="section-card">
                  <div className="section-card-title" style={{ color: 'var(--danger)' }}>
                    <LogOut size={15} />
                    Cerrar sesión
                  </div>
                  <p className="danger-zone-desc">
                    Vas a cerrar tu sesión actual. Necesitarás ingresar de nuevo para acceder a tus edificios.
                  </p>
                  <button className="btn btn-danger-outline" onClick={handleSignOut}>
                    <LogOut size={14} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              </div>
            </>
          )}
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
