import { ownsDepartamento, ownsPago } from '../scope.js';

export default function pagosRoutes(router, db) {
  const scope = (userId) => db.prepare(
    `SELECT p.* FROM pagos p
     JOIN departamentos d ON d.id = p.departamento_id
     JOIN edificios e ON e.id = d.edificio_id
     WHERE e.user_id = ?`
  ).all(userId);

  router.get('/pagos', (req, res) => {
    const { departamento_id } = req.query;
    if (departamento_id) {
      if (!ownsDepartamento(db, departamento_id, req.user.id)) {
        return res.status(403).json({ error: 'Departamento no autorizado' });
      }
      const rows = db.prepare(
        `SELECT p.* FROM pagos p
         JOIN departamentos d ON d.id = p.departamento_id
         JOIN edificios e ON e.id = d.edificio_id
         WHERE e.user_id = ? AND p.departamento_id = ?`
      ).all(req.user.id, departamento_id);
      return res.json(rows);
    }
    res.json(scope(req.user.id));
  });

  router.post('/pagos', (req, res) => {
    const p = req.body;
    if (!ownsDepartamento(db, p.departamento_id, req.user.id)) {
      return res.status(403).json({ error: 'Departamento no autorizado' });
    }
    db.prepare(
      'INSERT OR REPLACE INTO pagos (id, departamento_id, periodo, monto, fecha_pago, metodo, comprobante, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(p.id, p.departamento_id, p.periodo, p.monto, p.fecha_pago, p.metodo ?? '', p.comprobante ?? '', p.creado_en ?? '');
    const saved = db.prepare('SELECT * FROM pagos WHERE id = ?').get(p.id);
    res.json(saved);
  });

  router.put('/pagos/:id', (req, res) => {
    const p = req.body;
    if (!ownsPago(db, req.params.id, req.user.id)) {
      return res.status(403).json({ error: 'Pago no autorizado' });
    }
    if (!ownsDepartamento(db, p.departamento_id, req.user.id)) {
      return res.status(403).json({ error: 'Departamento no autorizado' });
    }
    db.prepare(
      'UPDATE pagos SET departamento_id = ?, periodo = ?, monto = ?, fecha_pago = ?, metodo = ?, comprobante = ? WHERE id = ?'
    ).run(p.departamento_id, p.periodo, p.monto, p.fecha_pago, p.metodo ?? '', p.comprobante ?? '', req.params.id);
    const saved = db.prepare('SELECT * FROM pagos WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/pagos/:id', (req, res) => {
    if (!ownsPago(db, req.params.id, req.user.id)) {
      return res.status(403).json({ error: 'Pago no autorizado' });
    }
    db.prepare('DELETE FROM pagos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
