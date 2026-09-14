import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyAuthToken } from '../lib/auth.js';
import { env } from '../config/env.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.clearCookie(env.AUTH_COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    req.user = user;
    return next();
  } catch {
    res.clearCookie(env.AUTH_COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }
}
