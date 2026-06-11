import { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { db, formatPeriodo } from '../data/db';

export default function PeriodoSelector({ value, onChange, edificioId }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customYear, setCustomYear] = useState('');
  const [customMonth, setCustomMonth] = useState('');
  const ref = useRef(null);

  // Periods with data for this building
  const periodosConDatos = useMemo(() => {
    const set = new Set();
    const gastos = edificioId ? db.getGastos().filter(g => g.edificio_id === edificioId) : [];
    const pagos = edificioId ? db.getPagos().filter(p => {
      const d = db.getDepartamentos().find(dep => dep.id === p.departamento_id);
      return d && d.edificio_id === edificioId;
    }) : [];
    gastos.forEach(g => set.add(g.periodo));
    pagos.forEach(p => set.add(p.periodo));
    return [...set].sort();
  }, [edificioId]);

  // Last 12 months for quick access
  const ultimosMeses = useMemo(() => {
    const meses = [];
    const hoy = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoy);
      d.setMonth(d.getMonth() - i);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      meses.push(val);
    }
    return meses;
  }, []);

  // Build sorted unique list: months with data first, then rest of recent months
  const opciones = useMemo(() => {
    const todas = new Set([...periodosConDatos, ...ultimosMeses]);
    return [...todas].sort();
  }, [periodosConDatos, ultimosMeses]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectPeriodo = (val) => {
    onChange(val);
    setOpen(false);
    setShowCustom(false);
  };

  const handleCustom = () => {
    if (customYear && customMonth) {
      const val = `${customYear}-${String(customMonth).padStart(2, '0')}`;
      selectPeriodo(val);
    }
  };

  return (
    <div className="periodo-selector" ref={ref}>
      <button className="periodo-selector-btn" onClick={() => setOpen(!open)}>
        <Calendar size={14} />
        <span>{formatPeriodo(value)}</span>
        <ChevronDown size={12} className={`chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="periodo-dropdown">
          {showCustom ? (
            <div className="periodo-custom">
              <div className="form-row" style={{ gap: 6 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Año</label>
                  <input className="form-input" type="number" value={customYear}
                    onChange={e => setCustomYear(e.target.value)}
                    placeholder="2024" min="2020" max="2030" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Mes</label>
                  <select className="form-select" value={customMonth}
                    onChange={e => setCustomMonth(e.target.value)}>
                    <option value="">—</option>
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowCustom(false)}>Volver</button>
                <button className="btn btn-primary btn-sm" onClick={handleCustom}>Ir</button>
              </div>
            </div>
          ) : (
            <>
              <div className="periodo-list">
                {opciones.map(p => {
                  const hasData = periodosConDatos.includes(p);
                  const isActive = p === value;
                  return (
                    <button key={p}
                      className={`periodo-item ${isActive ? 'active' : ''} ${hasData ? 'has-data' : ''}`}
                      onClick={() => selectPeriodo(p)}>
                      <span>{formatPeriodo(p)}</span>
                      {hasData && <span className="periodo-dot" title="Contiene datos" />}
                    </button>
                  );
                })}
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => setShowCustom(true)}>
                <Calendar size={14} />
                Otro período...
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
