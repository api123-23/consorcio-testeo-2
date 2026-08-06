import { ownsDepartamento, ownsPersona, ownsPropietario } from '../scope.js';

export default function propietariosRoutes(router, db) {
  const scope = (userId) => db.prepare(
    `SELECT pr.* FROM propietarios pr
     JOIN departamentos d ON d.id = pr.departamento_id
     JOIN edificios e ON e.id = d.edificio_id
     WHERE e.user_id = ?`
  ).all(userId);

  router.get('/propietarios', (req, res) => {
    const { departamento_id, persona_id } = req.query;
    if (departamento_id && !ownsDepartamento(db, departamento_id, req.user.id)) {
      return res.status(403).json({ error: 'Departamento no autorizado' });
    }
    if (persona_id && !ownsPersona(db, persona_id, req.user.id)) {
      return res.status(403).json({ error: 'Persona no autorizada' });
    }
    if (departamento_id || persona_id) {
      let query = `SELECT pr.* FROM propietarios pr
        JOIN departamentos d ON d.id = pr.departamento_id
        JOIN edificios e ON e.id = d.edificio_id
        WHERE e.user_id = ?`;
      const params = [req.user.id];
      const conditions = [];
      if (departamento_id) { conditions.push('pr.departamento_id = ?'); params.push(departamento_id); }
      if (persona_id) { conditions.push('pr.persona_id = ?'); params.push(persona_id); }
      if (conditions.length) query += ' AND ' + conditions.join(' AND ');
      return res.json(db.prepare(query).all(...params));
    }
    res.json(scope(req.user.id));
  });

  router.post('/propietarios', (req, res) => {
    const p = req.body;
    if (!ownsDepartamento(db, p.departamento_id, req.user.id)) {
      return res.status(403).json({ error: 'Departamento no autorizado' });
    }
    if (!ownsPersona(db, p.persona_id, req.user.id)) {
      return res.status(403).json({ error: 'Persona no autorizada' });
    }
    db.prepare(
      'INSERT OR REPLACE INTO propietarios (id, departamento_id, persona_id, activo, fecha_desde, fecha_hasta) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(p.id, p.departamento_id, p.persona_id, p.activo ?? 1, p.fecha_desde ?? null, p.fecha_hasta ?? null);
    const saved = db.prepare('SELECT * FROM propietarios WHERE id = ?').get(p.id);
    res.json(saved);
  });

  router.delete('/propietarios/:id', (req, res) => {
    if (!ownsPropietario(db, req.params.id, req.user.id)) {
      return res.status(403).json({ error: 'Propietario no autorizado' });
    }
    const hoy = new Date().toISOString().slice(0, 10);
    db.prepare('UPDATE propietarios SET activo = 0, fecha_hasta = ? WHERE id = ?').run(hoy, req.params.id);
    res.json({ ok: true });
  });

  router.delete('/propietarios', (req, res) => {
    const { departamento_id, persona_id } = req.query;
    if (departamento_id && persona_id) {
      if (!ownsDepartamento(db, departamento_id, req.user.id)) {
        return res.status(403).json({ error: 'Departamento no autorizado' });
      }
      if (!ownsPersona(db, persona_id, req.user.id)) {
        return res.status(403).json({ error: 'Persona no autorizada' });
      }
      const hoy = new Date().toISOString().slice(0, 10);
      db.prepare('UPDATE propietarios SET activo = 0, fecha_hasta = ? WHERE departamento_id = ? AND persona_id = ?')
        .run(hoy, departamento_id, persona_id);
    }
    res.json({ ok: true });
  });
}
