export default function recargosRoutes(router, db) {
  router.get('/recargos', (req, res) => {
    const { departamento_id } = req.query;
    let rows;
    if (departamento_id) {
      rows = db.prepare('SELECT * FROM recargos WHERE departamento_id = ?').all(departamento_id);
    } else {
      rows = db.prepare('SELECT * FROM recargos').all();
    }
    res.json(rows);
  });

  router.post('/recargos', (req, res) => {
    const r = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO recargos (id, departamento_id, periodo, monto, descripcion, creado_en) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(r.id, r.departamento_id, r.periodo, r.monto, r.descripcion ?? '', r.creado_en ?? '');
    const saved = db.prepare('SELECT * FROM recargos WHERE id = ?').get(r.id);
    res.json(saved);
  });

  router.delete('/recargos/:id', (req, res) => {
    db.prepare('DELETE FROM recargos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
