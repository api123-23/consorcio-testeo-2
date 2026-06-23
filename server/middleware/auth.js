import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'concorcio-dev-secret-change-in-production';

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
