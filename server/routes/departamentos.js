export default function departamentosRoutes(router, db) {
  router.get('/departamentos', (req, res) => {
    const { edificio_id } = req.query;
    let rows;
    if (edificio_id) {
      rows = db.prepare('SELECT * FROM departamentos WHERE edificio_id = ?').all(edificio_id);
    } else {
      rows = db.prepare('SELECT * FROM departamentos').all();
    }
    res.json(rows);
  });

  router.post('/departamentos', (req, res) => {
    const d = req.body;

    // Validate square meters don't exceed building total
    if (d.metros_cuadrados) {
      const edificio = db.prepare('SELECT metros_totales FROM edificios WHERE id = ?').get(d.edificio_id);
      const otros = db.prepare(
        'SELECT SUM(metros_cuadrados) as total FROM departamentos WHERE edificio_id = ? AND id != ? AND activo = 1'
      ).get(d.edificio_id, d.id || '');
      const sumaActual = otros?.total || 0;
      if (sumaActual + Number(d.metros_cuadrados) > (edificio?.metros_totales || 0)) {
        return res.status(400).json({ error: 'Los metros cuadrados superan el total del edificio' });
      }
    }

    // Auto-calculate percentage
    const edificio = db.prepare('SELECT metros_totales FROM edificios WHERE id = ?').get(d.edificio_id);
    const porcentaje = edificio?.metros_totales > 0
      ? Math.round((Number(d.metros_cuadrados) / edificio.metros_totales) * 10000) / 100
      : 0;

    db.prepare(
      'INSERT OR REPLACE INTO departamentos (id, edificio_id, numero, piso, letra, metros_cuadrados, porcentaje, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(d.id, d.edificio_id, d.numero, d.piso ?? 0, d.letra ?? '', d.metros_cuadrados ?? 0, porcentaje, d.activo ?? 1);
    const saved = db.prepare('SELECT * FROM departamentos WHERE id = ?').get(d.id);
    res.json(saved);
  });

  router.put('/departamentos/:id', (req, res) => {
    const d = req.body;

    // Validate square meters
    if (d.metros_cuadrados) {
      const edificio = db.prepare('SELECT metros_totales FROM edificios WHERE id = ?').get(d.edificio_id || req.params.id);
      const otros = db.prepare(
        'SELECT SUM(metros_cuadrados) as total FROM departamentos WHERE edificio_id = ? AND id != ? AND activo = 1'
      ).get(d.edificio_id, req.params.id);
      const sumaActual = otros?.total || 0;
      if (sumaActual + Number(d.metros_cuadrados) > (edificio?.metros_totales || 0)) {
        return res.status(400).json({ error: 'Los metros cuadrados superan el total del edificio' });
      }
    }

    const edificio = db.prepare('SELECT metros_totales FROM edificios WHERE id = ?').get(d.edificio_id);
    const porcentaje = edificio?.metros_totales > 0
      ? Math.round((Number(d.metros_cuadrados) / edificio.metros_totales) * 10000) / 100
      : 0;

    db.prepare(
      'UPDATE departamentos SET numero = ?, piso = ?, letra = ?, metros_cuadrados = ?, porcentaje = ?, activo = ? WHERE id = ?'
    ).run(d.numero, d.piso ?? 0, d.letra ?? '', d.metros_cuadrados ?? 0, porcentaje, d.activo ?? 1, req.params.id);
    const saved = db.prepare('SELECT * FROM departamentos WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/departamentos/:id', (req, res) => {
    db.prepare('UPDATE departamentos SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
