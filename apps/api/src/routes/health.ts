import { Router } from 'express';
import { APP_NAME, DEFAULT_ENVIRONMENT } from '@smartstudy-ai/shared';

const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const payload = {
    appName: APP_NAME,
    status: 'ok',
    environment: process.env.NODE_ENV ?? DEFAULT_ENVIRONMENT,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(payload);
});

export { healthRouter };
