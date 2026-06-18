import { useMemo } from 'react';
import { FileText, CheckCircle2, Printer } from 'lucide-react';
import { db, formatMonto, formatPeriodo, calcularExpensaDepartamento, getEstadoDepartamento, getPropietariosDeDepartamento, getInquilinoActual, getDepartamentosDeEdificio, getRev } from '../data/db';
import PeriodoSelector from '../components/PeriodoSelector';

export default function Liquidacion({ edificioId, periodo, setPeriodo }) {
  const data = useMemo(() => {
    const departamentos = getDepartamentosDeEdificio(edificioId).filter(d => d.activo);
    const gastos = db.getGastos().filter(g => g.periodo === periodo && g.edificio_id === edificioId);
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
    const ordinarios = gastos.filter(g => g.tipo === 'ordinario').reduce((s, g) => s + g.monto, 0);
    const extraordinarios = gastos.filter(g => g.tipo === 'extraordinario').reduce((s, g) => s + g.monto, 0);
    const sumPorcentajes = departamentos.reduce((s, d) => s + d.porcentaje, 0);

    const filas = departamentos.map(d => {
      const expensa = calcularExpensaDepartamento(d, periodo);
      const estado = getEstadoDepartamento(d.id, periodo);
      const pago = db.getPagos().find(p => p.departamento_id === d.id && p.periodo === periodo);
      const props = getPropietariosDeDepartamento(d.id);
      const inq = getInquilinoActual(d.id);
      return { departamento: d, expensa, estado, pago, propietarios: props, ocupante: inq || props[0] };
    });

    const totalLiquidado = filas.reduce((s, f) => s + f.expensa, 0);
    const recaudado = filas.filter(f => f.pago).reduce((s, f) => s + f.pago.monto, 0);
    const aRecaudar = filas.filter(f => f.propietarios.length > 0).reduce((s, f) => s + f.expensa, 0);
    const pctRecaudadoOcupados = aRecaudar > 0 ? Math.round((recaudado / aRecaudar) * 100) : 0;

    return { gastos, totalGastos, ordinarios, extraordinarios, sumPorcentajes, filas, totalLiquidado, recaudado, aRecaudar, pctRecaudadoOcupados };
  }, [periodo, edificioId, getRev()]);

  const handlePrint = () => window.print();

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Liquidación</h2>
          <p>{formatPeriodo(periodo)}</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <PeriodoSelector value={periodo} onChange={setPeriodo} edificioId={edificioId} />
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Total gastos</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatMonto(data.totalGastos)}</div>
            <div className="stat-sub">{data.gastos.length} items</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ordinarios</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--accent)' }}>{formatMonto(data.ordinarios)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Extraordinarios</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--warning)' }}>{formatMonto(data.extraordinarios)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recaudado</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>{formatMonto(data.recaudado)}</div>
            <div className="stat-sub">de {formatMonto(data.totalLiquidado)}</div>
          </div>
        </div>

        {data.aRecaudar > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recaudación vs. ocupados</span>
              <span className={`badge ${data.pctRecaudadoOcupados >= 80 ? 'badge-success' : data.pctRecaudadoOcupados >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                {data.pctRecaudadoOcupados}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill"
                style={{
                  width: `${data.pctRecaudadoOcupados}%`,
                  background: data.pctRecaudadoOcupados >= 80 ? 'var(--success)' : data.pctRecaudadoOcupados >= 50 ? 'var(--warning)' : 'var(--danger)',
                }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted">Recaudado: {formatMonto(data.recaudado)}</span>
              <span className="text-xs text-muted">A recaudar (ocupados): {formatMonto(data.aRecaudar)}</span>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Detalle de gastos — {formatPeriodo(periodo)}</span>
            <FileText size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.gastos.map(g => (
                <tr key={g.id}>
                  <td>{g.descripcion}</td>
                  <td><span className={`badge ${g.tipo === 'ordinario' ? 'badge-info' : 'badge-warning'}`}>{g.tipo}</span></td>
                  <td className="font-medium">{formatMonto(g.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Distribución por unidad</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Propietario</th>
                  <th>Ocupante</th>
                  <th>%</th>
                  <th>Expensa</th>
                  <th>Pagó</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.filas.map(f => (
                  <tr key={f.departamento.id}>
                    <td className="font-medium">Unidad {f.departamento.numero}</td>
                    <td className="text-muted">{f.propietarios.map(p => p.nombre.split(' ')[0]).join(', ')}</td>
                    <td className="text-muted">{f.ocupante?.nombre?.split(' ')[0] || '—'}</td>
                    <td>{f.departamento.porcentaje}%</td>
                    <td className="font-medium">{formatMonto(f.expensa)}</td>
                    <td>{f.pago ? <span style={{ color: 'var(--success)' }} className="font-medium">{formatMonto(f.pago.monto)}</span> : '—'}</td>
                    <td>
                      {f.estado === 'al_dia'
                        ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                        : f.estado === 'parcial'
                        ? <span className="badge badge-warning">Parcial</span>
                        : <span className="badge badge-danger">Debe</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
