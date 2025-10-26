export const PORT = Number(process.env.PORT || 3000);

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const DATABASE_URL = process.env.DATABASE_URL;
export const PGHOST = process.env.PGHOST;
export const PGPORT = process.env.PGPORT;
export const PGUSER = process.env.PGUSER;
export const PGPASSWORD = process.env.PGPASSWORD;
export const PGDATABASE = process.env.PGDATABASE;

export const validateEnv = () => {
  const missing: string[] = [];
  if (!JWT_SECRET) missing.push('JWT_SECRET');
  // Requer DATABASE_URL ou conjunto PG*
  const hasConnString = !!DATABASE_URL;
  const hasPgParams = !!(PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE);
  if (!hasConnString && !hasPgParams) missing.push('DATABASE_URL ou (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)');
  if (missing.length) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
};
