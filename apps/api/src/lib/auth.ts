import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import { env } from '../config/env.js';

export type AuthPayload = {
  userId: string;
  email: string;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createAuthToken(payload: AuthPayload) {
  return jwt.sign(payload, env.AUTH_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.AUTH_SECRET) as AuthPayload;
}

export function getCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
