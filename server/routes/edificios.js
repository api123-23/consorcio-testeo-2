export default function edificiosRoutes(router, db) {
  router.get('/edificios', (req, res) => {
    const rows = db.prepare('SELECT * FROM edificios WHERE activo = 1 AND user_id = ?').all(req.user.id);
    res.json(rows);
  });

  router.post('/edificios', (req, res) => {
    const e = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO edificios (id, nombre, direccion, admin, metros_totales, user_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(e.id, e.nombre, e.direccion ?? '', e.admin ?? '', e.metros_totales ?? 0, req.user.id, e.activo ?? 1);
    const saved = db.prepare('SELECT * FROM edificios WHERE id = ?').get(e.id);
    res.json(saved);
  });

  router.put('/edificios/:id', (req, res) => {
    const e = req.body;
    const existing = db.prepare('SELECT * FROM edificios WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Edificio no encontrado' });
    db.prepare(
      'UPDATE edificios SET nombre = ?, direccion = ?, admin = ?, metros_totales = ? WHERE id = ? AND user_id = ?'
    ).run(e.nombre, e.direccion ?? '', e.admin ?? '', e.metros_totales ?? 0, req.params.id, req.user.id);
    const saved = db.prepare('SELECT * FROM edificios WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/edificios/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM edificios WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Edificio no encontrado' });
    db.prepare('UPDATE edificios SET activo = 0 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    db.prepare('UPDATE departamentos SET activo = 0 WHERE edificio_id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
