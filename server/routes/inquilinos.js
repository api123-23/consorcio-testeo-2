export default function inquilinosRoutes(router, db) {
  router.get('/inquilinos', (req, res) => {
    const { departamento_id, activo } = req.query;
    let query = 'SELECT * FROM inquilinos';
    const params = [];
    const conditions = [];
    if (departamento_id) { conditions.push('departamento_id = ?'); params.push(departamento_id); }
    if (activo !== undefined) { conditions.push('activo = ?'); params.push(activo === '1' ? 1 : 0); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    res.json(db.prepare(query).all(...params));
  });

  router.post('/inquilinos', (req, res) => {
    const i = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO inquilinos (id, departamento_id, persona_id, fecha_desde, fecha_hasta, activo) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(i.id, i.departamento_id, i.persona_id, i.fecha_desde ?? null, i.fecha_hasta ?? null, i.activo ?? 1);
    const saved = db.prepare('SELECT * FROM inquilinos WHERE id = ?').get(i.id);
    res.json(saved);
  });

  router.put('/inquilinos/:id', (req, res) => {
    const i = req.body;
    db.prepare(
      'UPDATE inquilinos SET persona_id = ?, fecha_desde = ?, fecha_hasta = ?, activo = ? WHERE id = ?'
    ).run(i.persona_id, i.fecha_desde ?? null, i.fecha_hasta ?? null, i.activo ?? 1, req.params.id);
    const saved = db.prepare('SELECT * FROM inquilinos WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/inquilinos/:id', (req, res) => {
    db.prepare('UPDATE inquilinos SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
