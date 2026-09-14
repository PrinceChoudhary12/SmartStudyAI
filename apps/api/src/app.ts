import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api', healthRouter);

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API ERROR]', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});
