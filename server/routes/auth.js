import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'concorcio-dev-secret-change-in-production';

export default function authRoutes(router, db) {
  router.post('/auth/register', (req, res) => {
    try {
      const { email, password, nombre } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ error: 'Este email ya está registrado' });
      }

      const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const password_hash = bcrypt.hashSync(password, 10);
      db.prepare('INSERT INTO users (id, email, password_hash, nombre) VALUES (?, ?, ?, ?)')
        .run(id, email.toLowerCase(), password_hash, nombre || '');

      const token = jwt.sign({ id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id, email: email.toLowerCase(), nombre: nombre || '' } });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Error al registrar' });
    }
  });

  router.post('/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: { id: user.id, email: user.email, nombre: user.nombre || '' },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  });

  router.get('/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const user = db.prepare('SELECT id, email, nombre FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      res.json({ user });
    } catch {
      res.status(401).json({ error: 'Token inválido' });
    }
  });

  router.post('/auth/change-password', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const valid = bcrypt.compareSync(current_password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }

      const password_hash = bcrypt.hashSync(new_password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, decoded.id);

      res.json({ ok: true, message: 'Contraseña actualizada' });
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token inválido' });
      }
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }
  });
}
