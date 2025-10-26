import { Pool } from 'pg';

let pool: Pool | null = null;
let isConnected = false;

const getPool = () => {
  if (!pool) {
    const {
      DATABASE_URL,
      PGHOST,
      PGPORT,
      PGUSER,
      PGPASSWORD,
      PGDATABASE
    } = process.env as Record<string, string | undefined>;

    if (DATABASE_URL) {
      pool = new Pool({ connectionString: DATABASE_URL });
    } else if (PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE) {
      pool = new Pool({
        host: PGHOST,
        port: Number(PGPORT),
        user: PGUSER,
        password: PGPASSWORD,
        database: PGDATABASE
      });
    } else {
      throw new Error('Variáveis de ambiente do PostgreSQL ausentes: use DATABASE_URL ou PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE');
    }
  }
  return pool!;
};

export const connectDB = async () => {
  if (isConnected) return;
  const pool = getPool();
  // Testa conexão
  await pool.query('SELECT 1');

  // Inicialização simples de schema (id bigserial para evitar extensões)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Criar o tipo enum com proteção contra duplicidade
  await pool.query(`
    DO $$
    BEGIN
      CREATE TYPE series_status AS ENUM ('planejado', 'assistindo', 'concluido');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END$$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS series (
      id BIGSERIAL PRIMARY KEY,
      titulo VARCHAR(200) NOT NULL,
      nota NUMERIC(3,1) NOT NULL CHECK (nota >= 0 AND nota <= 10),
      numero_temporadas INTEGER NOT NULL CHECK (numero_temporadas >= 1),
      episodios_totais INTEGER NOT NULL CHECK (episodios_totais >= 1),
      episodios_assistidos INTEGER NOT NULL DEFAULT 0 CHECK (episodios_assistidos >= 0),
      status series_status NOT NULL DEFAULT 'planejado',
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  isConnected = true;
  console.log('Conectado ao PostgreSQL');
};

export const ensureDBConnected = async () => {
  if (!isConnected) {
    await connectDB();
  }
};

export const query = async <T = any>(text: string, params?: any[]): Promise<{ rows: T[] } & any> => {
  const pool = getPool();
  return pool.query(text, params);
};
