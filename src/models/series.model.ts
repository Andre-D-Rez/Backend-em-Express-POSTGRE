export enum SeriesStatus {
  PLANEJADO = 'planejado',
  ASSISTINDO = 'assistindo',
  CONCLUIDO = 'concluido'
}

export interface ISeries {
  id: number;
  titulo: string;
  nota: number;
  numeroTemporadas: number;
  episodiosTotais: number;
  episodiosAssistidos: number;
  status: SeriesStatus;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Sem modelo Mongoose; usaremos SQL via pg
