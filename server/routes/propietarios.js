export default function propietariosRoutes(router, db) {
  router.get('/propietarios', (req, res) => {
    const { departamento_id, persona_id } = req.query;
    let query = 'SELECT * FROM propietarios WHERE activo = 1';
    const params = [];
    if (departamento_id) { query += ' AND departamento_id = ?'; params.push(departamento_id); }
    if (persona_id) { query += ' AND persona_id = ?'; params.push(persona_id); }
    res.json(db.prepare(query).all(...params));
  });

  router.post('/propietarios', (req, res) => {
    const p = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO propietarios (id, departamento_id, persona_id, activo) VALUES (?, ?, ?, ?)'
    ).run(p.id, p.departamento_id, p.persona_id, p.activo ?? 1);
    const saved = db.prepare('SELECT * FROM propietarios WHERE id = ?').get(p.id);
    res.json(saved);
  });

  router.delete('/propietarios/:id', (req, res) => {
    db.prepare('UPDATE propietarios SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  router.delete('/propietarios', (req, res) => {
    const { departamento_id, persona_id } = req.query;
    if (departamento_id && persona_id) {
      db.prepare('UPDATE propietarios SET activo = 0 WHERE departamento_id = ? AND persona_id = ?')
        .run(departamento_id, persona_id);
    }
    res.json({ ok: true });
  });
}
