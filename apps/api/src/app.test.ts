import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('API health check', () => {
  it('returns application health metadata', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      appName: 'SmartStudy AI',
      status: 'ok',
      environment: expect.any(String),
      timestamp: expect.any(String),
    });
  });
});
