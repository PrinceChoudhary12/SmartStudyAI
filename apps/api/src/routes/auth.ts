import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { comparePassword, createAuthToken, getCookieOptions, hashPassword } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildPublicUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

authRouter.post('/auth/register', async (req, res) => {
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid name, email, and password.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { name, email, password } = parseResult.data;
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with that email already exists.',
    });
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
    });

    const token = createAuthToken({ userId: user.id, email: user.email });
    res.cookie(env.AUTH_COOKIE_NAME, token, getCookieOptions());

    return res.status(201).json({
      success: true,
      data: buildPublicUser(user),
      message: 'Registration successful.',
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Unable to create your account right now.',
    });
  }
});

authRouter.post('/auth/login', async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email and password.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parseResult.data;
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const matchesPassword = await comparePassword(password, user.passwordHash);

  if (!matchesPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const token = createAuthToken({ userId: user.id, email: user.email });
  res.cookie(env.AUTH_COOKIE_NAME, token, getCookieOptions());

  return res.status(200).json({
    success: true,
    data: buildPublicUser(user),
    message: 'Login successful.',
  });
});

authRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie(env.AUTH_COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
  return res.status(200).json({
    success: true,
    message: 'Logout successful.',
  });
});

authRouter.get('/auth/me', requireAuth, async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
      createdAt: req.user?.createdAt,
      updatedAt: req.user?.updatedAt,
    },
  });
});

export { authRouter };
