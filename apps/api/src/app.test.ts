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
    await prisma.moodEntry.deleteMany();
    await prisma.studySession.deleteMany();
    await prisma.note.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.subject.deleteMany();
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

describe('Study management API', () => {
  beforeEach(async () => {
    await prisma.moodEntry.deleteMany();
    await prisma.studySession.deleteMany();
    await prisma.note.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();
  });

  async function registerUser(email: string) {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Study User',
      email,
      password: 'password123',
    });
    return {
      cookie: response.headers['set-cookie'][0].split(';')[0],
      user: response.body.data,
    };
  }

  it('creates and lists subjects for the authenticated user', async () => {
    const { cookie } = await registerUser('subject@example.com');

    const createResponse = await request(app).post('/api/subjects').set('Cookie', cookie).send({
      name: 'Mathematics',
      description: 'Algebra and calculus',
      color: '#2563eb',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.name).toBe('Mathematics');

    const listResponse = await request(app).get('/api/subjects').set('Cookie', cookie);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
  });

  it('creates a study session and prevents cross-user access', async () => {
    const { cookie: cookieA } = await registerUser('sessionA@example.com');
    const { cookie: cookieB } = await registerUser('sessionB@example.com');

    const subjectResponse = await request(app)
      .post('/api/subjects')
      .set('Cookie', cookieA)
      .send({ name: 'Biology', description: 'Cell structure', color: '#16a34a' });

    const createResponse = await request(app)
      .post('/api/study-sessions')
      .set('Cookie', cookieA)
      .send({
        subjectId: subjectResponse.body.data.id,
        sessionType: 'focus',
        durationSeconds: 1800,
        completed: true,
      });

    expect(createResponse.status).toBe(201);

    const listResponse = await request(app).get('/api/study-sessions').set('Cookie', cookieB);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it('creates a valid mood entry and rejects invalid mood values', async () => {
    const { cookie } = await registerUser('mood@example.com');

    const validResponse = await request(app).post('/api/moods').set('Cookie', cookie).send({
      mood: 'focused',
      note: 'Ready to study.',
    });

    expect(validResponse.status).toBe(201);
    expect(validResponse.body.data.mood).toBe('focused');

    const invalidResponse = await request(app).post('/api/moods').set('Cookie', cookie).send({
      mood: 'unknown',
      note: 'bad mood',
    });

    expect(invalidResponse.status).toBe(400);
  });
});
