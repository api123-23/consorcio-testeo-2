export default function gastosRoutes(router, db) {
  router.get('/gastos', (req, res) => {
    const { edificio_id } = req.query;
    let rows;
    if (edificio_id) {
      rows = db.prepare('SELECT * FROM gastos WHERE edificio_id = ?').all(edificio_id);
    } else {
      rows = db.prepare('SELECT * FROM gastos').all();
    }
    res.json(rows);
  });

  router.post('/gastos', (req, res) => {
    const g = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO gastos (id, edificio_id, descripcion, monto, tipo, periodo, fecha, proveedor, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(g.id, g.edificio_id, g.descripcion, g.monto, g.tipo, g.periodo, g.fecha, g.proveedor ?? '', g.creado_en ?? '');
    const saved = db.prepare('SELECT * FROM gastos WHERE id = ?').get(g.id);
    res.json(saved);
  });

  router.put('/gastos/:id', (req, res) => {
    const g = req.body;
    db.prepare(
      'UPDATE gastos SET descripcion = ?, monto = ?, tipo = ?, periodo = ?, fecha = ?, proveedor = ? WHERE id = ?'
    ).run(g.descripcion, g.monto, g.tipo, g.periodo, g.fecha, g.proveedor ?? '', req.params.id);
    const saved = db.prepare('SELECT * FROM gastos WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/gastos/:id', (req, res) => {
    db.prepare('DELETE FROM gastos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
