import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { isValidEmail, isStrongPassword, isValidName } from '../utils/validators';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) {
      logger.warn('Register: dados incompletos');
      return res.status(422).json({ message: 'Dados incompletos' });
    }

    if (!isValidName(name)) {
      logger.warn('Register: nome inválido');
      return res.status(422).json({ message: 'Nome inválido (mínimo 2 caracteres)' });
    }
    if (!isValidEmail(email)) {
      logger.warn('Register: email inválido');
      return res.status(422).json({ message: 'Email inválido' });
    }
    if (!isStrongPassword(password)) {
      logger.warn('Register: senha fraca');
      return res.status(422).json({ message: 'Senha inválida (mín. 8 chars, maiúscula, minúscula, número e caractere especial)' });
    }

    const existing = await userService.findUserByEmail(email);
    if (existing) {
      logger.info('Register: email já cadastrado - %s', email);
      return res.status(422).json({ message: 'Email já cadastrado' });
    }

    const user = await userService.createUser({ name, email, password });
    logger.info('Register: usuário criado %s (%s)', String(user.id), user.email);
    return res.status(201).json({ message: 'Usuário criado com sucesso', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err: any) {
    // 23505 = unique_violation no PostgreSQL
    if (err && (err.code === '23505' || err.code === 23505)) {
      logger.warn('Register: violação de unique (email)');
      return res.status(422).json({ message: 'Email já cadastrado' });
    }
    logger.error('Register error: %o', err);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      logger.warn('Login: dados incompletos');
      return res.status(422).json({ message: 'Dados incompletos' });
    }

    if (!isValidEmail(email)) {
      logger.warn('Login: email inválido');
      return res.status(422).json({ message: 'Email inválido' });
    }

    const user = await userService.findUserByEmail(email);
    if (!user) {
      logger.info('Login: usuário não encontrado - %s', email);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const bcrypt = await import('bcrypt');
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      logger.info('Login: senha inválida para %s', email);
      return res.status(401).json({ message: 'Senha inválida' });
    }

    // jwt.sign type definitions are sometimes strict; cast to any to satisfy TS here
    const secret = (JWT_SECRET || '') as any;
    logger.info('Login: emitindo token para %s com expiresIn=%s', email, JWT_EXPIRES_IN);
    const token = (jwt as any).sign({ id: user.id, email: user.email }, secret, { expiresIn: JWT_EXPIRES_IN } as any);

    // Metadados de expiração para facilitar depuração (não contém segredo)
    const decoded: any = jwt.decode(token);
    const iat = decoded?.iat ? Number(decoded.iat) : undefined;
    const exp = decoded?.exp ? Number(decoded.exp) : undefined;
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = exp && iat ? exp - iat : undefined;
    const expiresAt = exp ? new Date(exp * 1000).toISOString() : undefined;

    logger.info('Login: token emitido. now=%d, iat=%s, exp=%s, expiresInSeconds=%s', now, String(iat), String(exp), String(expiresInSeconds));

    return res.json({
      message: 'Login realizado com sucesso',
      token,
      meta: {
        expiresIn: JWT_EXPIRES_IN,
        iat,
        exp,
        now,
        expiresInSeconds,
        expiresAt
      }
    });
  } catch (err) {
    logger.error('Login error: %o', err);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
};
