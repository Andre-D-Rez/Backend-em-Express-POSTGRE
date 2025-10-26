export interface IUser {
  id: number;
  name: string;
  email: string;
  password: string; // hashed
  created_at?: Date;
  updated_at?: Date;
}

// Sem export default de modelo; usamos consultas SQL via pg
