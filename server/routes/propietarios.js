export default function propietariosRoutes(router, db) {
  router.get('/propietarios', (req, res) => {
    const { departamento_id, persona_id } = req.query;
    let query = 'SELECT * FROM propietarios';
    const params = [];
    const conditions = [];
    if (departamento_id) { conditions.push('departamento_id = ?'); params.push(departamento_id); }
    if (persona_id) { conditions.push('persona_id = ?'); params.push(persona_id); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    res.json(db.prepare(query).all(...params));
  });

  router.post('/propietarios', (req, res) => {
    const p = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO propietarios (id, departamento_id, persona_id, activo, fecha_desde, fecha_hasta) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(p.id, p.departamento_id, p.persona_id, p.activo ?? 1, p.fecha_desde ?? null, p.fecha_hasta ?? null);
    const saved = db.prepare('SELECT * FROM propietarios WHERE id = ?').get(p.id);
    res.json(saved);
  });

  router.delete('/propietarios/:id', (req, res) => {
    const hoy = new Date().toISOString().slice(0, 10);
    db.prepare('UPDATE propietarios SET activo = 0, fecha_hasta = ? WHERE id = ?').run(hoy, req.params.id);
    res.json({ ok: true });
  });

  router.delete('/propietarios', (req, res) => {
    const { departamento_id, persona_id } = req.query;
    if (departamento_id && persona_id) {
      const hoy = new Date().toISOString().slice(0, 10);
      db.prepare('UPDATE propietarios SET activo = 0, fecha_hasta = ? WHERE departamento_id = ? AND persona_id = ?')
        .run(hoy, departamento_id, persona_id);
    }
    res.json({ ok: true });
  });
}
