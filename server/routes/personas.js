export default function personasRoutes(router, db) {
  router.get('/personas', (req, res) => {
    const rows = db.prepare('SELECT * FROM personas WHERE activo = 1').all();
    res.json(rows);
  });

  router.post('/personas', (req, res) => {
    const p = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO personas (id, nombre, dni, email, telefono, direccion, observaciones, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(p.id, p.nombre, p.dni ?? '', p.email ?? '', p.telefono ?? '', p.direccion ?? '', p.observaciones ?? '', p.activo ?? 1);
    const saved = db.prepare('SELECT * FROM personas WHERE id = ?').get(p.id);
    res.json(saved);
  });

  router.put('/personas/:id', (req, res) => {
    const p = req.body;
    db.prepare(
      'UPDATE personas SET nombre = ?, dni = ?, email = ?, telefono = ?, direccion = ?, observaciones = ?, activo = ? WHERE id = ?'
    ).run(p.nombre, p.dni ?? '', p.email ?? '', p.telefono ?? '', p.direccion ?? '', p.observaciones ?? '', p.activo ?? 1, req.params.id);
    const saved = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/personas/:id', (req, res) => {
    db.prepare('UPDATE personas SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
