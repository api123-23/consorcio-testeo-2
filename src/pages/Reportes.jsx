import { useMemo } from 'react';
import { Download, FileText, BarChart2, Printer } from 'lucide-react';
import { db, formatMonto, formatPeriodo, calcularExpensaDepartamento, getEstadoDepartamento, getPropietariosDeDepartamento, getInquilinoActual, getDepartamentosDeEdificio, getRev } from '../data/db';
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

export default function Reportes({ edificioId, periodo: periodoSeleccionado, setPeriodo: setPeriodoSeleccionado }) {
  const now = new Date();
  const periodos = [];
  for (let i = 0; i <= 11; i++) {
    const d = new Date(now); d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    periodos.push({ val, label: formatPeriodo(val) });
  }

  const data = useMemo(() => {
    const departamentos = getDepartamentosDeEdificio(edificioId).filter(d => d.activo);
    const gastos = db.getGastos().filter(g => g.edificio_id === edificioId);
    const pagos = db.getPagos();

    const gastosPeriodo = gastos.filter(g => g.periodo === periodoSeleccionado);
    const totalGastos = gastosPeriodo.reduce((s, g) => s + g.monto, 0);

    const filas = departamentos.map(d => {
      const expensa = calcularExpensaDepartamento(d, periodoSeleccionado);
      const estado = getEstadoDepartamento(d.id, periodoSeleccionado);
      const pagosDepto = pagos.filter(p => p.departamento_id === d.id && p.periodo === periodoSeleccionado);
      const totalPagado = pagosDepto.reduce((s, p) => s + p.monto, 0);
      const props = getPropietariosDeDepartamento(d.id);
      const inq = getInquilinoActual(d.id);
      return {
        numero: d.numero,
        propietario: props.map(p => p.nombre).join(', '),
        ocupante: inq?.nombre || props[0]?.nombre || '',
        porcentaje: d.porcentaje,
        expensa,
        estado,
        montoPagado: totalPagado,
        metodo: pagosDepto.map(p => p.metodo).filter(Boolean).join(', '),
        fechaPago: pagosDepto.map(p => p.fecha_pago).filter(Boolean).join(', '),
      };
    });

    const recaudado = filas.reduce((s, f) => s + f.montoPagado, 0);

    return { gastos, pagos, filas, totalGastos, recaudado };
  }, [periodoSeleccionado, edificioId, getRev()]);

  // Multi-period summary
  const resumen = useMemo(() => {
    const departamentos = getDepartamentosDeEdificio(edificioId).filter(d => d.activo);
    return periodos.slice(0, 6).reverse().map(p => {
      const gastosP = db.getGastos().filter(g => g.periodo === p.val && g.edificio_id === edificioId);
      const totalGastos = gastosP.reduce((s, g) => s + g.monto, 0);
      const pagosPeriodo = db.getPagos().filter(pg => pg.periodo === p.val && departamentos.some(d => d.id === pg.departamento_id));
      const pagados = new Set(pagosPeriodo.map(pg => pg.departamento_id)).size;
      const recaudado = pagosPeriodo.reduce((s, pg) => s + pg.monto, 0);
      return { periodo: p.label, periodoVal: p.val, gastos: totalGastos, pagados, recaudado, total: departamentos.length };
    });
  }, [edificioId, getRev()]);

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

  const handleExportExcel = () => {
    const rows = data.filas.map(f => [
      f.numero, f.propietario, f.ocupante, f.porcentaje, f.expensa, f.estado, f.montoPagado, f.metodo, f.fechaPago
    ]);
    const headers = ['Unidad', 'Propietario', 'Ocupante', '%', 'Expensa', 'Estado', 'Pagó', 'Método', 'Fecha'];
    const csvContent = [headers.join(','), ...rows.map(r =>
      r.map(v => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    )].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `liquidacion_${periodoSeleccionado}.xls`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleExportImprimible = () => {
    const edificio = db.getEdificios().find(e => e.id === edificioId);
    const win = window.open('', '_blank');
    const gastosFiltrados = db.getGastos().filter(g => g.edificio_id === edificioId && g.periodo === periodoSeleccionado);
    let html = `
      <html><head><title>Liquidación ${formatPeriodo(periodoSeleccionado)}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 40px; color: #222; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #666; font-weight: normal; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f0f0f0; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #ddd; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .total-row td { font-weight: bold; border-top: 2px solid #333; }
        .text-right { text-align: right; }
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-warning { background: #fff3cd; color: #856404; }
      </style></head><body>
      <h1>${edificio?.nombre || 'Consorcio'}</h1>
      <h2>Liquidación — ${formatPeriodo(periodoSeleccionado)}</h2>
      <table>
        <tr><th>Descripción</th><th>Tipo</th><th class="text-right">Monto</th></tr>
        ${gastosFiltrados.map(g => `<tr><td>${g.descripcion}</td><td><span class="badge ${g.tipo === 'ordinario' ? 'badge-success' : 'badge-warning'}">${g.tipo}</span></td><td class="text-right">$${g.monto.toLocaleString('es-AR')}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="2">Total gastos</td><td class="text-right">$${data.totalGastos.toLocaleString('es-AR')}</td></tr>
      </table>
      <table>
        <tr><th>Unidad</th><th>Propietario</th><th>Ocupante</th><th class="text-right">Expensa</th><th class="text-right">Pagó</th><th>Estado</th></tr>
        ${data.filas.map(f => `<tr><td>${f.numero}</td><td>${f.propietario}</td><td>${f.ocupante}</td><td class="text-right">$${f.expensa.toLocaleString('es-AR')}</td><td class="text-right">${f.montoPagado > 0 ? '$' + f.montoPagado.toLocaleString('es-AR') : '—'}</td><td><span class="badge ${f.estado === 'al_dia' ? 'badge-success' : f.estado === 'parcial' ? 'badge-warning' : 'badge-danger'}">${f.estado === 'al_dia' ? 'Al día' : f.estado === 'parcial' ? 'Parcial' : 'Debe'}</span></td></tr>`).join('')}
        <tr class="total-row"><td colspan="3">Totales</td><td class="text-right">$${data.totalGastos.toLocaleString('es-AR')}</td><td class="text-right">$${data.recaudado.toLocaleString('es-AR')}</td><td></td></tr>
      </table>
      <p style="color: #999; font-size: 11px; margin-top: 32px;">Generado el ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </body></html>`;
    win.document.write(html);
    win.document.close();
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
            <div className="stat-sub">{data.filas.filter(f => f.estado !== 'deudor').length} unidades</div>
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
                <span className="flex items-center gap-2"><FileText size={14} /> Liquidación (CSV)</span>
                <Download size={14} />
              </button>
              <button className="btn btn-secondary w-full justify-between" onClick={handleExportGastos}>
                <span className="flex items-center gap-2"><FileText size={14} /> Gastos (CSV)</span>
                <Download size={14} />
              </button>
              <button className="btn btn-secondary w-full justify-between" onClick={handleExportPagos}>
                <span className="flex items-center gap-2"><FileText size={14} /> Pagos (CSV)</span>
                <Download size={14} />
              </button>
              <button className="btn btn-secondary w-full justify-between" onClick={handleExportExcel}>
                <span className="flex items-center gap-2"><FileText size={14} /> Excel (.xls)</span>
                <Download size={14} />
              </button>
              <div className="separator" />
              <button className="btn btn-primary w-full justify-between" onClick={handleExportCompleto}>
                <span className="flex items-center gap-2"><Download size={14} /> Reporte completo (CSV)</span>
                <Download size={14} />
              </button>
              <button className="btn btn-success w-full justify-between" onClick={handleExportImprimible}>
                <span className="flex items-center gap-2"><Printer size={14} /> Versión imprimible (PDF/Print)</span>
                <Printer size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
