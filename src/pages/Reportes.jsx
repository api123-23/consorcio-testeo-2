import { useState, useMemo } from 'react';
import { Download, FileText, BarChart2 } from 'lucide-react';
import { db, getMesActual, formatMonto, formatPeriodo, calcularExpensaDepartamento, getEstadoDepartamento, getPropietariosDeDepartamento, getInquilinoActual, getDepartamentosDeEdificio } from '../data/db';
import PeriodoSelector from '../components/PeriodoSelector';

function exportCSV(filename, rows, headers) {
  const csv = [headers.join(','), ...rows.map(r =>
    r.map(v => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function Reportes({ edificioId }) {
  const now = new Date();
  const periodos = [];
  for (let i = 0; i <= 11; i++) {
    const d = new Date(now); d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    periodos.push({ val, label: formatPeriodo(val) });
  }
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(getMesActual());

  const data = useMemo(() => {
    const departamentos = getDepartamentosDeEdificio(edificioId).filter(d => d.activo);
    const gastos = db.getGastos().filter(g => g.edificio_id === edificioId);
    const pagos = db.getPagos();

    const gastosPeriodo = gastos.filter(g => g.periodo === periodoSeleccionado);
    const totalGastos = gastosPeriodo.reduce((s, g) => s + g.monto, 0);

    const filas = departamentos.map(d => {
      const expensa = calcularExpensaDepartamento(d, periodoSeleccionado);
      const estado = getEstadoDepartamento(d.id, periodoSeleccionado);
      const pago = pagos.find(p => p.departamento_id === d.id && p.periodo === periodoSeleccionado);
      const props = getPropietariosDeDepartamento(d.id);
      const inq = getInquilinoActual(d.id);
      return {
        numero: d.numero,
        propietario: props.map(p => p.nombre).join(', '),
        ocupante: inq?.nombre || props[0]?.nombre || '',
        porcentaje: d.porcentaje,
        expensa,
        estado,
        montoPagado: pago?.monto || 0,
        metodo: pago?.metodo || '',
        fechaPago: pago?.fecha_pago || '',
      };
    });

    const recaudado = filas.filter(f => f.estado === 'al_dia').reduce((s, f) => s + f.expensa, 0);

    return { gastos, pagos, filas, totalGastos, recaudado };
  }, [periodoSeleccionado, edificioId]);

  // Multi-period summary
  const resumen = useMemo(() => {
    const departamentos = getDepartamentosDeEdificio(edificioId).filter(d => d.activo);
    return periodos.slice(0, 6).reverse().map(p => {
      const gastosP = db.getGastos().filter(g => g.periodo === p.val && g.edificio_id === edificioId);
      const totalGastos = gastosP.reduce((s, g) => s + g.monto, 0);
      const pagados = departamentos.filter(d => {
        const pago = db.getPagos().find(pg => pg.departamento_id === d.id && pg.periodo === p.val);
        return !!pago;
      }).length;
      const recaudado = departamentos.filter(d => {
        const pago = db.getPagos().find(pg => pg.departamento_id === d.id && pg.periodo === p.val);
        return !!pago;
      }).reduce((s, d) => s + calcularExpensaDepartamento(d, p.val), 0);
      return { periodo: p.label, periodoVal: p.val, gastos: totalGastos, pagados, recaudado, total: departamentos.length };
    });
  }, [edificioId]);

  const handleExportLiquidacion = () => {
    exportCSV(`liquidacion_${periodoSeleccionado}`, data.filas.map(f => [
      f.numero, f.propietario, f.ocupante, `${f.porcentaje}%`, f.expensa, f.estado, f.montoPagado, f.metodo, f.fechaPago
    ]), ['Unidad', 'Propietario', 'Ocupante', '%', 'Expensa', 'Estado', 'Pagó', 'Método', 'Fecha']);
  };

  const handleExportGastos = () => {
    const gastosFiltrados = db.getGastos().filter(g => g.edificio_id === edificioId && g.periodo === periodoSeleccionado);
    exportCSV(`gastos_${periodoSeleccionado}`, gastosFiltrados.map(g => [
      g.descripcion, g.tipo, g.monto, g.proveedor, g.fecha
    ]), ['Descripción', 'Tipo', 'Monto', 'Proveedor', 'Fecha']);
  };

  const handleExportPagos = () => {
    const pagosFiltrados = db.getPagos().filter(p => {
      const depto = db.getDepartamentos().find(d => d.id === p.departamento_id);
      return depto && depto.edificio_id === edificioId;
    });
    exportCSV(`pagos_${periodoSeleccionado}`, pagosFiltrados.map(p => {
      const depto = db.getDepartamentos().find(d => d.id === p.departamento_id);
      return [depto?.numero || '', p.periodo, p.monto, p.metodo, p.fecha_pago, p.comprobante];
    }), ['Unidad', 'Período', 'Monto', 'Método', 'Fecha', 'Comprobante']);
  };

  const handleExportCompleto = () => {
    exportCSV(`reporte_completo_${periodoSeleccionado}`, data.filas.map(f => [
      f.numero, f.propietario, f.ocupante, `${f.porcentaje}%`, f.expensa, f.estado, f.montoPagado, f.metodo, f.fechaPago,
      data.totalGastos, data.recaudado, data.totalGastos - data.recaudado
    ]), ['Unidad', 'Propietario', 'Ocupante', '%', 'Expensa', 'Estado', 'Pagó', 'Método', 'Fecha', 'Total Gastos', 'Total Recaudado', 'Diferencia']);
  };

  const pctCobertura = data.totalGastos > 0 ? Math.round((data.recaudado / data.totalGastos) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reportes</h2>
          <p>Exportación de datos</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodoSelector value={periodoSeleccionado} onChange={setPeriodoSeleccionado} edificioId={edificioId} />
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Total gastos</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatMonto(data.totalGastos)}</div>
            <div className="stat-sub">{formatPeriodo(periodoSeleccionado)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recaudado</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>{formatMonto(data.recaudado)}</div>
            <div className="stat-sub">{data.filas.filter(f => f.estado === 'al_dia').length} unidades</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Diferencia</div>
            <div className="stat-value" style={{ fontSize: 18, color: data.recaudado >= data.totalGastos ? 'var(--success)' : 'var(--danger)' }}>
              {formatMonto(data.recaudado - data.totalGastos)}
            </div>
            <div className="stat-sub">{data.recaudado >= data.totalGastos ? 'Superávit' : 'Déficit'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cobertura</div>
            <div className="stat-value">{pctCobertura}%</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Resumen por período</span>
              <BarChart2 size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Gastos</th>
                    <th>Recaudado</th>
                    <th>Cobertura</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.map(r => (
                    <tr key={r.periodoVal}>
                      <td className="font-medium">{r.periodo}</td>
                      <td>{formatMonto(r.gastos)}</td>
                      <td>{formatMonto(r.recaudado)}</td>
                      <td>
                        <span className={`badge ${r.gastos > 0 && r.recaudado / r.gastos >= 0.7 ? 'badge-success' : r.gastos > 0 && r.recaudado / r.gastos >= 0.4 ? 'badge-warning' : 'badge-danger'}`}>
                          {r.gastos > 0 ? Math.round((r.recaudado / r.gastos) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Exportar datos</span>
              <Download size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-secondary w-full justify-between" onClick={handleExportLiquidacion}>
                <span className="flex items-center gap-2"><FileText size={14} /> Liquidación</span>
                <Download size={14} />
              </button>
              <button className="btn btn-secondary w-full justify-between" onClick={handleExportGastos}>
                <span className="flex items-center gap-2"><FileText size={14} /> Gastos</span>
                <Download size={14} />
              </button>
              <button className="btn btn-secondary w-full justify-between" onClick={handleExportPagos}>
                <span className="flex items-center gap-2"><FileText size={14} /> Pagos</span>
                <Download size={14} />
              </button>
              <div className="separator" />
              <button className="btn btn-primary w-full justify-between" onClick={handleExportCompleto}>
                <span className="flex items-center gap-2"><Download size={14} /> Reporte completo</span>
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
