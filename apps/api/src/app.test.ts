import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { prisma } from './lib/prisma.js';

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

describe('Auth API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('registers a new user successfully', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Alice Student',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Registration successful.');
    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      name: 'Alice Student',
      email: 'alice@example.com',
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('smartstudy_session=')]),
    );
  });

  it('rejects invalid registration input', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'invalid-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Please provide a valid name, email, and password.');
  });

  it('rejects duplicate emails', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice Student',
      email: 'alice@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Alice Again',
      email: 'alice@example.com',
      password: 'anotherpass',
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('An account with that email already exists.');
  });

  it('logs in successfully and returns the authenticated user', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice Student',
      email: 'alice@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      name: 'Alice Student',
      email: 'alice@example.com',
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid login credentials without revealing the reason', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice Student',
      email: 'alice@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'wrongpassword',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password.');
  });

  it('returns 401 for unauthenticated /api/auth/me requests', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication required.');
  });

  it('returns the authenticated user from /api/auth/me', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Alice Student',
      email: 'alice@example.com',
      password: 'password123',
    });

    const cookie = registerResponse.headers['set-cookie'][0].split(';')[0];

    const response = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      name: 'Alice Student',
      email: 'alice@example.com',
    });
  });

  it('clears the auth cookie on logout', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Alice Student',
      email: 'alice@example.com',
      password: 'password123',
    });

    const cookie = registerResponse.headers['set-cookie'][0].split(';')[0];

    const response = await request(app).post('/api/auth/logout').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logout successful.');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('smartstudy_session=;')]),
    );
  });
});
