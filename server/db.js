import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS edificios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      direccion TEXT DEFAULT '',
      admin TEXT DEFAULT '',
      metros_totales REAL NOT NULL DEFAULT 0,
      user_id TEXT NOT NULL DEFAULT '',
      activo INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS departamentos (
      id TEXT PRIMARY KEY,
      edificio_id TEXT NOT NULL,
      numero TEXT NOT NULL,
      piso INTEGER DEFAULT 0,
      letra TEXT DEFAULT '',
      metros_cuadrados REAL NOT NULL DEFAULT 0,
      porcentaje REAL NOT NULL DEFAULT 0,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY (edificio_id) REFERENCES edificios(id)
    );

    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      dni TEXT DEFAULT '',
      email TEXT DEFAULT '',
      telefono TEXT DEFAULT '',
      direccion TEXT DEFAULT '',
      observaciones TEXT DEFAULT '',
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS propietarios (
      id TEXT PRIMARY KEY,
      departamento_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
      FOREIGN KEY (persona_id) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS inquilinos (
      id TEXT PRIMARY KEY,
      departamento_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      fecha_desde TEXT,
      fecha_hasta TEXT,
      activo INTEGER DEFAULT 1,
      FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
      FOREIGN KEY (persona_id) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS gastos (
      id TEXT PRIMARY KEY,
      edificio_id TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'ordinario',
      categoria TEXT DEFAULT '',
      periodo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      proveedor TEXT DEFAULT '',
      creado_en TEXT DEFAULT '',
      FOREIGN KEY (edificio_id) REFERENCES edificios(id)
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id TEXT PRIMARY KEY,
      departamento_id TEXT NOT NULL,
      periodo TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha_pago TEXT NOT NULL,
      metodo TEXT DEFAULT '',
      comprobante TEXT DEFAULT '',
      creado_en TEXT DEFAULT '',
      FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
    );

    CREATE TABLE IF NOT EXISTS liquidaciones (
      id TEXT PRIMARY KEY,
      edificio_id TEXT NOT NULL,
      periodo TEXT NOT NULL,
      creado_en TEXT DEFAULT '',
      data TEXT DEFAULT '{}',
      FOREIGN KEY (edificio_id) REFERENCES edificios(id)
    );
  `);
}
