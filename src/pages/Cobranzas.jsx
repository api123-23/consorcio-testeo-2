import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Search, DollarSign, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { db, newId, formatMonto, formatPeriodo, calcularExpensaDepartamento, getEstadoDepartamento, getPropietariosDeDepartamento, getInquilinoActual, getDepartamentosDeEdificio, getRev } from '../data/db';
import { Modal, ConfirmDialog, EmptyState } from '../components/UI';
import PeriodoSelector from '../components/PeriodoSelector';

export default function Cobranzas({ edificioId, periodo, setPeriodo }) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPago, setEditPago] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [preselectDeptoId, setPreselectDeptoId] = useState(null);

  const departamentos = useMemo(() => getDepartamentosDeEdificio(edificioId), [edificioId, getRev()]);
  const pagos = useMemo(() => db.getPagos().filter(p => p.periodo === periodo), [periodo, getRev()]);

  const estadoUnidades = useMemo(() => {
    return departamentos
      .filter(d => d.activo)
      .map(d => {
        const estado = getEstadoDepartamento(d.id, periodo);
        const pagosDepto = pagos.filter(p => p.departamento_id === d.id);
        const totalPagado = pagosDepto.reduce((s, p) => s + p.monto, 0);
        const expensa = calcularExpensaDepartamento(d, periodo);
        const props = getPropietariosDeDepartamento(d.id);
        const inq = getInquilinoActual(d.id);
        return { departamento: d, estado, pagos: pagosDepto, pago: pagosDepto[0] || null, totalPagado, expensa, propietarios: props, inquilino: inq };
      });
  }, [departamentos, pagos, periodo]);

  const filtrados = estadoUnidades.filter(e =>
    e.departamento.numero.toLowerCase().includes(search.toLowerCase()) ||
    e.propietarios.some(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
  );

  const pagados = estadoUnidades.filter(e => e.estado === 'al_dia').length;
  const parciales = estadoUnidades.filter(e => e.estado === 'parcial').length;
  const deudores = estadoUnidades.filter(e => e.estado === 'deudor').length;
  const totalRecaudado = pagos.reduce((s, p) => s + p.monto, 0);

  const handleSavePago = (data) => {
    if (editPago) {
      db.savePago({ ...editPago, ...data });
    } else {
      db.savePago({ ...data, id: newId('pa'), creado_en: new Date().toISOString() });
    }
    setEditPago(null);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    db.deletePago(id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Cobranzas</h2>
          <p>Gestión de pagos por período</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodoSelector value={periodo} onChange={setPeriodo} edificioId={edificioId} />
          <div className="search-bar">
            <Search size={14} />
            <input placeholder="Buscar unidad..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Recaudado</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>{formatMonto(totalRecaudado)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pagaron</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{pagados}</div>
            <div className="stat-sub">unidades</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Parciales</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{parciales}</div>
            <div className="stat-sub">unidades</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Deben</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{deudores}</div>
            <div className="stat-sub">unidades</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cobertura</div>
            <div className="stat-value">{estadoUnidades.length > 0 ? Math.round(((pagados + parciales) / estadoUnidades.length) * 100) : 0}%</div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Propietario</th>
                <th>Ocupante</th>
                <th>Expensa</th>
                <th>Estado</th>
                <th>Pago</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={DollarSign} message="Sin datos" /></td></tr>
              ) : filtrados.map(e => (
                <tr key={e.departamento.id}>
                  <td className="font-medium">Unidad {e.departamento.numero}</td>
                  <td className="text-muted">{e.propietarios.map(p => p.nombre.split(' ')[0]).join(', ') || '—'}</td>
                  <td className="text-muted">{e.inquilino ? e.inquilino.nombre.split(' ')[0] : <span className="text-xs">Prop.</span>}</td>
                  <td className="font-medium">{formatMonto(e.expensa)}</td>
                  <td>
                    <span className={`badge ${e.estado === 'al_dia' ? 'badge-success' : e.estado === 'parcial' ? 'badge-warning' : 'badge-danger'}`}>
                      {e.estado === 'al_dia' ? 'Pagó' : e.estado === 'parcial' ? 'Parcial' : 'Debe'}
                    </span>
                  </td>
                  <td>
                    {e.totalPagado > 0 ? (
                      <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                        {formatMonto(e.totalPagado)}
                        <span className="text-xs text-muted" style={{ display: 'block' }}>
                          {e.pagos.map(p => p.metodo).filter(Boolean).join(', ') || e.pago?.metodo}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted text-sm">—</span>
                    )}
                  </td>
                  <td>
                    {e.estado === 'deudor' || e.estado === 'parcial' ? (
                      <button className="btn btn-success btn-sm"
                        onClick={() => { setEditPago(null); setShowForm(true); setPreselectDeptoId(e.departamento.id); }}>
                        {e.estado === 'parcial' ? 'Completar pago' : 'Registrar pago'}
                      </button>
                    ) : e.estado === 'al_dia' && e.pago && (
                      <div className="flex gap-2">
                        <button className="btn-icon btn-sm" title="Eliminar pago"
                          onClick={() => setConfirmDelete(e.pago)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <CobranzaForm
          edificioId={edificioId}
          periodo={periodo}
          preselectDeptoId={preselectDeptoId}
          onSave={handleSavePago}
          onClose={() => { setEditPago(null); setShowForm(false); setPreselectDeptoId(null); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
          title="Eliminar pago"
          message={`¿Eliminar el pago de ${formatMonto(confirmDelete.monto)}?`}
        />
      )}
    </div>
  );
}

function CobranzaForm({ edificioId, periodo, preselectDeptoId, onSave, onClose }) {
  const departamentos = useMemo(() => getDepartamentosDeEdificio(edificioId).filter(d => d.activo), [edificioId]);
  const [selectedDepto, setSelectedDepto] = useState(null);
  const [form, setForm] = useState({
    departamento_id: '',
    periodo: periodo,
    monto: '',
    fecha_pago: new Date().toISOString().slice(0, 10),
    metodo: 'transferencia',
    comprobante: '',
  });

  const expensaCalculada = selectedDepto ? calcularExpensaDepartamento(selectedDepto, periodo) : 0;
  const pagosExistentes = useMemo(() => {
    if (!selectedDepto) return [];
    return db.getPagos().filter(p => p.departamento_id === selectedDepto.id && p.periodo === periodo);
  }, [selectedDepto, periodo, getRev()]);
  const totalPagado = pagosExistentes.reduce((s, p) => s + p.monto, 0);
  const restante = Math.max(0, expensaCalculada - totalPagado);

  // Auto-select if preselectDeptoId is provided
  useEffect(() => {
    if (preselectDeptoId && !selectedDepto) {
      const d = departamentos.find(dep => dep.id === preselectDeptoId);
      if (d) handleDeptoSelect(d);
    }
  }, [preselectDeptoId]);

  const handleDeptoSelect = (d) => {
    setSelectedDepto(d);
    const expensa = calcularExpensaDepartamento(d, periodo);
    const pagado = db.getPagos().filter(p => p.departamento_id === d.id && p.periodo === periodo)
      .reduce((s, p) => s + p.monto, 0);
    setForm(f => ({ ...f, departamento_id: d.id, monto: Math.max(0, expensa - pagado) }));
  };

  const handlePagoTotal = () => {
    setForm(f => ({ ...f, monto: restante }));
  };

  const errors = {};
  if (!form.departamento_id) errors.departamento_id = 'Seleccioná un departamento';
  if (!form.monto || form.monto <= 0) errors.monto = 'Monto inválido';

  // Valida que el monto no supere lo que resta pagar
  if (selectedDepto && form.monto > 0 && restante >= 0 && Number(form.monto) > restante) {
    errors.monto = `Solo resta pagar ${formatMonto(restante)}`;
  }

  if (!form.fecha_pago) errors.fecha_pago = 'Requerido';

  const handleSubmit = () => {
    if (Object.keys(errors).length) return;
    onSave({ ...form, monto: Number(form.monto) });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Registrar pago" size="modal-lg">
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Departamento</label>
          {selectedDepto ? (
            <div className="tag-list">
              <span className="tag">
                Unidad {selectedDepto.numero}
                <button className="tag-remove" onClick={() => setSelectedDepto(null)}><XCircle size={12} /></button>
              </span>
            </div>
          ) : null}
          {!selectedDepto && (
            <div className="depto-select-grid">
              {departamentos.map(d => (
                <button key={d.id} className="depto-select-card" onClick={() => handleDeptoSelect(d)}>
                  <span className="font-medium">Unidad {d.numero}</span>
                  <span className="text-xs text-muted">{d.porcentaje}%</span>
                </button>
              ))}
            </div>
          )}
          {errors.departamento_id && <div className="error-msg"><AlertCircle size={12} /> {errors.departamento_id}</div>}
        </div>

        {selectedDepto && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Período</label>
                <input className="form-input" value={formatPeriodo(form.periodo)} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Monto</label>
                {pagosExistentes.length > 0 && (
                  <div className="text-xs text-muted" style={{ marginBottom: 4 }}>
                    Pagado: {formatMonto(totalPagado)} — Resta: {formatMonto(restante)}
                  </div>
                )}
                <div className="monto-input-wrap">
                  <input className={`form-input ${errors.monto ? 'error' : ''}`} type="number"
                    value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
                  <button className="btn btn-sm btn-secondary monto-total-btn" onClick={handlePagoTotal}
                    title={`Completar con ${formatMonto(restante)}`}>
                    Pago total
                  </button>
                </div>
                {errors.monto && <div className="error-msg"><AlertCircle size={12} /> {errors.monto}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha de pago</label>
                <input className={`form-input ${errors.fecha_pago ? 'error' : ''}`} type="date" value={form.fecha_pago}
                  onChange={e => setForm(f => ({ ...f, fecha_pago: e.target.value }))} />
                {errors.fecha_pago && <div className="error-msg"><AlertCircle size={12} /> {errors.fecha_pago}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Método</label>
                <select className="form-select" value={form.metodo}
                  onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="debito">Débito automático</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Comprobante (opcional)</label>
              <input className="form-input" value={form.comprobante}
                onChange={e => setForm(f => ({ ...f, comprobante: e.target.value }))}
                placeholder="N° de comprobante" maxLength={50} />
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!selectedDepto}>
          Registrar pago
        </button>
      </div>
    </Modal>
  );
}
