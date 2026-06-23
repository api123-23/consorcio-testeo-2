import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';
import authMiddleware from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import edificiosRoutes from './routes/edificios.js';
import departamentosRoutes from './routes/departamentos.js';
import personasRoutes from './routes/personas.js';
import propietariosRoutes from './routes/propietarios.js';
import inquilinosRoutes from './routes/inquilinos.js';
import gastosRoutes from './routes/gastos.js';
import pagosRoutes from './routes/pagos.js';
import liquidacionesRoutes from './routes/liquidaciones.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = getDb();

const api = express.Router();

// Auth routes (no middleware)
authRoutes(api, db);

// Protected routes
api.use(authMiddleware);
edificiosRoutes(api, db);
departamentosRoutes(api, db);
personasRoutes(api, db);
propietariosRoutes(api, db);
inquilinosRoutes(api, db);
gastosRoutes(api, db);
pagosRoutes(api, db);
liquidacionesRoutes(api, db);

app.use('/api', api);

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
