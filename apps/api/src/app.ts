import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { studyRouter } from './routes/study.js';

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', authRouter);
app.use('/api', healthRouter);
app.use('/api', studyRouter);

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API ERROR]', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});
