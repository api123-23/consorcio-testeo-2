import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Users, AlertCircle, X } from 'lucide-react';
import { db, newId, validateDNI, validateEmail, isDNIUnique, isEmailUnique, getRev } from '../data/db';
import { Modal, ConfirmDialog, EmptyState } from '../components/UI';

export default function Personas({ edificioId }) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filtro, setFiltro] = useState('todos'); // todos | propietarios | inquilinos

  // Build sets of propietario/inquilino persona ids for the current building
  const idsEnEdificio = useMemo(() => {
    const deptos = db.getDepartamentos().filter(d => d.edificio_id === edificioId && d.activo);
    const deptoIds = deptos.map(d => d.id);
    const props = new Set();
    const inqs = new Set();
    db.getPropietarios().filter(r => r.activo && deptoIds.includes(r.departamento_id)).forEach(r => props.add(r.persona_id));
    db.getInquilinos().filter(r => r.activo && !r.fecha_hasta && deptoIds.includes(r.departamento_id)).forEach(r => inqs.add(r.persona_id));
    return { props, inqs };
  }, [edificioId, getRev()]);

  const personas = db.getPersonas().filter(p => p.activo);
  const filtradosBase = filtro === 'todos' ? personas
    : filtro === 'propietarios' ? personas.filter(p => idsEnEdificio.props.has(p.id))
    : personas.filter(p => idsEnEdificio.inqs.has(p.id));

  const filtrados = search
    ? filtradosBase.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.dni.includes(search) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
      )
    : filtradosBase;

  const handleSave = (data) => {
    if (editing) {
      db.savePersona({ ...editing, ...data });
    } else {
      db.savePersona({ ...data, id: newId('p'), activo: 1 });
    }
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    db.deletePersona(id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Personas</h2>
          <p>{personas.length} registradas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="filter-tabs">
            <button className={`filter-tab ${filtro === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltro('todos')}>Todos</button>
            <button className={`filter-tab ${filtro === 'propietarios' ? 'active' : ''}`}
              onClick={() => setFiltro('propietarios')}>Propietarios</button>
            <button className={`filter-tab ${filtro === 'inquilinos' ? 'active' : ''}`}
              onClick={() => setFiltro('inquilinos')}>Inquilinos</button>
          </div>
          <div className="search-bar">
            <Search size={14} />
            <input placeholder="Buscar persona..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Total personas</div>
            <div className="stat-value">{personas.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Son propietarios</div>
            <div className="stat-value">{db.getPropietarios().filter(r => r.activo).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Son inquilinos</div>
            <div className="stat-value">{db.getInquilinos().filter(r => r.activo && !r.fecha_hasta).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sin vínculo</div>
            <div className="stat-value">
              {(() => {
                const vinculadas = new Set();
                db.getPropietarios().filter(r => r.activo).forEach(r => vinculadas.add(r.persona_id));
                db.getInquilinos().filter(r => r.activo && !r.fecha_hasta).forEach(r => vinculadas.add(r.persona_id));
                return personas.filter(p => !vinculadas.has(p.id)).length;
              })()}
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={Users} message="Sin personas" /></td></tr>
              ) : filtrados.map(p => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nombre}</td>
                  <td className="text-muted">{p.dni || '—'}</td>
                  <td className="text-muted">{p.email || '—'}</td>
                  <td className="text-muted">{p.telefono || '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-icon btn-sm" title="Editar"
                        onClick={() => { setEditing(p); setShowForm(true); }}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn-icon btn-sm" title="Eliminar"
                        onClick={() => setConfirmDelete(p)}>
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
        <PersonaForm
          editing={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setShowForm(false); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
          title="Eliminar persona"
          message={`¿Eliminar a ${confirmDelete.nombre}?`}
        />
      )}
    </div>
  );
}

function PersonaForm({ editing, onSave, onClose }) {
  const [form, setForm] = useState({
    nombre: editing?.nombre || '',
    dni: editing?.dni || '',
    email: editing?.email || '',
    telefono: editing?.telefono || '',
    direccion: editing?.direccion || '',
    observaciones: editing?.observaciones || '',
  });

  const errors = {};
  if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido';
  if (!form.telefono.trim()) errors.telefono = 'El teléfono es requerido';
  if (form.dni && !validateDNI(form.dni)) errors.dni = 'DNI inválido (7-9 dígitos)';
  if (form.dni && !isDNIUnique(form.dni, editing?.id)) errors.dni = 'DNI ya registrado';
  if (form.email && !validateEmail(form.email)) errors.email = 'Email inválido';
  if (form.email && !isEmailUnique(form.email, editing?.id)) errors.email = 'Email ya registrado';

  const handleSubmit = () => {
    if (Object.keys(errors).length) return;
    onSave(form);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={editing ? 'Editar persona' : 'Nueva persona'}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Nombre completo</label>
          <input className={`form-input ${errors.nombre ? 'error' : ''}`}
            value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre y apellido" autoFocus />
          {errors.nombre && <div className="error-msg"><AlertCircle size={12} /> {errors.nombre}</div>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">DNI</label>
            <input className={`form-input ${errors.dni ? 'error' : ''}`}
              value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
              placeholder="Número de documento" />
            {errors.dni && <div className="error-msg"><AlertCircle size={12} /> {errors.dni}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className={`form-input ${errors.telefono ? 'error' : ''}`} value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              placeholder="Ej: 351-4567890" />
            {errors.telefono && <div className="error-msg"><AlertCircle size={12} /> {errors.telefono}</div>}
          </div>
        </div>
        <div className="form-group">
            <label className="form-label">Email</label>
            <input className={`form-input ${errors.email ? 'error' : ''}`}
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="correo@ejemplo.com" />
            {errors.email && <div className="error-msg"><AlertCircle size={12} /> {errors.email}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-input" value={form.direccion}
                onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                placeholder="Dirección particular" />
            </div>
            <div className="form-group">
              <label className="form-label">Observaciones</label>
              <input className="form-input" value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Notas adicionales" />
            </div>
          </div>
        </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {editing ? 'Guardar cambios' : 'Agregar persona'}
        </button>
      </div>
    </Modal>
  );
}
