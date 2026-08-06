import { ownsDepartamento, ownsRecargo } from '../scope.js';

export default function recargosRoutes(router, db) {
  router.get('/recargos', (req, res) => {
    const { departamento_id } = req.query;
    if (departamento_id) {
      if (!ownsDepartamento(db, departamento_id, req.user.id)) {
        return res.status(403).json({ error: 'Departamento no autorizado' });
      }
      const rows = db.prepare(
        `SELECT r.* FROM recargos r
         JOIN departamentos d ON d.id = r.departamento_id
         JOIN edificios e ON e.id = d.edificio_id
         WHERE e.user_id = ? AND r.departamento_id = ?`
      ).all(req.user.id, departamento_id);
      return res.json(rows);
    }
    const rows = db.prepare(
      `SELECT r.* FROM recargos r
       JOIN departamentos d ON d.id = r.departamento_id
       JOIN edificios e ON e.id = d.edificio_id
       WHERE e.user_id = ?`
    ).all(req.user.id);
    res.json(rows);
  });

  router.post('/recargos', (req, res) => {
    const r = req.body;
    if (!ownsDepartamento(db, r.departamento_id, req.user.id)) {
      return res.status(403).json({ error: 'Departamento no autorizado' });
    }
    db.prepare(
      'INSERT OR REPLACE INTO recargos (id, departamento_id, periodo, monto, descripcion, creado_en) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(r.id, r.departamento_id, r.periodo, r.monto, r.descripcion ?? '', r.creado_en ?? '');
    const saved = db.prepare('SELECT * FROM recargos WHERE id = ?').get(r.id);
    res.json(saved);
  });

  router.delete('/recargos/:id', (req, res) => {
    if (!ownsRecargo(db, req.params.id, req.user.id)) {
      return res.status(403).json({ error: 'Recargo no autorizado' });
    }
    db.prepare('DELETE FROM recargos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
