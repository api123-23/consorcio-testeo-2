import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { db, loadData, newId, getMesActual } from './data/db';
import { useToastState } from './components/toast';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Departamentos from './pages/Departamentos';
import Personas from './pages/Personas';
import Gastos from './pages/Gastos';
import Liquidacion from './pages/Liquidacion';
import Cobranzas from './pages/Cobranzas';
import Reportes from './pages/Reportes';
import Estadisticas from './pages/Estadisticas';
import SettingsModal from './components/SettingsModal';

import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  FileSpreadsheet,
  DollarSign,
  BarChart2,
  Settings,
  Menu,
  X,
  ChevronDown,
  Plus,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard, group: 'principal' },
  { id: 'departamentos', label: 'Departamentos', icon: Building2, group: 'gestion' },
  { id: 'personas', label: 'Personas', icon: Users, group: 'gestion' },
  { id: 'gastos', label: 'Gastos', icon: Receipt, group: 'gestion' },
  { id: 'cobranzas', label: 'Cobranzas', icon: DollarSign, group: 'operaciones' },
  { id: 'liquidacion', label: 'Liquidación', icon: FileSpreadsheet, group: 'operaciones' },
  { id: 'reportes', label: 'Reportes', icon: BarChart2, group: 'operaciones' },
  { id: 'estadisticas', label: 'Estadísticas', icon: BarChart2, group: 'operaciones' },
];

const PAGES = {
  dashboard: Dashboard,
  departamentos: Departamentos,
  personas: Personas,
  gastos: Gastos,
  liquidacion: Liquidacion,
  cobranzas: Cobranzas,
  reportes: Reportes,
  estadisticas: Estadisticas,
};

