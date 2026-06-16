import { useMemo } from 'react';
import { Building2, Users, AlertCircle, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { db, getMesActual, formatPeriodo, formatMonto, getEstadoDepartamento, calcularExpensaDepartamento, getPropietariosDeDepartamento, getInquilinoActual, getDepartamentosDeEdificio, getRev } from '../data/db';

export default function Dashboard({ edificioId }) {
  const data = useMemo(() => {
    const edificio = db.getEdificios().find(e => e.id === edificioId);
    const departamentos = getDepartamentosDeEdificio(edificioId);
    const personas = db.getPersonas().filter(p => p.activo);
    const periodo = getMesActual();
    const gastos = db.getGastos().filter(g => g.periodo === periodo && g.edificio_id === edificioId);
    const pagos = db.getPagos();

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const gastosOrdinarios = gastos.filter(g => g.tipo === 'ordinario').reduce((s, g) => s + g.monto, 0);
    const gastosExtra = gastos.filter(g => g.tipo === 'extraordinario').reduce((s, g) => s + g.monto, 0);

    let pagados = 0, deudores = 0, montoRecaudado = 0;
    departamentos.forEach(d => {
      const estado = getEstadoDepartamento(d.id, periodo);
      if (estado === 'al_dia') { pagados++; montoRecaudado += calcularExpensaDepartamento(d, periodo); }
      else deudores++;
    });

    const pagosMes = pagos.filter(p => {
      const depto = departamentos.find(d => d.id === p.departamento_id);
      return depto && p.periodo === periodo;
    }).sort((a, b) => new Date(b.creado_en || b.fecha_pago) - new Date(a.creado_en || a.fecha_pago)).slice(0, 5);

    const gastosRecientes = gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

    return { edificio, departamentos, personas, periodo, totalGastos, gastosOrdinarios, gastosExtra, pagados, deudores, montoRecaudado, pagosMes, gastosRecientes };
  }, [edificioId, getRev()]);

  const pctRecaudado = data.totalGastos > 0 ? Math.round((data.montoRecaudado / data.totalGastos) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{data.edificio?.nombre || 'Resumen'}</h2>
          <p>{formatPeriodo(data.periodo)}</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm text-muted">{new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Deptos.</div>
            <div className="stat-value">{data.departamentos.length}</div>
            <div className="stat-sub flex items-center gap-2">
              <span style={{ color: 'var(--success)' }}>{data.pagados} al día</span>
              <span>·</span>
              <span style={{ color: 'var(--danger)' }}>{data.deudores} deudores</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gastos del mes</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatMonto(data.totalGastos)}</div>
            <div className="stat-sub">{formatMonto(data.gastosOrdinarios)} ord. · {formatMonto(data.gastosExtra)} extr.</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recaudado</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>{formatMonto(data.montoRecaudado)}</div>
            <div className="stat-sub">{pctRecaudado}% del total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Personas</div>
            <div className="stat-value">{data.personas.length}</div>
            <div className="stat-sub">{data.personas.filter(p => p.activo).length} activas</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recaudación — {formatPeriodo(data.periodo)}</span>
            <span className={`badge ${pctRecaudado >= 70 ? 'badge-success' : pctRecaudado >= 40 ? 'badge-warning' : 'badge-danger'}`}>
              {pctRecaudado}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill"
              style={{
                width: `${pctRecaudado}%`,
                background: pctRecaudado >= 70 ? 'var(--success)' : pctRecaudado >= 40 ? 'var(--warning)' : 'var(--danger)',
              }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted">Recaudado: {formatMonto(data.montoRecaudado)}</span>
            <span className="text-xs text-muted">Total: {formatMonto(data.totalGastos)}</span>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Estado de departamentos</span>
              <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.departamentos.map(d => {
                const estado = getEstadoDepartamento(d.id, data.periodo);
                const props = getPropietariosDeDepartamento(d.id);
                const inq = getInquilinoActual(d.id);
                return (
                  <div key={d.id} className="list-row">
                    <div className="flex items-center gap-2">
                      {estado === 'al_dia'
                        ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                        : <AlertCircle size={14} style={{ color: 'var(--danger)' }} />}
                      <span className="font-medium">Unidad {d.numero}</span>
                      <span className="text-xs text-muted">{props[0]?.nombre?.split(' ')[0] || ''}</span>
                      {inq && <span className="badge badge-info" style={{ fontSize: 10 }}>Inq.</span>}
                    </div>
                    <span className={`badge ${estado === 'al_dia' ? 'badge-success' : 'badge-danger'}`}>
                      {estado === 'al_dia' ? 'Al día' : 'Deudor'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Últimos pagos</span>
              <DollarSign size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            {data.pagosMes.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>Sin pagos este mes</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.pagosMes.map(pago => {
                  const depto = data.departamentos.find(d => d.id === pago.departamento_id);
                  return (
                    <div key={pago.id} className="list-row">
                      <div>
                        <span className="font-medium">Unidad {depto?.numero}</span>
                        <div className="text-xs text-muted">
                          {new Date((pago.fecha_pago || '').split('T')[0] + 'T12:00').toLocaleDateString('es-AR')}
                        </div>
                      </div>
                      <span className="font-semibold" style={{ color: 'var(--success)' }}>{formatMonto(pago.monto)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="separator" />
            <div className="card-header" style={{ marginBottom: 8 }}>
              <span className="card-title">Últimos gastos</span>
            </div>
            {data.gastosRecientes.map(g => (
              <div key={g.id} className="list-row-border">
                <div>
                  <span className="text-sm font-medium">{g.descripcion}</span>
                  <div>
                    <span className={`badge ${g.tipo === 'ordinario' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                      {g.tipo}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold">{formatMonto(g.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
