import { useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Building2, AlertCircle, UserPlus, X } from 'lucide-react';
import { db, newId, getMesActual, formatMonto, getEstadoDepartamento, calcularExpensaDepartamento, getPeriodosDeuda, getPropietariosDeDepartamento, getInquilinoActual, getRev, validateDNI, validateEmail, isDNIUnique, isEmailUnique } from '../data/db';
import { Modal, ConfirmDialog, EmptyState } from '../components/UI';

export default function Departamentos({ edificioId }) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const departamentos = useMemo(() => {
    return db.getDepartamentos().filter(d => d.edificio_id === edificioId);
  }, [edificioId, getRev()]);

  const activos = departamentos.filter(d => d.activo);
  const periodo = getMesActual();

  const filtrados = activos.filter(d =>
    d.numero.toLowerCase().includes(search.toLowerCase())
  );

  const alDia = filtrados.filter(d => getEstadoDepartamento(d.id, periodo) === 'al_dia').length;
  const deudores = filtrados.length - alDia;

  const handleSave = (data) => {
    const record = editing ? { ...editing, ...data } : { ...data, activo: 1 };
    db.saveDepartamento(record);
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    db.deleteDepartamento(id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Departamentos</h2>
          <p>{activos.length} unidades · {alDia} al día · {deudores} deudores</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="search-bar">
            <Search size={14} />
            <input placeholder="Buscar depto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{activos.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Al día</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{alDia}</div>
            <div className="stat-sub">{activos.length > 0 ? Math.round((alDia / activos.length) * 100) : 0}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Deudores</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{deudores}</div>
            <div className="stat-sub">{activos.length > 0 ? Math.round((deudores / activos.length) * 100) : 0}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Con inquilino</div>
            <div className="stat-value">{activos.filter(d => getInquilinoActual(d.id)).length}</div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Depto</th>
                <th>Piso</th>
                <th>Propietario(s)</th>
                <th>Inquilino</th>
                <th>%</th>
                <th>Expensa</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={Building2} message="Sin departamentos" /></td></tr>
              ) : filtrados.map(d => {
                const props = getPropietariosDeDepartamento(d.id);
                const inquilino = getInquilinoActual(d.id);
                const estado = getEstadoDepartamento(d.id, periodo);
                const expensa = calcularExpensaDepartamento(d, periodo);
                return (
                  <tr key={d.id}>
                    <td className="font-medium">Unidad {d.numero}</td>
                    <td className="text-muted">{d.piso}{d.letra ? (d.letra !== 'PB' ? d.letra : '') : ''}</td>
                    <td>{props.map(p => p.nombre).join(', ') || <span className="text-muted">—</span>}</td>
                    <td>{inquilino ? inquilino.nombre : <span className="text-muted">Vive propietario</span>}</td>
                    <td>{d.porcentaje}%</td>
                    <td className="font-medium">{formatMonto(expensa)}</td>
                    <td>
                      <span className={`badge ${estado === 'al_dia' ? 'badge-success' : 'badge-danger'}`}>
                        {estado === 'al_dia' ? 'Al día' : 'Deudor'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-icon btn-sm" title="Editar"
                          onClick={() => { setEditing(d); setShowForm(true); }}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn-icon btn-sm" title="Eliminar"
                          onClick={() => setConfirmDelete(d)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <DeptoForm
          editing={editing}
          edificioId={edificioId}
          onSave={handleSave}
          onClose={() => { setEditing(null); setShowForm(false); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
          title="Eliminar departamento"
          message={`¿Eliminar Unidad ${confirmDelete.numero}?`}
        />
      )}
    </div>
  );
}

function PersonSearch({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTel, setNewTel] = useState('');
  const [newDir, setNewDir] = useState('');

  const personas = db.getPersonas().filter(p => p.activo);
  const filtrados = query ? personas.filter(p =>
    p.nombre.toLowerCase().includes(query.toLowerCase()) ||
    p.dni.includes(query)
  ) : personas;

  const newErrors = {};
  if (!newName.trim()) newErrors.nombre = true;
  if (!newTel.trim()) newErrors.telefono = true;
  if (newDni && !validateDNI(newDni)) newErrors.dni = true;
  if (newDni && !isDNIUnique(newDni)) newErrors.dniDupe = true;
  if (newEmail && !validateEmail(newEmail)) newErrors.email = true;
  if (newEmail && !isEmailUnique(newEmail)) newErrors.emailDupe = true;

  const handleCreate = () => {
    if (Object.keys(newErrors).length) return;
    const p = { id: newId('p'), nombre: newName.trim(), dni: newDni, email: newEmail, telefono: newTel, direccion: newDir, activo: 1 };
    db.savePersona(p);
    onSelect(p);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{showNew ? 'Nueva persona' : 'Seleccionar persona'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {showNew ? (
            <div>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className={`form-input ${newErrors.nombre ? 'error' : ''}`} value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Nombre y apellido" autoFocus />
                {newErrors.nombre && <div className="error-msg"><AlertCircle size={12} /> El nombre es requerido</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">DNI</label>
                  <input className={`form-input ${newErrors.dni || newErrors.dniDupe ? 'error' : ''}`} value={newDni}
                    onChange={e => setNewDni(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="Número de documento" maxLength={9} />
                  {newErrors.dni && <div className="error-msg"><AlertCircle size={12} /> DNI inválido (7-9 dígitos)</div>}
                  {newErrors.dniDupe && <div className="error-msg"><AlertCircle size={12} /> DNI ya registrado</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className={`form-input ${newErrors.telefono ? 'error' : ''}`} value={newTel} onChange={e => setNewTel(e.target.value)}
                    placeholder="Ej: 351-4567890" />
                  {newErrors.telefono && <div className="error-msg"><AlertCircle size={12} /> El teléfono es requerido</div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className={`form-input ${newErrors.email || newErrors.emailDupe ? 'error' : ''}`} value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="correo@ejemplo.com" />
                {newErrors.email && <div className="error-msg"><AlertCircle size={12} /> Email inválido</div>}
                {newErrors.emailDupe && <div className="error-msg"><AlertCircle size={12} /> Email ya registrado</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className="form-input" value={newDir} onChange={e => setNewDir(e.target.value)}
                  placeholder="Dirección particular" />
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Volver</button>
                <button className="btn btn-primary" onClick={handleCreate}>Guardar y seleccionar</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="search-bar mb-2">
                <Search size={14} />
                <input placeholder="Buscar persona..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
              </div>
              <div className="person-list">
                {filtrados.map(p => (
                  <button key={p.id} className="person-list-item" onClick={() => onSelect(p)}>
                    <div className="person-list-name">{p.nombre}</div>
                    <div className="person-list-dni">{p.dni}</div>
                  </button>
                ))}
                {filtrados.length === 0 && <div className="text-muted text-sm" style={{ padding: 12 }}>Sin resultados</div>}
              </div>
              <div className="dropdown-divider" />
              <button className="btn btn-secondary w-full mt-2" onClick={() => setShowNew(true)}>
                <UserPlus size={14} /> Nueva persona
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeptoForm({ editing, edificioId, onSave, onClose }) {
  const edificio = useMemo(() => db.getEdificios().find(e => e.id === edificioId), [edificioId]);
  const [form, setForm] = useState({
    numero: editing?.numero || '',
    piso: editing?.piso ?? '',
    letra: editing?.letra || '',
    metros_cuadrados: editing?.metros_cuadrados || '',
  });

  const [propietarios, setPropietarios] = useState(
    editing ? getPropietariosDeDepartamento(editing.id) : []
  );
  const [inquilino, setInquilino] = useState(
    editing ? getInquilinoActual(editing.id) : null
  );
  const [showOwnerSearch, setShowOwnerSearch] = useState(false);
  const [showTenantSearch, setShowTenantSearch] = useState(false);

  const errors = {};
  if (!form.numero) errors.numero = 'Requerido';
  if (!form.metros_cuadrados || Number(form.metros_cuadrados) <= 0) errors.metros_cuadrados = 'Debe ser mayor a 0';
  if (edificio && form.metros_cuadrados) {
    const otros = db.getDepartamentos().filter(d =>
      d.edificio_id === edificioId && d.id !== editing?.id && d.activo
    );
    const sumaOtros = otros.reduce((s, d) => s + Number(d.metros_cuadrados || 0), 0);
    if (sumaOtros + Number(form.metros_cuadrados) > (edificio.metros_totales || 0)) {
      errors.metros_cuadrados = `Supera el total (${edificio.metros_totales}m² disponible)`;
    }
  }

  const handleSubmit = () => {
    if (Object.keys(errors).length) return;

    const deptoId = editing?.id || newId('d');
    const data = {
      id: deptoId,
      edificio_id: edificioId,
      numero: form.numero,
      piso: Number(form.piso) || 0,
      letra: form.letra,
      metros_cuadrados: Number(form.metros_cuadrados),
      activo: 1,
    };

    // Save department
    onSave(data);

    // Manage owners
    const currentOwners = editing ? getPropietariosDeDepartamento(editing.id) : [];
    const currentOwnerIds = currentOwners.map(o => o.id);
    const newOwnerIds = propietarios.map(o => o.id);

    // Remove owners no longer in list
    currentOwners.forEach(o => {
      if (!newOwnerIds.includes(o.id)) {
        db.removePropietario(deptoId, o.id);
      }
    });

    // Add new owners
    propietarios.forEach(o => {
      if (!currentOwnerIds.includes(o.id)) {
        db.savePropietario({
          id: newId('pr'),
          departamento_id: deptoId,
          persona_id: o.id,
          activo: 1,
        });
      }
    });

    // Manage tenant
    const currentInq = editing ? getInquilinoActual(editing.id) : null;
    if (currentInq && (!inquilino || currentInq.id !== inquilino.id)) {
      const rel = db.getInquilinos().find(r => r.departamento_id === deptoId && r.activo && !r.fecha_hasta);
      if (rel) db.removeInquilino(rel.id);
    }
    if (inquilino && (!currentInq || currentInq.id !== inquilino.id)) {
      db.saveInquilino({
        id: newId('i'),
        departamento_id: deptoId,
        persona_id: inquilino.id,
        fecha_desde: new Date().toISOString().slice(0, 10),
        activo: 1,
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Editar departamento' : 'Nuevo departamento'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Número</label>
              <input className={`form-input ${errors.numero ? 'error' : ''}`}
                value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                placeholder="Ej: 1A" autoFocus />
              {errors.numero && <div className="error-msg"><AlertCircle size={12} /> {errors.numero}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Piso</label>
              <input className="form-input" type="number" value={form.piso}
                onChange={e => setForm(f => ({ ...f, piso: e.target.value }))} placeholder="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Letra</label>
              <input className="form-input" value={form.letra}
                onChange={e => setForm(f => ({ ...f, letra: e.target.value }))} placeholder="A" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Metros² <span className="text-muted">(de {edificio?.metros_totales || '?'} totales)</span></label>
            <input className={`form-input ${errors.metros_cuadrados ? 'error' : ''}`} type="number"
              value={form.metros_cuadrados} onChange={e => setForm(f => ({ ...f, metros_cuadrados: e.target.value }))}
              placeholder="Ej: 96" step="0.1" />
            {errors.metros_cuadrados && <div className="error-msg"><AlertCircle size={12} /> {errors.metros_cuadrados}</div>}
          </div>

          <div className="separator" />

          <div className="form-group">
            <label className="form-label">Propietario(s)</label>
            {propietarios.length > 0 ? (
              <div className="tag-list">
                {propietarios.map(p => (
                  <span key={p.id} className="tag">
                    {p.nombre}
                    <button className="tag-remove" onClick={() => setPropietarios(propietarios.filter(x => x.id !== p.id))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-muted text-sm" style={{ marginBottom: 8 }}>Sin propietarios asignados</div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => setShowOwnerSearch(true)}>
              <UserPlus size={13} /> {propietarios.length > 0 ? 'Agregar otro' : 'Asignar propietario'}
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Inquilino</label>
            {inquilino ? (
              <div className="tag-list">
                <span className="tag">
                  {inquilino.nombre}
                  <button className="tag-remove" onClick={() => setInquilino(null)}>
                    <X size={12} />
                  </button>
                </span>
              </div>
            ) : (
              <div className="text-muted text-sm" style={{ marginBottom: 8 }}>Sin inquilino (vive propietario)</div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => setShowTenantSearch(true)}>
              <UserPlus size={13} /> {inquilino ? 'Cambiar' : 'Asignar inquilino'}
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editing ? 'Guardar cambios' : 'Crear departamento'}
          </button>
        </div>
      </div>

      {showOwnerSearch && (
        <PersonSearch
          onSelect={(p) => { setPropietarios([...propietarios.filter(x => x.id !== p.id), p]); setShowOwnerSearch(false); }}
          onClose={() => setShowOwnerSearch(false)}
        />
      )}
      {showTenantSearch && (
        <PersonSearch
          onSelect={(p) => { setInquilino(p); setShowTenantSearch(false); }}
          onClose={() => setShowTenantSearch(false)}
        />
      )}
    </div>
  );
}
