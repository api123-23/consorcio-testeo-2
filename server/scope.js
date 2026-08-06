// Ownership helpers: every query is scoped to the edificios owned by req.user.id,
// so no user can read or modify another user's data.

export const ownsEdificio = (db, edificioId, userId) =>
  db.prepare('SELECT id FROM edificios WHERE id = ? AND user_id = ?').get(edificioId, userId);

export const ownsDepartamento = (db, departamentoId, userId) =>
  db.prepare(
    `SELECT d.id FROM departamentos d
     JOIN edificios e ON e.id = d.edificio_id
     WHERE d.id = ? AND e.user_id = ?`
  ).get(departamentoId, userId);

export const ownsGasto = (db, gastoId, userId) =>
  db.prepare(
    `SELECT g.id FROM gastos g
     JOIN edificios e ON e.id = g.edificio_id
     WHERE g.id = ? AND e.user_id = ?`
  ).get(gastoId, userId);

export const ownsPago = (db, pagoId, userId) =>
  db.prepare(
    `SELECT p.id FROM pagos p
     JOIN departamentos d ON d.id = p.departamento_id
     JOIN edificios e ON e.id = d.edificio_id
     WHERE p.id = ? AND e.user_id = ?`
  ).get(pagoId, userId);

export const ownsRecargo = (db, recargoId, userId) =>
  db.prepare(
    `SELECT r.id FROM recargos r
     JOIN departamentos d ON d.id = r.departamento_id
     JOIN edificios e ON e.id = d.edificio_id
     WHERE r.id = ? AND e.user_id = ?`
  ).get(recargoId, userId);

export const ownsLiquidacion = (db, liquidacionId, userId) =>
  db.prepare(
    `SELECT l.id FROM liquidaciones l
     JOIN edificios e ON e.id = l.edificio_id
     WHERE l.id = ? AND e.user_id = ?`
  ).get(liquidacionId, userId);

export const ownsPropietario = (db, relId, userId) =>
  db.prepare(
    `SELECT pr.id FROM propietarios pr
     JOIN departamentos d ON d.id = pr.departamento_id
     JOIN edificios e ON e.id = d.edificio_id
     WHERE pr.id = ? AND e.user_id = ?`
  ).get(relId, userId);

export const ownsInquilino = (db, relId, userId) =>
  db.prepare(
    `SELECT i.id FROM inquilinos i
     JOIN departamentos d ON d.id = i.departamento_id
     JOIN edificios e ON e.id = d.edificio_id
     WHERE i.id = ? AND e.user_id = ?`
  ).get(relId, userId);

export const ownsPersona = (db, personaId, userId) =>
  db.prepare('SELECT id FROM personas WHERE id = ? AND user_id = ?').get(personaId, userId);
