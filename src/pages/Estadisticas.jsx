import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { db, formatMonto, formatPeriodo, getDepartamentosDeEdificio, getRev } from '../data/db';
import EvolucionChart from '../components/charts.jsx';

export default function Estadisticas({ edificioId }) {
  const data = useMemo(() => {
    const now = new Date();
    const periodos = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now); d.setMonth(d.getMonth() - i);
      periodos.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const departamentos = getDepartamentosDeEdificio(edificioId).filter(d => d.activo);

    const meses = periodos.map(p => {
      const gastos = db.getGastos().filter(g => g.periodo === p && g.edificio_id === edificioId);
      const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
      const pagosPeriodo = db.getPagos().filter(pg =>
        pg.periodo === p && departamentos.some(d => d.id === pg.departamento_id)
      );
      const totalRecaudado = pagosPeriodo.reduce((s, pg) => s + pg.monto, 0);
      const unidadesPagaron = new Set(pagosPeriodo.map(pg => pg.departamento_id)).size;
      return {
        periodo: p,
        label: formatPeriodo(p),
        gastos: totalGastos,
        recaudado: totalRecaudado,
        diferencia: totalRecaudado - totalGastos,
        cobertura: totalGastos > 0 ? Math.round((totalRecaudado / totalGastos) * 100) : 0,
        pagaron: unidadesPagaron,
        totalUnidades: departamentos.length,
      };
    });

    const totalGastos6 = meses.reduce((s, m) => s + m.gastos, 0);
    const totalRecaudado6 = meses.reduce((s, m) => s + m.recaudado, 0);
    const promedioGastos = Math.round(totalGastos6 / meses.length);
    const promedioRecaudado = Math.round(totalRecaudado6 / meses.length);
    const mesesSuperavit = meses.filter(m => m.diferencia >= 0).length;
    const mesesDeficit = meses.filter(m => m.diferencia < 0).length;

    return { meses, totalGastos6, totalRecaudado6, promedioGastos, promedioRecaudado, mesesSuperavit, mesesDeficit };
  }, [edificioId, getRev()]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Estadísticas</h2>
          <p>Gastos vs. Recaudación — últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <BarChart3 size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Gastos totales (6m)</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatMonto(data.totalGastos6)}</div>
            <div className="stat-sub">Prom. {formatMonto(data.promedioGastos)}/mes</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recaudado total (6m)</div>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>{formatMonto(data.totalRecaudado6)}</div>
            <div className="stat-sub">Prom. {formatMonto(data.promedioRecaudado)}/mes</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Diferencia</div>
            <div className="stat-value" style={{ fontSize: 18, color: data.totalRecaudado6 >= data.totalGastos6 ? 'var(--success)' : 'var(--danger)' }}>
              {formatMonto(data.totalRecaudado6 - data.totalGastos6)}
            </div>
            <div className="stat-sub">{data.totalRecaudado6 >= data.totalGastos6 ? 'Superávit' : 'Déficit'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Meses</div>
            <div className="stat-value" style={{ fontSize: 18 }}>
              <span style={{ color: 'var(--success)' }}>{data.mesesSuperavit}</span>
              <span className="text-muted" style={{ fontSize: 14 }}> / </span>
              <span style={{ color: 'var(--danger)' }}>{data.mesesDeficit}</span>
            </div>
            <div className="stat-sub">superávit / déficit</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Evolución últimos 6 meses</span>
            <TrendingUp size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <EvolucionChart edificioId={edificioId} />
          <div className="flex items-center gap-3 mt-2" style={{ justifyContent: 'center' }}>
            <div className="flex items-center gap-1 text-xs text-muted">
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)', opacity: 0.7, display: 'inline-block' }} />
              Gastos
            </div>
            <div className="flex items-center gap-1 text-xs text-muted">
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', opacity: 0.85, display: 'inline-block' }} />
              Recaudado
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Gastos</th>
                <th>Recaudado</th>
                <th>Diferencia</th>
                <th>Cobertura</th>
                <th>Pagaron</th>
              </tr>
            </thead>
            <tbody>
              {data.meses.map(m => (
                <tr key={m.periodo}>
                  <td className="font-medium">{m.label}</td>
                  <td>{formatMonto(m.gastos)}</td>
                  <td style={{ color: 'var(--success)' }}>{formatMonto(m.recaudado)}</td>
                  <td>
                    <span style={{ color: m.diferencia >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {m.diferencia >= 0 ? '+' : ''}{formatMonto(m.diferencia)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${m.cobertura >= 70 ? 'badge-success' : m.cobertura >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                      {m.cobertura}%
                    </span>
                  </td>
                  <td>{m.pagaron}/{m.totalUnidades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
