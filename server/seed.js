export function seedData(db) {
  const edificioCount = db.prepare('SELECT COUNT(*) as c FROM edificios').get().c;
  if (edificioCount > 0) return;

  const insertEdificio = db.prepare(
    'INSERT INTO edificios (id, nombre, direccion, admin, metros_totales, activo) VALUES (?, ?, ?, ?, ?, 1)'
  );
  insertEdificio.run('e1', 'Consorcio Belgrano 1240', 'Belgrano 1240, Córdoba', 'Administración', 800);

  const insertDepto = db.prepare(
    'INSERT INTO departamentos (id, edificio_id, numero, piso, letra, metros_cuadrados, porcentaje, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
  );
  const deptos = [
    ['d1', 'e1', '1A', 1, 'A', 96, 12],
    ['d2', 'e1', '1B', 1, 'B', 80, 10],
    ['d3', 'e1', '2A', 2, 'A', 96, 12],
    ['d4', 'e1', '2B', 2, 'B', 80, 10],
    ['d5', 'e1', '3A', 3, 'A', 96, 12],
    ['d6', 'e1', '3B', 3, 'B', 80, 10],
    ['d7', 'e1', 'PB', 0, 'PB', 176, 22],
    ['d8', 'e1', '4A', 4, 'A', 96, 12],
  ];
  for (const d of deptos) insertDepto.run(...d);

  const insertPersona = db.prepare(
    'INSERT INTO personas (id, nombre, dni, email, telefono, direccion, observaciones, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
  );
  const personas = [
    ['p1', 'Carlos Rodríguez', '28345671', 'carlos@mail.com', '351-4567890', 'Belgrano 1240, 1A', ''],
    ['p2', 'María González', '31456782', 'maria@mail.com', '351-4231567', 'Belgrano 1240, 1B', ''],
    ['p3', 'Juan Pérez', '35678901', 'juan@mail.com', '351-4098765', 'Belgrano 1240, 1B', 'Inquilino'],
    ['p4', 'Ana Martínez', '29012345', 'ana@mail.com', '351-4567123', 'Belgrano 1240, 2A', ''],
    ['p5', 'Roberto Sánchez', '32123456', 'roberto@mail.com', '351-4321098', 'Belgrano 1240, 2B', ''],
    ['p6', 'Laura Díaz', '27234567', 'laura@mail.com', '351-4876543', 'Belgrano 1240, 3A', ''],
    ['p7', 'Diego López', '38345678', 'diego@mail.com', '351-4234567', 'Belgrano 1240, 3A', 'Inquilino'],
    ['p8', 'Silvia Torres', '30456789', 'silvia@mail.com', '351-4765432', 'Belgrano 1240, 3B', ''],
    ['p9', 'Pablo Fernández', '26567890', 'pablo@mail.com', '351-4543210', 'Belgrano 1240, PB', ''],
    ['p10', 'Mónica Ruiz', '33678901', 'monica@mail.com', '351-4098123', 'Belgrano 1240, 4A', ''],
  ];
  for (const p of personas) insertPersona.run(...p);

  const insertProp = db.prepare(
    'INSERT INTO propietarios (id, departamento_id, persona_id, activo) VALUES (?, ?, ?, 1)'
  );
  const props = [
    ['pr1', 'd1', 'p1'], ['pr2', 'd2', 'p2'], ['pr3', 'd3', 'p4'],
    ['pr4', 'd4', 'p5'], ['pr5', 'd5', 'p6'], ['pr6', 'd6', 'p8'],
    ['pr7', 'd7', 'p9'], ['pr8', 'd8', 'p10'],
  ];
  for (const pr of props) insertProp.run(...pr);

  const insertInq = db.prepare(
    'INSERT INTO inquilinos (id, departamento_id, persona_id, fecha_desde, activo) VALUES (?, ?, ?, ?, 1)'
  );
  insertInq.run('i1', 'd2', 'p3', '2024-03-01');
  insertInq.run('i2', 'd5', 'p7', '2024-06-01');

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const d = new Date(hoy);
  d.setMonth(d.getMonth() - 1);
  const mesAnterior = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const insertGasto = db.prepare(
    'INSERT INTO gastos (id, edificio_id, descripcion, monto, tipo, categoria, periodo, fecha, proveedor, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const gastos = [
    ['g1', 'e1', 'Limpieza y mantenimiento', 45000, 'ordinario', 'mantenimiento', mesActual, `${mesActual}-01`, 'Servicios Limpiar SA', new Date().toISOString()],
    ['g2', 'e1', 'Luz zonas comunes', 18000, 'ordinario', 'servicios', mesActual, `${mesActual}-05`, 'EPEC', new Date().toISOString()],
    ['g3', 'e1', 'Administración', 25000, 'ordinario', 'administracion', mesActual, `${mesActual}-01`, 'Administrador', new Date().toISOString()],
    ['g4', 'e1', 'Reparación ascensor', 120000, 'extraordinario', 'reparaciones', mesActual, `${mesActual}-10`, 'Ascensores Norte SRL', new Date().toISOString()],
    ['g5', 'e1', 'Gas zonas comunes', 12000, 'ordinario', 'servicios', mesAnterior, `${mesAnterior}-01`, 'Naturgas', new Date().toISOString()],
    ['g6', 'e1', 'Limpieza y mantenimiento', 43000, 'ordinario', 'mantenimiento', mesAnterior, `${mesAnterior}-01`, 'Servicios Limpiar SA', new Date().toISOString()],
  ];
  for (const g of gastos) insertGasto.run(...g);

  const insertPago = db.prepare(
    'INSERT INTO pagos (id, departamento_id, periodo, monto, fecha_pago, metodo, comprobante, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const pagos = [
    ['pa1', 'd1', mesAnterior, 12300, `${mesAnterior}-15`, 'transferencia', 'TRF-001', new Date().toISOString()],
    ['pa2', 'd2', mesAnterior, 10250, `${mesAnterior}-12`, 'efectivo', '', new Date().toISOString()],
    ['pa3', 'd3', mesAnterior, 12300, `${mesAnterior}-20`, 'transferencia', 'TRF-002', new Date().toISOString()],
    ['pa4', 'd4', mesAnterior, 10250, `${mesAnterior}-08`, 'transferencia', 'TRF-003', new Date().toISOString()],
    ['pa5', 'd1', mesActual, 27625, `${mesActual}-05`, 'transferencia', 'TRF-004', new Date().toISOString()],
    ['pa6', 'd3', mesActual, 27625, `${mesActual}-07`, 'transferencia', 'TRF-005', new Date().toISOString()],
  ];
  for (const p of pagos) insertPago.run(...p);
}
