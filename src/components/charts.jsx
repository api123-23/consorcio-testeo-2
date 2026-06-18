import { useMemo } from 'react';
import { db, formatMonto, getDepartamentosDeEdificio, getRev } from '../data/db';

function getPeriodos(cantidad) {
  const hoy = new Date();
  const periodos = [];
  for (let i = cantidad - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    periodos.push({ val, label: meses[d.getMonth()] });
  }
  return periodos;
}

export default function EvolucionChart({ edificioId }) {
  const data = useMemo(() => {
    const periodos = getPeriodos(6);
    const departamentos = getDepartamentosDeEdificio(edificioId).filter(d => d.activo);
    return periodos.map(p => {
      const gastos = db.getGastos().filter(g => g.periodo === p.val && g.edificio_id === edificioId);
      const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
      const recaudado = departamentos.reduce((s, d) => {
        const pagos = db.getPagos().filter(pg => pg.departamento_id === d.id && pg.periodo === p.val);
        return s + pagos.reduce((sum, pg) => sum + pg.monto, 0);
      }, 0);
      return { label: p.label, gastos: totalGastos, recaudado, periodo: p.val };
    });
  }, [edificioId, getRev()]);

  const maxValor = Math.max(...data.map(d => Math.max(d.gastos, d.recaudado)), 1);
  const svgW = 500;
  const svgH = 220;
  const padL = 10;
  const padR = 10;
  const padT = 20;
  const padB = 30;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const barW = Math.min(36, (chartW / data.length / 2) - 4);
  const gap = data.length > 1 ? (chartW - (barW * 2 * data.length)) / (data.length - 1) : 0;
  const startX = data.length > 1 ? padL + (chartW - (barW * 2 * data.length + gap * (data.length - 1))) / 2 : padL;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', maxHeight: svgH, overflow: 'visible' }}>
      {data.map((d, i) => {
        const x = startX + i * (barW * 2 + gap);
        const gastosH = (d.gastos / maxValor) * chartH;
        const recaudadoH = (d.recaudado / maxValor) * chartH;
        return (
          <g key={d.periodo}>
            <rect x={x} y={svgH - padB - gastosH} width={barW} height={Math.max(gastosH, 1)}
              rx={3} fill="var(--accent)" opacity={0.7}>
              <title>{`Gastos: ${formatMonto(d.gastos)}`}</title>
            </rect>
            <rect x={x + barW + 2} y={svgH - padB - recaudadoH} width={barW} height={Math.max(recaudadoH, 1)}
              rx={3} fill="var(--success)" opacity={0.85}>
              <title>{`Recaudado: ${formatMonto(d.recaudado)}`}</title>
            </rect>
            {gastosH > 0 && (
              <text x={x + barW / 2} y={svgH - padB - gastosH - 6}
                textAnchor="middle" fontSize={10} fill="var(--accent)" fontWeight={600}>
                {d.gastos > 0 ? '$' + Math.round(d.gastos / 1000) + 'k' : ''}
              </text>
            )}
            {recaudadoH > 0 && (
              <text x={x + barW + 2 + barW / 2} y={svgH - padB - recaudadoH - 6}
                textAnchor="middle" fontSize={10} fill="var(--success)" fontWeight={600}>
                {d.recaudado > 0 ? '$' + Math.round(d.recaudado / 1000) + 'k' : ''}
              </text>
            )}
            <text x={x + barW + 1} y={svgH - 6} textAnchor="middle" fontSize={11} fill="var(--text-muted)" fontWeight={500}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
