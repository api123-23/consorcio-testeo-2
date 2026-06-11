export default function pagosRoutes(router, db) {
  router.get('/pagos', (req, res) => {
    const { departamento_id } = req.query;
    let rows;
    if (departamento_id) {
      rows = db.prepare('SELECT * FROM pagos WHERE departamento_id = ?').all(departamento_id);
    } else {
      rows = db.prepare('SELECT * FROM pagos').all();
    }
    res.json(rows);
  });

  router.post('/pagos', (req, res) => {
    const p = req.body;
    db.prepare(
      'INSERT OR REPLACE INTO pagos (id, departamento_id, periodo, monto, fecha_pago, metodo, comprobante, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(p.id, p.departamento_id, p.periodo, p.monto, p.fecha_pago, p.metodo ?? '', p.comprobante ?? '', p.creado_en ?? '');
    const saved = db.prepare('SELECT * FROM pagos WHERE id = ?').get(p.id);
    res.json(saved);
  });

  router.put('/pagos/:id', (req, res) => {
    const p = req.body;
    db.prepare(
      'UPDATE pagos SET departamento_id = ?, periodo = ?, monto = ?, fecha_pago = ?, metodo = ?, comprobante = ? WHERE id = ?'
    ).run(p.departamento_id, p.periodo, p.monto, p.fecha_pago, p.metodo ?? '', p.comprobante ?? '', req.params.id);
    const saved = db.prepare('SELECT * FROM pagos WHERE id = ?').get(req.params.id);
    res.json(saved);
  });

  router.delete('/pagos/:id', (req, res) => {
    db.prepare('DELETE FROM pagos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
}
