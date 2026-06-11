export default function unidadesRoutes(router, db) {
  router.get('/unidades', (req, res) => {
    const rows = db.prepare('SELECT * FROM unidades').all();
    res.json(rows);
  });

  router.post('/unidades', (req, res) => {
    const u = req.body;
    db.prepare(
      `INSERT OR REPLACE INTO unidades (id, numero, piso, letra, propietario_id, inquilino_id, porcentaje, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(u.id, u.numero, u.piso ?? 0, u.letra ?? '', u.propietario_id ?? null, u.inquilino_id ?? null, u.porcentaje, u.activo ?? 1);
    const saved = db.prepare('SELECT * FROM unidades WHERE id = ?').get(u.id);
    res.json(saved);
  });

  router.put('/unidades/:id', (req, res) => {
    const u = req.body;
    db.prepare(
      `UPDATE unidades SET numero = ?, piso = ?, letra = ?, propietario_id = ?, inquilino_id = ?, porcentaje = ?, activo = ?
       WHERE id = ?`
    ).run(u.numero, u.piso ?? 0, u.letra ?? '', u.propietario_id ?? null, u.inquilino_id ?? null, u.porcentaje, u.activo ?? 1, req.params.id);
    const saved = db.prepare('SELECT * FROM unidades WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/unidades/:id', (req, res) => {
    db.prepare('UPDATE unidades SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
