export default function liquidacionesRoutes(router, db) {
  router.get('/liquidaciones', (req, res) => {
    const { edificio_id } = req.query;
    let rows;
    if (edificio_id) {
      rows = db.prepare('SELECT * FROM liquidaciones WHERE edificio_id = ?').all(edificio_id);
    } else {
      rows = db.prepare('SELECT * FROM liquidaciones').all();
    }
    res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data || '{}') })));
  });

  router.post('/liquidaciones', (req, res) => {
    const l = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO liquidaciones (id, edificio_id, periodo, creado_en, data) VALUES (?, ?, ?, ?, ?)'
    ).run(l.id, l.edificio_id, l.periodo, l.creado_en ?? '', JSON.stringify(l.data || {}));
    const saved = db.prepare('SELECT * FROM liquidaciones WHERE id = ?').get(l.id);
    res.json({ ...saved, data: JSON.parse(saved.data || '{}') });
  });
}
