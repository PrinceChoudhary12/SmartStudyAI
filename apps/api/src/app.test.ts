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

describe('Quiz and flashcard API', () => {
  beforeEach(async () => {
    await prisma.flashcardProgress.deleteMany();
    await prisma.flashcard.deleteMany();
    await prisma.flashcardDeck.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.moodEntry.deleteMany();
    await prisma.studySession.deleteMany();
    await prisma.note.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();
  });

  async function registerUser(email: string) {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Quiz User',
      email,
      password: 'password123',
    });

    return {
      cookie: response.headers['set-cookie'][0].split(';')[0],
      user: response.body.data,
    };
  }

  it('rejects unauthenticated quiz access and allows authenticated quiz creation', async () => {
    const unauthenticatedResponse = await request(app).get('/api/quizzes');
    expect(unauthenticatedResponse.status).toBe(401);

    const { cookie } = await registerUser('quiz-owner@example.com');
    const subjectResponse = await request(app)
      .post('/api/subjects')
      .set('Cookie', cookie)
      .send({ name: 'Chemistry', description: 'atoms and molecules', color: '#7c3aed' });

    const response = await request(app)
      .post('/api/quizzes')
      .set('Cookie', cookie)
      .send({
        title: 'Chemistry basics',
        description: 'Check your chemistry knowledge.',
        subjectId: subjectResponse.body.data.id,
        questions: [
          {
            questionText: 'Water is H2O.',
            questionType: 'true_false',
            correctAnswer: true,
            options: ['true', 'false'],
            points: 2,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.questions).toHaveLength(1);

    const listResponse = await request(app).get('/api/quizzes').set('Cookie', cookie);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
  });

  it('calculates quiz attempts on the server and keeps answers private before completion', async () => {
    const { cookie } = await registerUser('quiz-attempt@example.com');

    const quizResponse = await request(app)
      .post('/api/quizzes')
      .set('Cookie', cookie)
      .send({
        title: 'Math check',
        questions: [
          {
            questionText: '2 + 2 = 4?',
            questionType: 'true_false',
            correctAnswer: true,
            options: ['true', 'false'],
            points: 5,
          },
          {
            questionText: 'What is 3 * 2?',
            questionType: 'single_choice',
            correctAnswer: '6',
            options: ['5', '6', '7'],
            points: 5,
          },
        ],
      });

    const quizId = quizResponse.body.data.id;

    const attemptResponse = await request(app)
      .post(`/api/quizzes/${quizId}/attempts`)
      .set('Cookie', cookie)
      .send({
        answers: [
          { questionId: quizResponse.body.data.questions[0].id, answer: true },
          { questionId: quizResponse.body.data.questions[1].id, answer: '6' },
        ],
      });

    expect(attemptResponse.status).toBe(201);
    expect(attemptResponse.body.data.score).toBe(10);
    expect(attemptResponse.body.data.totalPoints).toBe(10);
    expect(attemptResponse.body.data.percentage).toBe(100);
    expect(attemptResponse.body.data).not.toHaveProperty('correctAnswers');
  });

  it('rejects invalid answer IDs and empty quiz attempts safely', async () => {
    const { cookie } = await registerUser('quiz-validation@example.com');

    const quizResponse = await request(app)
      .post('/api/quizzes')
      .set('Cookie', cookie)
      .send({
        title: 'Validation quiz',
        questions: [
          {
            questionText: 'The sun is hot.',
            questionType: 'true_false',
            correctAnswer: true,
            options: ['true', 'false'],
            points: 3,
          },
        ],
      });

    expect(quizResponse.status).toBe(201);

    const badIdResponse = await request(app)
      .post(`/api/quizzes/${quizResponse.body.data.id}/attempts`)
      .set('Cookie', cookie)
      .send({
        answers: [{ questionId: 'invalid-question-id', answer: true }],
      });

    expect(badIdResponse.status).toBe(400);
    expect(badIdResponse.body.message).toBe('Invalid question IDs.');

    const emptyQuizResponse = await request(app).post('/api/quizzes').set('Cookie', cookie).send({
      title: 'Empty quiz draft',
    });

    expect(emptyQuizResponse.status).toBe(201);

    const emptyAttemptResponse = await request(app)
      .post(`/api/quizzes/${emptyQuizResponse.body.data.id}/attempts`)
      .set('Cookie', cookie)
      .send({ answers: [] });

    expect(emptyAttemptResponse.status).toBe(400);
    expect(emptyAttemptResponse.body.message).toBe('Quiz has no questions to grade.');
  });

  it('enforces flashcard deck ownership and updates review progress', async () => {
    const { cookie: cookieA } = await registerUser('deck-owner@example.com');
    const { cookie: cookieB } = await registerUser('deck-rival@example.com');

    const deckResponse = await request(app)
      .post('/api/flashcard-decks')
      .set('Cookie', cookieA)
      .send({
        title: 'Biology deck',
        cards: [{ front: 'What is ATP?', back: 'Cellular energy currency', hint: 'Energy' }],
      });

    const listResponse = await request(app).get('/api/flashcard-decks').set('Cookie', cookieB);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);

    const reviewResponse = await request(app)
      .post(`/api/flashcards/${deckResponse.body.data.cards[0].id}/review`)
      .set('Cookie', cookieA)
      .send({ result: 'good' });

    expect(reviewResponse.status).toBe(200);
    expect(reviewResponse.body.data.reviewCount).toBeGreaterThanOrEqual(1);
    expect(reviewResponse.body.data.status).toBe('learning');
  });
});