function BuildingSelector({ edificioId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [buildingForm, setBuildingForm] = useState({
    nombre: '', direccion: '', admin: '', metros_totales: '',
  });
  const edificios = db.getEdificios();
  const current = edificios.find(e => e.id === edificioId);

  const resetForm = () => setBuildingForm({ nombre: '', direccion: '', admin: '', metros_totales: '' });

  const errors = {};
  if (!buildingForm.nombre.trim()) errors.nombre = 'Requerido';
  if (!buildingForm.admin.trim()) errors.admin = 'Requerido';
  if (!buildingForm.direccion.trim()) errors.direccion = 'Requerido';
  if (!buildingForm.metros_totales || Number(buildingForm.metros_totales) <= 0) errors.metros_totales = 'Debe ser mayor a 0';

  const handleCreate = () => {
    if (Object.keys(errors).length) return;
    const id = newId('e');
    db.saveEdificio({
      id,
      nombre: buildingForm.nombre.trim(),
      direccion: buildingForm.direccion,
      admin: buildingForm.admin,
      metros_totales: Number(buildingForm.metros_totales),
    });
    onSelect(id);
    resetForm();
    setShowModal(false);
    setOpen(false);
  };

  return (
    <div className="building-selector">
      <button className="building-selector-btn" onClick={() => setOpen(!open)}>
        <Building2 size={14} />
        <span className="building-name">{current?.nombre || 'Seleccionar edificio'}</span>
        <ChevronDown size={12} className={`chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown-menu">
            {edificios.map(e => (
              <button
                key={e.id}
                className={`dropdown-item ${e.id === edificioId ? 'active' : ''}`}
                onClick={() => { onSelect(e.id); setOpen(false); }}
              >
                <Building2 size={14} />
                {e.nombre}
              </button>
            ))}
            <div className="dropdown-divider" />
            <button className="dropdown-item new-item" onClick={() => { setShowModal(true); setOpen(false); }}>
              <Plus size={14} />
              Nuevo edificio
            </button>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo edificio</h3>
              <button className="btn-icon" onClick={() => { setShowModal(false); resetForm(); }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre del edificio</label>
                <input className={`form-input ${errors.nombre ? 'error' : ''}`}
                  value={buildingForm.nombre}
                  onChange={e => setBuildingForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Consorcio Belgrano 1240" maxLength={100} autoFocus />
                {errors.nombre && <div className="error-msg"><AlertCircle size={12} /> {errors.nombre}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Administrador</label>
                  <input className={`form-input ${errors.admin ? 'error' : ''}`} value={buildingForm.admin}
                    onChange={e => setBuildingForm(f => ({ ...f, admin: e.target.value }))}
                    placeholder="Nombre del administrador" maxLength={100} />
                  {errors.admin && <div className="error-msg"><AlertCircle size={12} /> {errors.admin}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Metros² totales</label>
                  <input className={`form-input ${errors.metros_totales ? 'error' : ''}`} type="number"
                    value={buildingForm.metros_totales}
                    onChange={e => setBuildingForm(f => ({ ...f, metros_totales: e.target.value }))}
                    placeholder="Ej: 800" />
                  {errors.metros_totales && <div className="error-msg"><AlertCircle size={12} /> {errors.metros_totales}</div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className={`form-input ${errors.direccion ? 'error' : ''}`} value={buildingForm.direccion}
                  onChange={e => setBuildingForm(f => ({ ...f, direccion: e.target.value }))}
                  placeholder="Ej: Belgrano 1240, Córdoba" maxLength={200} />
                {errors.direccion && <div className="error-msg"><AlertCircle size={12} /> {errors.direccion}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}>Crear edificio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewBuildingModal({ onSave, onClose }) {
  const [form, setForm] = useState({ nombre: '', direccion: '', admin: '', metros_totales: '' });
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = 'Requerido';
  if (!form.admin.trim()) errors.admin = 'Requerido';
  if (!form.direccion.trim()) errors.direccion = 'Requerido';
  if (!form.metros_totales || Number(form.metros_totales) <= 0) errors.metros_totales = 'Debe ser mayor a 0';
  const handleCreate = () => {
    if (Object.keys(errors).length) return;
    const id = newId('e');
    db.saveEdificio({ id, nombre: form.nombre.trim(), direccion: form.direccion, admin: form.admin, metros_totales: Number(form.metros_totales) });
    onSave(id);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nuevo edificio</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre del edificio</label>
            <input className={`form-input ${errors.nombre ? 'error' : ''}`} value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Consorcio Belgrano 1240" maxLength={100} autoFocus />
            {errors.nombre && <div className="error-msg"><AlertCircle size={12} /> {errors.nombre}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Administrador</label>
              <input className={`form-input ${errors.admin ? 'error' : ''}`} value={form.admin}
                onChange={e => setForm(f => ({ ...f, admin: e.target.value }))}
                placeholder="Nombre del administrador" maxLength={100} />
              {errors.admin && <div className="error-msg"><AlertCircle size={12} /> {errors.admin}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Metros² totales</label>
              <input className={`form-input ${errors.metros_totales ? 'error' : ''}`} type="number"
                value={form.metros_totales}
                onChange={e => setForm(f => ({ ...f, metros_totales: e.target.value }))}
                placeholder="Ej: 800" />
              {errors.metros_totales && <div className="error-msg"><AlertCircle size={12} /> {errors.metros_totales}</div>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input className={`form-input ${errors.direccion ? 'error' : ''}`} value={form.direccion}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
              placeholder="Ej: Belgrano 1240, Córdoba" maxLength={200} />
            {errors.direccion && <div className="error-msg"><AlertCircle size={12} /> {errors.direccion}</div>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCreate}>Crear edificio</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewBuilding, setShowNewBuilding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [edificioId, setEdificioId] = useState(null);
  const [periodo, setPeriodo] = useState(getMesActual());
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeHiding, setWelcomeHiding] = useState(false);
  const toasts = useToastState();

  const handleWelcomeContinue = () => {
    setWelcomeHiding(true);
    setTimeout(() => setShowWelcome(false), 500);
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      const meta = document.getElementById('theme-color');
      if (meta) meta.setAttribute('content', saved === 'dark' ? '#111318' : '#F4F5F7');
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setEdificioId(null);
    setPage('dashboard');
    loadData().then(() => {
      const edificios = db.getEdificios();
      if (edificios.length > 0) {
        setEdificioId(edificios[0].id);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Error loading data:', err);
      setLoadError(err.message || 'Error de conexión con el servidor');
      setLoading(false);
    });
  }, [user?.id]);

  const handleBuildingChange = useCallback((id) => {
    setEdificioId(id);
    setPage('dashboard');
  }, []);

  if (loadError) {
    return (
      <div className="empty-buildings" style={{ gap: '12px' }}>
        <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
        <h2>Error de conexión</h2>
        <p style={{ maxWidth: 400, textAlign: 'center' }}>No se pudo cargar la información del servidor. Revisá que el backend esté corriendo.</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{loadError}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!edificioId) {
    return (
      <div className="empty-buildings">
        <Building2 size={48} />
        <h2>No hay edificios</h2>
        <p>Creá el primer edificio para empezar a gestionar.</p>
        <button className="btn btn-primary" onClick={() => setShowNewBuilding(true)}>
          Crear edificio
        </button>
        {showNewBuilding && (
          <NewBuildingModal
            onSave={(id) => { setEdificioId(id); setShowNewBuilding(false); }}
            onClose={() => setShowNewBuilding(false)}
          />
        )}
      </div>
    );
  }

  const config = db.getEdificios().find(e => e.id === edificioId) || {};
  const PageComponent = PAGES[page] || Dashboard;

  const grupos = ['principal', 'gestion', 'operaciones'];
  const grupoLabels = { principal: null, gestion: 'Gestión', operaciones: 'Operaciones' };

  const handleNav = (id) => {
    setPage(id);
    setSidebarOpen(false);
  };

  return (
    <>
      <div className="app-shell">
        {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <h1>Concorcio</h1>
            <BuildingSelector edificioId={edificioId} onSelect={handleBuildingChange} />
          </div>

          <nav className="sidebar-nav">
            {grupos.map(grupo => {
              const items = NAV.filter(n => n.group === grupo);
              return (
                <div key={grupo} className="nav-section">
                  {grupoLabels[grupo] && <div className="nav-label">{grupoLabels[grupo]}</div>}
                  {items.map(item => (
                    <button key={item.id}
                      className={`nav-item ${page === item.id ? 'active' : ''}`}
                      onClick={() => handleNav(item.id)}>
                      <item.icon size={15} />
                      {item.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <button className="nav-item" onClick={() => setShowSettings(true)}>
              <Settings size={15} />
              Configuración
            </button>
          </div>
        </aside>

        <main className="main-content">
          <div className="mobile-topbar" id="mobile-topbar">
            <button className="btn-icon" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <span className="mobile-title">
              {NAV.find(n => n.id === page)?.label || 'Concorcio'}
            </span>
            <span className="mobile-building">{config.nombre || ''}</span>
          </div>

          <PageComponent key={`${page}-${edificioId}`} edificioId={edificioId} periodo={periodo} setPeriodo={setPeriodo} />
        </main>

        {showSettings && (
          <SettingsModal
            edificioId={edificioId}
            onClose={() => setShowSettings(false)}
            onDeleted={() => setEdificioId(null)}
          />
        )}
      </div>

      {showWelcome && (
        <div className={`welcome-overlay ${welcomeHiding ? 'welcome-hiding' : ''}`}>
          <div className="welcome-bg">
            <div className="welcome-circle welcome-circle-1" />
            <div className="welcome-circle welcome-circle-2" />
            <div className="welcome-circle welcome-circle-3" />
          </div>
          <div className="welcome-content">
            <div className="welcome-icon-wrap">
              <Sparkles size={28} className="welcome-sparkle" />
              <Building2 size={48} className="welcome-building" />
            </div>
            <h1 className="welcome-title">Concorcio</h1>
            <p className="welcome-subtitle">Gestión simple de consorcios</p>
            <p className="welcome-desc">
              Administrá edificios, departamentos, gastos y cobranzas<br />
              de forma clara y eficiente.
            </p>
            <button className="welcome-btn" onClick={handleWelcomeContinue}>
              <span>Continuar</span>
              <ArrowRight size={18} className="welcome-btn-arrow" />
            </button>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
