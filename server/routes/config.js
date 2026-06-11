export default function configRoutes(router, db) {
  router.get('/config', (req, res) => {
    const row = db.prepare('SELECT nombre_consorcio, admin, direccion FROM config WHERE rowid = 1').get();
    res.json(row || { nombre_consorcio: '', admin: '', direccion: '' });
  });

  router.put('/config', (req, res) => {
    const { nombre_consorcio, admin, direccion } = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO config (rowid, nombre_consorcio, admin, direccion, seeded) VALUES (1, ?, ?, ?, 1)'
    ).run(nombre_consorcio || '', admin || '', direccion || '');
    res.json({ ok: true });
  });
}
