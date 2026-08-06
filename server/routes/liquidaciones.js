import { ownsEdificio, ownsLiquidacion } from '../scope.js';

export default function liquidacionesRoutes(router, db) {
  router.get('/liquidaciones', (req, res) => {
    const { edificio_id } = req.query;
    if (edificio_id) {
      if (!ownsEdificio(db, edificio_id, req.user.id)) {
        return res.status(403).json({ error: 'Edificio no autorizado' });
      }
      const rows = db.prepare(
        `SELECT l.* FROM liquidaciones l
         JOIN edificios e ON e.id = l.edificio_id
         WHERE e.user_id = ? AND l.edificio_id = ?`
      ).all(req.user.id, edificio_id);
      return res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data || '{}') })));
    }
    const rows = db.prepare(
      `SELECT l.* FROM liquidaciones l
       JOIN edificios e ON e.id = l.edificio_id
       WHERE e.user_id = ?`
    ).all(req.user.id);
    res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data || '{}') })));
  });

  router.post('/liquidaciones', (req, res) => {
    const l = req.body;
    if (!ownsEdificio(db, l.edificio_id, req.user.id)) {
      return res.status(403).json({ error: 'Edificio no autorizado' });
    }
    db.prepare(
      'INSERT OR REPLACE INTO liquidaciones (id, edificio_id, periodo, creado_en, data) VALUES (?, ?, ?, ?, ?)'
    ).run(l.id, l.edificio_id, l.periodo, l.creado_en ?? '', JSON.stringify(l.data || {}));
    const saved = db.prepare('SELECT * FROM liquidaciones WHERE id = ?').get(l.id);
    res.json({ ...saved, data: JSON.parse(saved.data || '{}') });
  });
}
