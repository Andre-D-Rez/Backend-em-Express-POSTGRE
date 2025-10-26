import { ISeries, SeriesStatus } from '../models/series.model';
import { query } from '../database/connection';
import logger from '../utils/logger';

interface CreateSeriesData {
  titulo: string;
  nota: number;
  numeroTemporadas: number;
  episodiosTotais: number;
  episodiosAssistidos: number;
  status: SeriesStatus;
}

interface UpdateSeriesData {
  titulo?: string;
  nota?: number;
  numeroTemporadas?: number;
  episodiosTotais?: number;
  episodiosAssistidos?: number;
  status?: SeriesStatus;
}

interface FilterOptions {
  userId: string;
  status?: SeriesStatus;
  titulo?: string;
  nota?: number;
}

export const createSeries = async (userId: string, data: CreateSeriesData): Promise<ISeries> => {
  logger.info(`Criando nova série para usuário ${userId}`, { titulo: data.titulo });

  const uid = Number(userId);
  if (!Number.isFinite(uid) || uid <= 0) throw new Error('Usuário inválido');

  if (data.episodiosAssistidos > data.episodiosTotais) {
    throw new Error('Episódios assistidos não pode exceder o total de episódios');
  }

  if (typeof data.nota !== 'number' || data.nota < 0 || data.nota > 10) {
    throw new Error('Nota deve ser entre 0 e 10');
  }

  const result = await query<{
    id: number;
    titulo: string;
    nota: number;
    numero_temporadas: number;
    episodios_totais: number;
    episodios_assistidos: number;
    status: SeriesStatus;
    user_id: number;
    created_at: string;
    updated_at: string;
  }>(
    `INSERT INTO series (titulo, nota, numero_temporadas, episodios_totais, episodios_assistidos, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.titulo,
      data.nota,
      data.numeroTemporadas,
      data.episodiosTotais,
      data.episodiosAssistidos,
      data.status,
      uid
    ]
  );

  const row = result.rows[0];
  const saved: ISeries = {
    id: row.id,
    titulo: row.titulo,
    nota: Number(row.nota),
    numeroTemporadas: row.numero_temporadas,
    episodiosTotais: row.episodios_totais,
    episodiosAssistidos: row.episodios_assistidos,
    status: row.status,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };

  logger.info(`Série criada com sucesso: ${saved.id}`, { titulo: saved.titulo });
  return saved;
};

export const getAllSeriesByUser = async (userId: string, filters?: Partial<FilterOptions>): Promise<ISeries[]> => {
  logger.info(`Buscando séries do usuário ${userId}`, { filters });
  const uid = Number(userId);
  if (!Number.isFinite(uid) || uid <= 0) return [];

  const where: string[] = ['user_id = $1'];
  const params: any[] = [uid];
  let p = 2;

  if (filters?.status) {
    where.push(`status = $${p++}`);
    params.push(filters.status);
  }

  if (typeof filters?.nota === 'number') {
    where.push(`nota = $${p++}`);
    params.push(filters.nota);
  }

  if (filters?.titulo) {
    where.push(`titulo ILIKE '%' || $${p++} || '%'`);
    params.push(filters.titulo);
  }

  const sql = `SELECT * FROM series WHERE ${where.join(' AND ')} ORDER BY created_at DESC`;
  const result = await query<any>(sql, params);
  const list: ISeries[] = result.rows.map((row: any) => ({
    id: row.id,
    titulo: row.titulo,
    nota: Number(row.nota),
    numeroTemporadas: row.numero_temporadas,
    episodiosTotais: row.episodios_totais,
    episodiosAssistidos: row.episodios_assistidos,
    status: row.status,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));

  logger.info(`${list.length} série(s) encontrada(s) para usuário ${userId}`);
  return list;
};

export const getSeriesById = async (userId: string, seriesId: string): Promise<ISeries | null> => {
  logger.info(`Buscando série ${seriesId} para usuário ${userId}`);
  const uid = Number(userId);
  const sid = Number(seriesId);
  if (!Number.isFinite(uid) || !Number.isFinite(sid) || uid <= 0 || sid <= 0) {
    logger.warn(`ID inválido(s): user=${userId} series=${seriesId}`);
    return null;
  }

  const result = await query<any>(`SELECT * FROM series WHERE id = $1 AND user_id = $2`, [sid, uid]);
  const row = result.rows[0];
  if (!row) {
    logger.warn(`Série ${seriesId} não encontrada ou não pertence ao usuário ${userId}`);
    return null;
  }
  const series: ISeries = {
    id: row.id,
    titulo: row.titulo,
    nota: Number(row.nota),
    numeroTemporadas: row.numero_temporadas,
    episodiosTotais: row.episodios_totais,
    episodiosAssistidos: row.episodios_assistidos,
    status: row.status,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
  return series;
};

export const updateSeriesFull = async (
  userId: string,
  seriesId: string,
  data: CreateSeriesData
): Promise<ISeries | null> => {
  logger.info(`Atualizando série completa ${seriesId} para usuário ${userId}`, { data });

  const uid = Number(userId);
  const sid = Number(seriesId);
  if (!Number.isFinite(uid) || !Number.isFinite(sid) || uid <= 0 || sid <= 0) {
    logger.warn(`ID inválido: ${seriesId}`);
    return null;
  }

  if (data.episodiosAssistidos > data.episodiosTotais) {
    throw new Error('Episódios assistidos não pode exceder o total de episódios');
  }
  if (typeof data.nota !== 'number' || data.nota < 0 || data.nota > 10) {
    throw new Error('Nota deve ser entre 0 e 10');
  }

  const result = await query<any>(
    `UPDATE series SET
      titulo = $1,
      nota = $2,
      numero_temporadas = $3,
      episodios_totais = $4,
      episodios_assistidos = $5,
      status = $6,
      updated_at = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [
      data.titulo,
      data.nota,
      data.numeroTemporadas,
      data.episodiosTotais,
      data.episodiosAssistidos,
      data.status,
      sid,
      uid
    ]
  );

  const row = result.rows[0];
  if (!row) {
    logger.warn(`Série ${seriesId} não encontrada ou não pertence ao usuário ${userId}`);
    return null;
  }
  const series: ISeries = {
    id: row.id,
    titulo: row.titulo,
    nota: Number(row.nota),
    numeroTemporadas: row.numero_temporadas,
    episodiosTotais: row.episodios_totais,
    episodiosAssistidos: row.episodios_assistidos,
    status: row.status,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
  logger.info(`Série ${seriesId} atualizada com sucesso`);
  return series;
};

export const updateSeriesPartial = async (
  userId: string,
  seriesId: string,
  data: UpdateSeriesData
): Promise<ISeries | null> => {
  logger.info(`Atualizando série parcial ${seriesId} para usuário ${userId}`, { data });
  const uid = Number(userId);
  const sid = Number(seriesId);
  if (!Number.isFinite(uid) || !Number.isFinite(sid) || uid <= 0 || sid <= 0) {
    logger.warn(`ID de série inválido: ${seriesId}`);
    return null;
  }

  // Buscar série atual para validações
  const currentRes = await query<any>(`SELECT * FROM series WHERE id = $1 AND user_id = $2`, [sid, uid]);
  const current = currentRes.rows[0];
  if (!current) {
    logger.warn(`Série ${seriesId} não encontrada ou não pertence ao usuário ${userId}`);
    return null;
  }

  const episodiosTotais = data.episodiosTotais ?? current.episodios_totais;
  const episodiosAssistidos = data.episodiosAssistidos ?? current.episodios_assistidos;
  if (episodiosAssistidos > episodiosTotais) {
    throw new Error('Episódios assistidos não pode exceder o total de episódios');
  }
  if (data.nota !== undefined && (data.nota < 0 || data.nota > 10)) {
    throw new Error('Nota deve ser entre 0 e 10');
  }

  // Construir UPDATE dinâmico
  const setParts: string[] = [];
  const params: any[] = [];
  let i = 1;
  const push = (sql: string, val: any) => { setParts.push(sql.replace('?', `$${i++}`)); params.push(val); };

  if (data.titulo !== undefined) push('titulo = ?', data.titulo);
  if (data.nota !== undefined) push('nota = ?', data.nota);
  if (data.numeroTemporadas !== undefined) push('numero_temporadas = ?', data.numeroTemporadas);
  if (data.episodiosTotais !== undefined) push('episodios_totais = ?', data.episodiosTotais);
  if (data.episodiosAssistidos !== undefined) push('episodios_assistidos = ?', data.episodiosAssistidos);
  if (data.status !== undefined) push('status = ?', data.status);

  if (setParts.length === 0) {
    // Nada a atualizar; retornar estado atual
    return {
      id: current.id,
      titulo: current.titulo,
      nota: Number(current.nota),
      numeroTemporadas: current.numero_temporadas,
      episodiosTotais: current.episodios_totais,
      episodiosAssistidos: current.episodios_assistidos,
      status: current.status,
      userId: current.user_id,
      createdAt: new Date(current.created_at),
      updatedAt: new Date(current.updated_at)
    };
  }

  const sql = `UPDATE series SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${i++} AND user_id = $${i++} RETURNING *`;
  params.push(sid, uid);

  const result = await query<any>(sql, params);
  const row = result.rows[0];
  if (!row) return null;

  const series: ISeries = {
    id: row.id,
    titulo: row.titulo,
    nota: Number(row.nota),
    numeroTemporadas: row.numero_temporadas,
    episodiosTotais: row.episodios_totais,
    episodiosAssistidos: row.episodios_assistidos,
    status: row.status,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
  logger.info(`Série ${seriesId} atualizada parcialmente com sucesso`);
  return series;
};

export const deleteSeries = async (userId: string, seriesId: string): Promise<boolean> => {
  logger.info(`Deletando série ${seriesId} para usuário ${userId}`);
  const uid = Number(userId);
  const sid = Number(seriesId);
  if (!Number.isFinite(uid) || !Number.isFinite(sid) || uid <= 0 || sid <= 0) {
    logger.warn(`ID de série inválido: ${seriesId}`);
    return false;
  }
  const result = await query<any>(`DELETE FROM series WHERE id = $1 AND user_id = $2`, [sid, uid]);
  // result.rowCount indica quantas linhas foram afetadas
  const ok = (result as any).rowCount > 0;
  if (!ok) {
    logger.warn(`Série ${seriesId} não encontrada ou não pertence ao usuário ${userId}`);
    return false;
  }
  logger.info(`Série ${seriesId} deletada com sucesso`);
  return true;
};
