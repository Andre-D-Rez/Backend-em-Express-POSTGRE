import { query } from '../database/connection';
import type { IUser } from '../models/user.model';
import bcrypt from 'bcrypt';

export const createUser = async (data: { name: string; email: string; password: string }) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(data.password, salt);
  const result = await query<{ id: number; name: string; email: string }>(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, name, email`,
    [data.name, data.email, hash]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  const result = await query<IUser>(
    `SELECT id, name, email, password
     FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};
