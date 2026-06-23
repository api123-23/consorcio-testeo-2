import { api } from '../api';
import { toast } from '../components/toast';

let cache = {
  edificios: [], departamentos: [], personas: [],
  propietarios: [], inquilinos: [],
  gastos: [], pagos: [], liquidaciones: [],
};
let loaded = false;
let loading = null;
let _rev = 0;
export const getRev = () => _rev;
function bump() { _rev++; }

export function resetCache() {
  cache = {
    edificios: [], departamentos: [], personas: [],
    propietarios: [], inquilinos: [],
    gastos: [], pagos: [], liquidaciones: [],
  };
  loaded = false;
  loading = null;
  bump();
}

export async function loadData() {
  if (loaded) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const [edificios, departamentos, personas, propietarios, inquilinos, gastos, pagos, liquidaciones] =
        await Promise.all([
          api.get('/edificios'),
          api.get('/departamentos'),
          api.get('/personas'),
          api.get('/propietarios'),
          api.get('/inquilinos'),
          api.get('/gastos'),
          api.get('/pagos'),
          api.get('/liquidaciones'),
        ]);
      cache = { edificios, departamentos, personas, propietarios, inquilinos, gastos, pagos, liquidaciones };
      loaded = true;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

function updateCache(table, record) {
  const list = cache[table];
  const idx = list.findIndex(x => x.id === record.id);
  if (idx >= 0) list[idx] = record;
  else list.push(record);
}

function removeFromCache(table, id) {
  const list = cache[table];
  const idx = list.findIndex(x => x.id === id);
  if (idx >= 0) list.splice(idx, 1);
}

// ─── Helpers ───────────────────────────────────────────────────────

export function getPropietariosDeDepartamento(deptoId) {
  const rels = cache.propietarios.filter(r => r.departamento_id === deptoId && r.activo);
  return rels.map(r => cache.personas.find(p => p.id === r.persona_id)).filter(Boolean);
}

export function getInquilinoActual(deptoId) {
  const rel = cache.inquilinos.find(r => r.departamento_id === deptoId && r.activo && !r.fecha_hasta);
  if (!rel) return null;
  return cache.personas.find(p => p.id === rel.persona_id) || null;
}

export function getDepartamentosDeEdificio(edificioId, soloActivos = true) {
  let list = cache.departamentos.filter(d => d.edificio_id === edificioId);
  if (soloActivos) list = list.filter(d => d.activo);
  return list;
}

// ─── CRUD object ───────────────────────────────────────────────────

export function getSiguientePeriodo(periodo, meses = 1) {
  const [year, month] = periodo.split('-').map(Number);
  const d = new Date(year, month - 1 + meses, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function autoCrearRecurrentes(gasto) {
  if (!gasto.recurrente || gasto.tipo !== 'ordinario') return;
  for (let i = 1; i <= 11; i++) {
    const proxPeriodo = getSiguientePeriodo(gasto.periodo, i);
    const existe = cache.gastos.some(g =>
      g.descripcion === gasto.descripcion &&
      g.periodo === proxPeriodo &&
      g.edificio_id === gasto.edificio_id &&
      g.tipo === 'ordinario'
    );
    if (!existe) {
      const copia = {
        ...gasto,
        id: newId('g'),
        periodo: proxPeriodo,
        monto: 0,
        fecha: new Date().toISOString().slice(0, 10),
        creado_en: new Date().toISOString(),
      };
      delete copia.recurrente;
      updateCache('gastos', copia);
      api.post('/gastos', copia).catch(console.error);
    }
  }
}

export const db = {
  // Edificios
  getEdificios: () => cache.edificios || [],
  saveEdificio: (e) => {
    const record = { ...e }; bump();
    updateCache('edificios', record);
    api.post('/edificios', record).catch(console.error);
    toast('Edificio guardado');
    return record;
  },
  deleteEdificio: (id) => {
    cache.edificios = cache.edificios.map(e => e.id === id ? { ...e, activo: 0 } : e);
    cache.departamentos = cache.departamentos.map(d => d.edificio_id === id ? { ...d, activo: 0 } : d); bump();
    api.del(`/edificios/${id}`).catch(console.error);
    toast('Edificio eliminado');
  },

  // Departamentos
  getDepartamentos: () => cache.departamentos || [],
  saveDepartamento: (d) => {
    const record = { ...d }; bump();
    updateCache('departamentos', record);
    api.post('/departamentos', record).catch(console.error);
    toast(d.id ? 'Departamento actualizado' : 'Departamento creado');
    return record;
  },
  deleteDepartamento: (id) => {
    cache.departamentos = cache.departamentos.map(d => d.id === id ? { ...d, activo: 0 } : d); bump();
    api.del(`/departamentos/${id}`).catch(console.error);
    toast('Departamento eliminado');
  },

  // Personas
  getPersonas: () => cache.personas || [],
  savePersona: (p) => {
    const record = { ...p }; bump();
    updateCache('personas', record);
    api.post('/personas', record).catch(console.error);
    toast('Persona guardada');
    return record;
  },
  deletePersona: (id) => {
    cache.personas = cache.personas.map(p => p.id === id ? { ...p, activo: 0 } : p); bump();
    api.del(`/personas/${id}`).catch(console.error);
    toast('Persona eliminada');
  },

  // Propietarios
  getPropietarios: () => cache.propietarios || [],
  savePropietario: (r) => {
    const record = { ...r }; bump();
    updateCache('propietarios', record);
    api.post('/propietarios', record).catch(console.error);
    toast('Propietario asignado');
    return record;
  },
  removePropietario: (deptoId, personaId) => {
    cache.propietarios = cache.propietarios.map(r =>
      r.departamento_id === deptoId && r.persona_id === personaId ? { ...r, activo: 0 } : r
    ); bump();
    api.del(`/propietarios?departamento_id=${deptoId}&persona_id=${personaId}`).catch(console.error);
    toast('Propietario removido');
  },

  // Inquilinos
  getInquilinos: () => cache.inquilinos || [],
  saveInquilino: (r) => {
    const record = { ...r }; bump();
    updateCache('inquilinos', record);
    api.post('/inquilinos', record).catch(console.error);
    toast('Inquilino asignado');
    return record;
  },
  removeInquilino: (id) => {
    cache.inquilinos = cache.inquilinos.map(r => r.id === id ? { ...r, activo: 0, fecha_hasta: new Date().toISOString().slice(0, 10) } : r); bump();
    api.del(`/inquilinos/${id}`).catch(console.error);
    toast('Inquilino removido');
  },

  // Gastos
  getGastos: () => cache.gastos || [],
  saveGasto: (g) => {
    const record = { ...g }; bump();
    updateCache('gastos', record);
    api.post('/gastos', record).catch(console.error);
    autoCrearRecurrentes(record);
    toast(record.monto === 0 ? 'Plantilla de gasto creada' : 'Gasto guardado');
    return record;
  },
  deleteGasto: (id) => {
    removeFromCache('gastos', id); bump();
    api.del(`/gastos/${id}`).catch(console.error);
    toast('Gasto eliminado');
  },

  // Pagos
  getPagos: () => cache.pagos || [],
  savePago: (p) => {
    const record = { ...p }; bump();
    updateCache('pagos', record);
    api.post('/pagos', record).catch(console.error);
    toast('Pago registrado');
    return record;
  },
  deletePago: (id) => {
    removeFromCache('pagos', id); bump();
    api.del(`/pagos/${id}`).catch(console.error);
    toast('Pago eliminado');
  },

  // Liquidaciones
  getLiquidaciones: () => cache.liquidaciones || [],
  saveLiquidacion: (l) => {
    const record = { ...l }; bump();
    updateCache('liquidaciones', record);
    api.post('/liquidaciones', record).catch(console.error);
    toast('Liquidación guardada');
    return record;
  },
};

// ─── ID generator ──────────────────────────────────────────────────

export const newId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── Validation ────────────────────────────────────────────────────

export const validateDNI = (dni) => {
  const clean = String(dni).replace(/\D/g, '');
  return clean.length >= 7 && clean.length <= 9;
};

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isDNIUnique = (dni, excludeId = null) => {
  return !cache.personas.some(p =>
    p.dni === String(dni).replace(/\D/g, '') && p.id !== excludeId && p.activo
  );
};

export const isEmailUnique = (email, excludeId = null) => {
  return !cache.personas.some(p =>
    p.email?.toLowerCase() === email?.toLowerCase() && p.id !== excludeId && p.activo
  );
};

// ─── Business logic ────────────────────────────────────────────────

export const calcularExpensaDepartamento = (departamento, periodo) => {
  const gastos = cache.gastos.filter(g => g.periodo === periodo && g.edificio_id === departamento.edificio_id);
  const total = gastos.reduce((sum, g) => sum + g.monto, 0);
  const edificio = cache.edificios.find(e => e.id === departamento.edificio_id);
  if (!edificio || !edificio.metros_totales || edificio.metros_totales === 0) return 0;
  return Math.round((total * (departamento.metros_cuadrados || 0)) / edificio.metros_totales);
};

export const getEstadoDepartamento = (departamento_id, periodo) => {
  const pagos = cache.pagos.filter(p => p.departamento_id === departamento_id && p.periodo === periodo);
  if (pagos.length === 0) return 'deudor';
  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
  const depto = cache.departamentos.find(d => d.id === departamento_id);
  if (depto) {
    const expensa = calcularExpensaDepartamento(depto, periodo);
    if (totalPagado < expensa) return 'parcial';
  }
  return 'al_dia';
};

export const getPeriodosDeuda = (departamento_id) => {
  const hoy = new Date();
  let deuda = 0;
  for (let i = 1; i <= 6; i++) {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() - i);
    const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const gastosEdificio = cache.gastos.filter(g => g.periodo === periodo);
    if (gastosEdificio.length === 0) continue;
    const pagado = cache.pagos.some(p => p.departamento_id === departamento_id && p.periodo === periodo);
    if (!pagado) deuda++;
  }
  return deuda;
};

export const getMesActual = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
};

export const formatPeriodo = (periodo) => {
  if (!periodo) return '';
  const [year, month] = periodo.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(month) - 1]} ${year}`;
};

export const formatMonto = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
