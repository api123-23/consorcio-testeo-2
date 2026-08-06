import { ownsDepartamento, ownsInquilino, ownsPersona } from '../scope.js';

export default function inquilinosRoutes(router, db) {
  const scope = (userId) => db.prepare(
    `SELECT i.* FROM inquilinos i
     JOIN departamentos d ON d.id = i.departamento_id
     JOIN edificios e ON e.id = d.edificio_id
     WHERE e.user_id = ?`
  ).all(userId);

  router.get('/inquilinos', (req, res) => {
    const { departamento_id, activo } = req.query;
    if (departamento_id && !ownsDepartamento(db, departamento_id, req.user.id)) {
      return res.status(403).json({ error: 'Departamento no autorizado' });
    }
    let query = `SELECT i.* FROM inquilinos i
      JOIN departamentos d ON d.id = i.departamento_id
      JOIN edificios e ON e.id = d.edificio_id
      WHERE e.user_id = ?`;
    const params = [req.user.id];
    const conditions = [];
    if (departamento_id) { conditions.push('i.departamento_id = ?'); params.push(departamento_id); }
    if (activo !== undefined) { conditions.push('i.activo = ?'); params.push(activo === '1' ? 1 : 0); }
    if (conditions.length) query += ' AND ' + conditions.join(' AND ');
    res.json(db.prepare(query).all(...params));
  });

  router.post('/inquilinos', (req, res) => {
    const i = req.body;
    if (!ownsDepartamento(db, i.departamento_id, req.user.id)) {
      return res.status(403).json({ error: 'Departamento no autorizado' });
    }
    if (!ownsPersona(db, i.persona_id, req.user.id)) {
      return res.status(403).json({ error: 'Persona no autorizada' });
    }
    db.prepare(
      'INSERT OR REPLACE INTO inquilinos (id, departamento_id, persona_id, fecha_desde, fecha_hasta, activo) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(i.id, i.departamento_id, i.persona_id, i.fecha_desde ?? null, i.fecha_hasta ?? null, i.activo ?? 1);
    const saved = db.prepare('SELECT * FROM inquilinos WHERE id = ?').get(i.id);
    res.json(saved);
  });

  router.put('/inquilinos/:id', (req, res) => {
    const i = req.body;
    if (!ownsInquilino(db, req.params.id, req.user.id)) {
      return res.status(403).json({ error: 'Inquilino no autorizado' });
    }
    db.prepare(
      'UPDATE inquilinos SET persona_id = ?, fecha_desde = ?, fecha_hasta = ?, activo = ? WHERE id = ?'
    ).run(i.persona_id, i.fecha_desde ?? null, i.fecha_hasta ?? null, i.activo ?? 1, req.params.id);
    const saved = db.prepare('SELECT * FROM inquilinos WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/inquilinos/:id', (req, res) => {
    if (!ownsInquilino(db, req.params.id, req.user.id)) {
      return res.status(403).json({ error: 'Inquilino no autorizado' });
    }
    db.prepare('UPDATE inquilinos SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
