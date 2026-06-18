import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Receipt, AlertCircle } from 'lucide-react';
import { db, newId, formatMonto, formatPeriodo } from '../data/db';
import { Modal, ConfirmDialog, EmptyState } from '../components/UI';
import PeriodoSelector from '../components/PeriodoSelector';

export default function Gastos({ edificioId, periodo: periodoFilter, setPeriodo: setPeriodoFilter }) {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const gastos = db.getGastos().filter(g => g.edificio_id === edificioId);
  const filtrados = gastos.filter(g => {
    if (periodoFilter && g.periodo !== periodoFilter) return false;
    if (tipoFilter !== 'todos' && g.tipo !== tipoFilter) return false;
    if (search && !g.descripcion.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const total = filtrados.reduce((s, g) => s + g.monto, 0);
  const totalOrdinario = filtrados.filter(g => g.tipo === 'ordinario').reduce((s, g) => s + g.monto, 0);
  const totalExtra = filtrados.filter(g => g.tipo === 'extraordinario').reduce((s, g) => s + g.monto, 0);

  const handleSave = (data) => {
    if (editing) {
      db.saveGasto({ ...editing, ...data });
    } else {
      db.saveGasto({ ...data, id: newId('g'), edificio_id: edificioId, creado_en: new Date().toISOString() });
    }
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    db.deleteGasto(id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Gastos</h2>
          <p>{formatPeriodo(periodoFilter)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="tabs">
            {['todos', 'ordinario', 'extraordinario'].map(t => (
              <button key={t} className={`tab ${tipoFilter === t ? 'active' : ''}`}
                onClick={() => setTipoFilter(t)}>
                {t === 'todos' ? 'Todos' : t === 'ordinario' ? 'Ordinarios' : 'Extraordinarios'}
              </button>
            ))}
          </div>
          <PeriodoSelector value={periodoFilter} onChange={setPeriodoFilter} edificioId={edificioId} />
          <div className="search-bar">
            <Search size={14} />
            <input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Total filtrado</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatMonto(total)}</div>
            <div className="stat-sub">{filtrados.length} gastos</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ordinarios</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--accent)' }}>{formatMonto(totalOrdinario)}</div>
            <div className="stat-sub">{Math.round((totalOrdinario / Math.max(total, 1)) * 100)}% del total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Extraordinarios</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--warning)' }}>{formatMonto(totalExtra)}</div>
            <div className="stat-sub">{Math.round((totalExtra / Math.max(total, 1)) * 100)}% del total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Promedio por gasto</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{filtrados.length > 0 ? formatMonto(Math.round(total / filtrados.length)) : '$ 0'}</div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Período</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Receipt} message="Sin gastos" /></td></tr>
              ) : filtrados.map(g => (
                <tr key={g.id}>
                  <td className="font-medium">{g.descripcion}</td>
                  <td><span className={`badge ${g.tipo === 'ordinario' ? 'badge-info' : 'badge-warning'}`}>{g.tipo}</span></td>
                  <td className="text-muted">{g.periodo}</td>
                  <td className="text-muted">{new Date(g.fecha + 'T12:00').toLocaleDateString('es-AR')}</td>
                  <td className="text-muted">{g.proveedor || '—'}</td>
                  <td className="font-semibold">{formatMonto(g.monto)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-icon btn-sm" title="Editar"
                        onClick={() => { setEditing(g); setShowForm(true); }}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn-icon btn-sm" title="Eliminar"
                        onClick={() => setConfirmDelete(g)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <GastoForm
          editing={editing}
          periodoActual={periodoFilter}
          onSave={handleSave}
          onClose={() => { setEditing(null); setShowForm(false); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
          title="Eliminar gasto"
          message={`¿Eliminar "${confirmDelete.descripcion}" por ${formatMonto(confirmDelete.monto)}?`}
        />
      )}
    </div>
  );
}

function GastoForm({ editing, periodoActual, onSave, onClose }) {
  const now = new Date();
  const hoyStr = now.toISOString().slice(0, 10);
  const [form, setForm] = useState({
    descripcion: editing?.descripcion || '',
    monto: editing?.monto || '',
    tipo: editing?.tipo || 'ordinario',
    periodo: editing?.periodo || periodoActual,
    fecha: editing?.fecha || hoyStr,
    proveedor: editing?.proveedor || '',
  });

  const periodos = [];
  for (let i = 0; i <= 11; i++) {
    const d = new Date(now); d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    periodos.push({ val, label: formatPeriodo(val) });
  }

  const errors = {};
  if (!form.descripcion.trim()) errors.descripcion = 'Requerido';
  if (!form.monto || form.monto <= 0) errors.monto = 'Debe ser mayor a 0';

  const handleSubmit = () => {
    if (Object.keys(errors).length) return;
    onSave({ ...form, monto: Number(form.monto) });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={editing ? 'Editar gasto' : 'Nuevo gasto'}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <input className={`form-input ${errors.descripcion ? 'error' : ''}`}
            value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Ej: Limpieza y mantenimiento" autoFocus />
          {errors.descripcion && <div className="error-msg"><AlertCircle size={12} /> {errors.descripcion}</div>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monto</label>
            <input className={`form-input ${errors.monto ? 'error' : ''}`} type="number"
              value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
              placeholder="Ej: 45000" />
            {errors.monto && <div className="error-msg"><AlertCircle size={12} /> {errors.monto}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="ordinario">Ordinario</option>
              <option value="extraordinario">Extraordinario</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Período</label>
            <select className="form-select" value={form.periodo}
              onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}>
              {periodos.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="form-input" type="date" value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Proveedor</label>
          <input className="form-input" value={form.proveedor}
            onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
            placeholder="Nombre del proveedor" />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {editing ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
      </div>
    </Modal>
  );
}
