export default function edificiosRoutes(router, db) {
  router.get('/edificios', (req, res) => {
    const rows = db.prepare('SELECT * FROM edificios WHERE activo = 1').all();
    res.json(rows);
  });

  router.post('/edificios', (req, res) => {
    const e = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO edificios (id, nombre, direccion, admin, metros_totales, activo) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(e.id, e.nombre, e.direccion ?? '', e.admin ?? '', e.metros_totales ?? 0, e.activo ?? 1);
    const saved = db.prepare('SELECT * FROM edificios WHERE id = ?').get(e.id);
    res.json(saved);
  });

  router.put('/edificios/:id', (req, res) => {
    const e = req.body;
    db.prepare(
      'UPDATE edificios SET nombre = ?, direccion = ?, admin = ?, metros_totales = ? WHERE id = ?'
    ).run(e.nombre, e.direccion ?? '', e.admin ?? '', e.metros_totales ?? 0, req.params.id);
    const saved = db.prepare('SELECT * FROM edificios WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/edificios/:id', (req, res) => {
    db.prepare('UPDATE edificios SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
