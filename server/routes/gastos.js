import { ownsEdificio, ownsGasto } from '../scope.js';

export default function gastosRoutes(router, db) {
  router.get('/gastos', (req, res) => {
    const { edificio_id } = req.query;
    if (edificio_id) {
      if (!ownsEdificio(db, edificio_id, req.user.id)) {
        return res.status(403).json({ error: 'Edificio no autorizado' });
      }
      const rows = db.prepare(
        `SELECT g.* FROM gastos g
         JOIN edificios e ON e.id = g.edificio_id
         WHERE e.user_id = ? AND g.edificio_id = ?`
      ).all(req.user.id, edificio_id);
      return res.json(rows);
    }
    const rows = db.prepare(
      `SELECT g.* FROM gastos g
       JOIN edificios e ON e.id = g.edificio_id
       WHERE e.user_id = ?`
    ).all(req.user.id);
    res.json(rows);
  });

  router.post('/gastos', (req, res) => {
    const g = req.body;
    if (!ownsEdificio(db, g.edificio_id, req.user.id)) {
      return res.status(403).json({ error: 'Edificio no autorizado' });
    }
    db.prepare(
      'INSERT OR REPLACE INTO gastos (id, edificio_id, descripcion, monto, tipo, periodo, fecha, proveedor, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(g.id, g.edificio_id, g.descripcion, g.monto, g.tipo, g.periodo, g.fecha, g.proveedor ?? '', g.creado_en ?? '');
    const saved = db.prepare('SELECT * FROM gastos WHERE id = ?').get(g.id);
    res.json(saved);
  });

  router.put('/gastos/:id', (req, res) => {
    const g = req.body;
    if (!ownsGasto(db, req.params.id, req.user.id)) {
      return res.status(403).json({ error: 'Gasto no autorizado' });
    }
    db.prepare(
      'UPDATE gastos SET descripcion = ?, monto = ?, tipo = ?, periodo = ?, fecha = ?, proveedor = ? WHERE id = ?'
    ).run(g.descripcion, g.monto, g.tipo, g.periodo, g.fecha, g.proveedor ?? '', req.params.id);
    const saved = db.prepare('SELECT * FROM gastos WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/gastos/:id', (req, res) => {
    if (!ownsGasto(db, req.params.id, req.user.id)) {
      return res.status(403).json({ error: 'Gasto no autorizado' });
    }
    db.prepare('DELETE FROM gastos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
