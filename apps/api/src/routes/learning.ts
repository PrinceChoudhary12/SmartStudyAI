import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const learningRouter = Router();
learningRouter.use(requireAuth);

const questionBaseSchema = z.object({
  questionText: z.string().trim().min(2).max(2000),
  questionType: z.enum(['single_choice', 'true_false']),
  options: z.array(z.string().trim().min(1).max(500)).max(6).optional(),
  correctAnswer: z.union([z.string().trim().min(1).max(500), z.boolean()]).optional(),
  explanation: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => value?.trim() || undefined),
  points: z.coerce.number().int().min(1).max(100).default(1),
  order: z.coerce.number().int().min(0).default(0),
});

function validateQuestionQuestion(
  question: z.infer<typeof questionBaseSchema>,
  ctx: z.RefinementCtx,
) {
  const options = question.options ?? [];

  if (question.questionType === 'true_false') {
    if (options.length > 0 && options.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'True/false questions must have exactly two options.',
        path: ['options'],
      });
    }

    const normalizedOptions = options.map((option) => option.trim().toLowerCase());
    if (
      options.length > 0 &&
      normalizedOptions.some((option) => !['true', 'false'].includes(option))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'True/false questions use the values true and false.',
        path: ['options'],
      });
    }

    const resolvedAnswer = question.correctAnswer;
    if (
      typeof resolvedAnswer === 'string' &&
      !['true', 'false'].includes(resolvedAnswer.trim().toLowerCase())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'True/false questions require a boolean or true/false string answer.',
        path: ['correctAnswer'],
      });
    }

    if (typeof resolvedAnswer !== 'boolean' && typeof resolvedAnswer !== 'string') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'True/false questions require a boolean correct answer.',
        path: ['correctAnswer'],
      });
    }
    return;
  }

  if (options.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Multiple-choice questions require at least two options.',
      path: ['options'],
    });
  }

  if (typeof question.correctAnswer !== 'string' || !question.correctAnswer.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Multiple-choice questions require a string correct answer.',
      path: ['correctAnswer'],
    });
  }

  if (question.options && !question.options.includes(String(question.correctAnswer))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'The correct answer must match one of the provided options.',
      path: ['correctAnswer'],
    });
  }
}

const questionSchema = questionBaseSchema.superRefine(validateQuestionQuestion);
const questionUpdateSchema = questionBaseSchema.partial();

const quizSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value?.trim() || undefined),
  subjectId: z.string().trim().min(1).optional().nullable(),
  chapterId: z.string().trim().min(1).optional().nullable(),
  questions: z.array(questionSchema).max(100).default([]),
});

const quizUpdateSchema = quizSchema.partial().extend({
  questions: z.array(questionSchema).max(100).optional(),
});

const answerSchema = z.object({
  questionId: z.string().trim().min(1),
  answer: z.unknown(),
});

const attemptSchema = z.object({
  answers: z.array(answerSchema).default([]),
});

const cardSchema = z.object({
  front: z.string().trim().min(2).max(1000),
  back: z.string().trim().min(2).max(2000),
  hint: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value?.trim() || undefined),
  order: z.coerce.number().int().min(0).default(0),
});

const deckSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value?.trim() || undefined),
  subjectId: z.string().trim().min(1).optional().nullable(),
  chapterId: z.string().trim().min(1).optional().nullable(),
  cards: z.array(cardSchema).max(200).default([]),
});

const reviewSchema = z.object({
  result: z.enum(['again', 'hard', 'good']),
});

function normalizeQuestionData(question: z.infer<typeof questionBaseSchema>) {
  const options = question.options ?? ['True', 'False'];
  const normalizedOptions =
    question.questionType === 'true_false'
      ? ['True', 'False']
      : options.map((option) => String(option).trim());

  return {
    questionText: question.questionText,
    questionType: question.questionType,
    options: normalizedOptions,
    correctAnswer:
      question.questionType === 'true_false'
        ? typeof question.correctAnswer === 'boolean'
          ? question.correctAnswer
          : String(question.correctAnswer ?? 'true')
              .trim()
              .toLowerCase() === 'true'
        : String(question.correctAnswer ?? '').trim(),
    explanation: question.explanation,
    points: question.points,
    order: question.order,
  };
}

function buildPublicQuiz(quiz: {
  id: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  chapterId: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  questions?: Array<{
    id: string;
    questionText: string;
    questionType: 'single_choice' | 'true_false';
    options: unknown;
    correctAnswer: unknown;
    explanation: string | null;
    points: number;
    order: number;
  }>;
}) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    subjectId: quiz.subjectId,
    chapterId: quiz.chapterId,
    ownerId: quiz.ownerId,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    questions: (quiz.questions ?? []).map((question) => ({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: Array.isArray(question.options) ? question.options : [],
      points: question.points,
      order: question.order,
    })),
  };
}

function buildPublicFlashcard(card: {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: card.id,
    front: card.front,
    back: card.back,
    hint: card.hint,
    order: card.order,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

async function ensureOwnsSubject(userId: string, subjectId?: string | null) {
  if (!subjectId) {
    return true;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      userId,
    },
  });

  return Boolean(subject);
}

async function ensureOwnsChapter(userId: string, chapterId?: string | null) {
  if (!chapterId) {
    return true;
  }

  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      subject: {
        userId,
      },
    },
  });

  return Boolean(chapter);
}

async function ensureQuizOwnedByUser(userId: string, quizId: string) {
  return prisma.quiz.findFirst({
    where: {
      id: quizId,
      ownerId: userId,
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });
}

async function ensureDeckOwnedByUser(userId: string, deckId: string) {
  return prisma.flashcardDeck.findFirst({
    where: {
      id: deckId,
      ownerId: userId,
    },
    include: {
      flashcards: {
        orderBy: { order: 'asc' },
      },
    },
  });
}

async function ensureFlashcardOwnedByUser(userId: string, flashcardId: string) {
  return prisma.flashcard.findFirst({
    where: {
      id: flashcardId,
      deck: {
        ownerId: userId,
      },
    },
    include: {
      deck: true,
    },
  });
}

learningRouter.get('/quizzes', async (req, res) => {
  const { subject, chapter, search } = req.query as {
    subject?: string;
    chapter?: string;
    search?: string;
  };

  const quizzes = await prisma.quiz.findMany({
    where: {
      ownerId: req.user!.id,
      ...(subject ? { subjectId: subject } : {}),
      ...(chapter ? { chapterId: chapter } : {}),
      ...(search
        ? {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return res.status(200).json({
    success: true,
    data: quizzes.map((quiz) => ({
      ...buildPublicQuiz(quiz),
      questionCount: quiz.questions.length,
    })),
  });
});

learningRouter.post('/quizzes', async (req, res) => {
  const parseResult = quizSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid quiz data.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { subjectId, chapterId, questions, ...rest } = parseResult.data;

  if (!(await ensureOwnsSubject(req.user!.id, subjectId))) {
    return res.status(404).json({ success: false, message: 'Subject not found.' });
  }

  if (!(await ensureOwnsChapter(req.user!.id, chapterId))) {
    return res.status(404).json({ success: false, message: 'Chapter not found.' });
  }

  const quiz = await prisma.quiz.create({
    data: {
      ownerId: req.user!.id,
      subjectId: subjectId ?? null,
      chapterId: chapterId ?? null,
      ...rest,
      questions: {
        create: questions.map((question, index) => ({
          ...normalizeQuestionData({ ...question, order: question.order || index }),
          order: question.order || index,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Quiz created.',
    data: buildPublicQuiz(quiz),
  });
});

learningRouter.get('/quizzes/:id', async (req, res) => {
  const quiz = await ensureQuizOwnedByUser(req.user!.id, req.params.id);

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found.' });
  }

  return res.status(200).json({ success: true, data: buildPublicQuiz(quiz) });
});

learningRouter.patch('/quizzes/:id', async (req, res) => {
  const parseResult = quizUpdateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid quiz updates.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const existingQuiz = await ensureQuizOwnedByUser(req.user!.id, req.params.id);

  if (!existingQuiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found.' });
  }

  const { subjectId, chapterId, questions, ...rest } = parseResult.data;

  if (subjectId !== undefined && !(await ensureOwnsSubject(req.user!.id, subjectId))) {
    return res.status(404).json({ success: false, message: 'Subject not found.' });
  }

  if (chapterId !== undefined && !(await ensureOwnsChapter(req.user!.id, chapterId))) {
    return res.status(404).json({ success: false, message: 'Chapter not found.' });
  }

  const updatedQuiz = await prisma.quiz.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      subjectId: subjectId ?? existingQuiz.subjectId ?? null,
      chapterId: chapterId ?? existingQuiz.chapterId ?? null,
      ...(questions
        ? {
            questions: {
              deleteMany: {},
              create: questions.map((question, index) => ({
                ...normalizeQuestionData({ ...question, order: question.order || index }),
                order: question.order || index,
              })),
            },
          }
        : {}),
    },
    include: {
      questions: { orderBy: { order: 'asc' } },
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Quiz updated.',
    data: buildPublicQuiz(updatedQuiz),
  });
});

learningRouter.delete('/quizzes/:id', async (req, res) => {
  const existingQuiz = await ensureQuizOwnedByUser(req.user!.id, req.params.id);

  if (!existingQuiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found.' });
  }

  await prisma.quiz.delete({ where: { id: req.params.id } });

  return res.status(200).json({ success: true, message: 'Quiz deleted.' });
});

learningRouter.post('/quizzes/:quizId/questions', async (req, res) => {
  const parseResult = questionSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid question data.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const quiz = await ensureQuizOwnedByUser(req.user!.id, req.params.quizId);

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found.' });
  }

  const nextQuestion = await prisma.quizQuestion.create({
    data: {
      quizId: req.params.quizId,
      ...normalizeQuestionData({
        ...parseResult.data,
        order: parseResult.data.order || quiz.questions.length,
      }),
      order: parseResult.data.order || quiz.questions.length,
    },
  });

  return res.status(201).json({ success: true, data: nextQuestion, message: 'Question added.' });
});

learningRouter.patch('/quiz-questions/:id', async (req, res) => {
  const parseResult = questionUpdateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid question updates.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const question = await prisma.quizQuestion.findFirst({
    where: {
      id: req.params.id,
      quiz: {
        ownerId: req.user!.id,
      },
    },
  });

  if (!question) {
    return res.status(404).json({ success: false, message: 'Question not found.' });
  }

  const updated = await prisma.quizQuestion.update({
    where: { id: req.params.id },
    data: {
      ...parseResult.data,
      ...(parseResult.data.questionType ||
      parseResult.data.options ||
      parseResult.data.correctAnswer
        ? normalizeQuestionData({
            questionText: parseResult.data.questionText ?? question.questionText,
            questionType: parseResult.data.questionType ?? question.questionType,
            options:
              parseResult.data.options ??
              (Array.isArray(question.options)
                ? question.options.filter((option): option is string => typeof option === 'string')
                : []),
            correctAnswer:
              parseResult.data.correctAnswer ??
              (typeof question.correctAnswer === 'boolean' ||
              typeof question.correctAnswer === 'string'
                ? question.correctAnswer
                : undefined),
            explanation:
              parseResult.data.explanation ??
              (typeof question.explanation === 'string' ? question.explanation : undefined),
            points: parseResult.data.points ?? question.points,
            order: parseResult.data.order ?? question.order,
          })
        : {}),
    },
  });

  return res.status(200).json({ success: true, data: updated, message: 'Question updated.' });
});

learningRouter.delete('/quiz-questions/:id', async (req, res) => {
  const question = await prisma.quizQuestion.findFirst({
    where: {
      id: req.params.id,
      quiz: {
        ownerId: req.user!.id,
      },
    },
  });

  if (!question) {
    return res.status(404).json({ success: false, message: 'Question not found.' });
  }

  await prisma.quizQuestion.delete({ where: { id: req.params.id } });

  return res.status(200).json({ success: true, message: 'Question deleted.' });
});

learningRouter.post('/quizzes/:quizId/attempts', async (req, res) => {
  const parseResult = attemptSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid answers.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const quiz = await prisma.quiz.findFirst({
    where: {
      id: req.params.quizId,
      ownerId: req.user!.id,
    },
    include: {
      questions: { orderBy: { order: 'asc' } },
    },
  });

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found.' });
  }

  const validQuestionIds = new Set(quiz.questions.map((question) => question.id));

  if (parseResult.data.answers.some((entry) => !validQuestionIds.has(entry.questionId))) {
    return res.status(400).json({ success: false, message: 'Invalid question IDs.' });
  }

  if (quiz.questions.length === 0) {
    return res.status(400).json({ success: false, message: 'Quiz has no questions to grade.' });
  }

  let score = 0;
  let totalPoints = 0;

  const normalizedAnswers: Array<{
    questionId: string;
    answer: unknown;
    isCorrect: boolean;
    pointsAwarded: number;
  }> = parseResult.data.answers.map((entry) => {
    const question = quiz.questions.find((item) => item.id === entry.questionId);

    if (!question) {
      return {
        questionId: entry.questionId,
        answer: entry.answer,
        isCorrect: false,
        pointsAwarded: 0,
      };
    }

    totalPoints += question.points;

    const userAnswer = entry.answer;
    const correctAnswer = question.correctAnswer;
    const isCorrect =
      question.questionType === 'true_false'
        ? Boolean(userAnswer) === Boolean(correctAnswer)
        : String(userAnswer).trim() === String(correctAnswer).trim();

    if (isCorrect) {
      score += question.points;
    }

    return {
      questionId: question.id,
      answer: userAnswer,
      isCorrect,
      pointsAwarded: isCorrect ? question.points : 0,
    };
  });

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: req.user!.id,
      score,
      totalPoints,
      percentage: totalPoints === 0 ? 0 : Math.round((score / totalPoints) * 100),
      answers: normalizedAnswers as Prisma.InputJsonValue,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Quiz attempt submitted.',
    data: {
      id: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage: attempt.percentage,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() ?? null,
      createdAt: attempt.createdAt.toISOString(),
      answers: normalizedAnswers.map(({ questionId, answer, isCorrect, pointsAwarded }) => ({
        questionId,
        answer,
        isCorrect,
        pointsAwarded,
      })),
    },
  });
});

learningRouter.get('/quizzes/:quizId/attempts', async (req, res) => {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: req.params.quizId,
      ownerId: req.user!.id,
    },
  });

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found.' });
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: req.params.quizId,
      userId: req.user!.id,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({
    success: true,
    data: attempts.map((attempt) => ({
      id: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage: attempt.percentage,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() ?? null,
      createdAt: attempt.createdAt.toISOString(),
    })),
  });
});

learningRouter.get('/quiz-attempts/:id', async (req, res) => {
  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Attempt not found.' });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage: attempt.percentage,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() ?? null,
      createdAt: attempt.createdAt.toISOString(),
      answers: Array.isArray(attempt.answers) ? attempt.answers : [],
    },
  });
});

learningRouter.get('/flashcard-decks', async (req, res) => {
  const { subject, chapter, search } = req.query as {
    subject?: string;
    chapter?: string;
    search?: string;
  };

  const decks = await prisma.flashcardDeck.findMany({
    where: {
      ownerId: req.user!.id,
      ...(subject ? { subjectId: subject } : {}),
      ...(chapter ? { chapterId: chapter } : {}),
      ...(search
        ? {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
    },
    include: {
      flashcards: { orderBy: { order: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return res.status(200).json({
    success: true,
    data: decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: deck.description,
      subjectId: deck.subjectId,
      chapterId: deck.chapterId,
      cardCount: deck.flashcards.length,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    })),
  });
});

learningRouter.post('/flashcard-decks', async (req, res) => {
  const parseResult = deckSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid flashcard deck data.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { subjectId, chapterId, cards, ...rest } = parseResult.data;

  if (!(await ensureOwnsSubject(req.user!.id, subjectId))) {
    return res.status(404).json({ success: false, message: 'Subject not found.' });
  }

  if (!(await ensureOwnsChapter(req.user!.id, chapterId))) {
    return res.status(404).json({ success: false, message: 'Chapter not found.' });
  }

  const deck = await prisma.flashcardDeck.create({
    data: {
      ownerId: req.user!.id,
      subjectId: subjectId ?? null,
      chapterId: chapterId ?? null,
      ...rest,
      flashcards: {
        create: cards.map((card, index) => ({
          front: card.front,
          back: card.back,
          hint: card.hint,
          order: card.order || index,
        })),
      },
    },
    include: {
      flashcards: { orderBy: { order: 'asc' } },
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Flashcard deck created.',
    data: {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      subjectId: deck.subjectId,
      chapterId: deck.chapterId,
      cards: deck.flashcards.map(buildPublicFlashcard),
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    },
  });
});

learningRouter.get('/flashcard-decks/:id', async (req, res) => {
  const deck = await ensureDeckOwnedByUser(req.user!.id, req.params.id);

  if (!deck) {
    return res.status(404).json({ success: false, message: 'Deck not found.' });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      subjectId: deck.subjectId,
      chapterId: deck.chapterId,
      cards: deck.flashcards.map(buildPublicFlashcard),
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    },
  });
});

learningRouter.patch('/flashcard-decks/:id', async (req, res) => {
  const parseResult = deckSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid deck updates.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const existingDeck = await ensureDeckOwnedByUser(req.user!.id, req.params.id);

  if (!existingDeck) {
    return res.status(404).json({ success: false, message: 'Deck not found.' });
  }

  const { cards, ...rest } = parseResult.data;

  const updatedDeck = await prisma.flashcardDeck.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(cards
        ? {
            flashcards: {
              deleteMany: {},
              create: cards.map((card, index) => ({
                front: card.front,
                back: card.back,
                hint: card.hint,
                order: card.order || index,
              })),
            },
          }
        : {}),
    },
    include: {
      flashcards: { orderBy: { order: 'asc' } },
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Deck updated.',
    data: {
      id: updatedDeck.id,
      title: updatedDeck.title,
      description: updatedDeck.description,
      subjectId: updatedDeck.subjectId,
      chapterId: updatedDeck.chapterId,
      cards: updatedDeck.flashcards.map(buildPublicFlashcard),
      createdAt: updatedDeck.createdAt.toISOString(),
      updatedAt: updatedDeck.updatedAt.toISOString(),
    },
  });
});

learningRouter.delete('/flashcard-decks/:id', async (req, res) => {
  const existingDeck = await ensureDeckOwnedByUser(req.user!.id, req.params.id);

  if (!existingDeck) {
    return res.status(404).json({ success: false, message: 'Deck not found.' });
  }

  await prisma.flashcardDeck.delete({ where: { id: req.params.id } });

  return res.status(200).json({ success: true, message: 'Deck deleted.' });
});

learningRouter.post('/flashcard-decks/:deckId/cards', async (req, res) => {
  const parseResult = cardSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid flashcard data.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const deck = await ensureDeckOwnedByUser(req.user!.id, req.params.deckId);

  if (!deck) {
    return res.status(404).json({ success: false, message: 'Deck not found.' });
  }

  const card = await prisma.flashcard.create({
    data: {
      deckId: req.params.deckId,
      front: parseResult.data.front,
      back: parseResult.data.back,
      hint: parseResult.data.hint,
      order: parseResult.data.order || deck.flashcards.length,
    },
  });

  return res
    .status(201)
    .json({ success: true, data: buildPublicFlashcard(card), message: 'Card added.' });
});

learningRouter.patch('/flashcards/:id', async (req, res) => {
  const parseResult = cardSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid flashcard updates.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const card = await ensureFlashcardOwnedByUser(req.user!.id, req.params.id);

  if (!card) {
    return res.status(404).json({ success: false, message: 'Flashcard not found.' });
  }

  const updated = await prisma.flashcard.update({
    where: { id: req.params.id },
    data: parseResult.data,
  });

  return res
    .status(200)
    .json({ success: true, data: buildPublicFlashcard(updated), message: 'Card updated.' });
});

learningRouter.delete('/flashcards/:id', async (req, res) => {
  const card = await ensureFlashcardOwnedByUser(req.user!.id, req.params.id);

  if (!card) {
    return res.status(404).json({ success: false, message: 'Flashcard not found.' });
  }

  await prisma.flashcard.delete({ where: { id: req.params.id } });

  return res.status(200).json({ success: true, message: 'Card deleted.' });
});

learningRouter.get('/flashcard-decks/:deckId/review', async (req, res) => {
  const deck = await ensureDeckOwnedByUser(req.user!.id, req.params.deckId);

  if (!deck) {
    return res.status(404).json({ success: false, message: 'Deck not found.' });
  }

  const queue = await prisma.flashcard.findMany({
    where: {
      deckId: req.params.deckId,
      OR: [
        { progress: { none: {} } },
        { progress: { some: { userId: req.user!.id, nextReviewAt: { lte: new Date() } } } },
      ],
    },
    orderBy: { order: 'asc' },
    include: {
      progress: {
        where: { userId: req.user!.id },
      },
    },
  });

  return res.status(200).json({
    success: true,
    data: queue.map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      order: card.order,
      reviewStatus: card.progress[0]?.status ?? 'new',
      nextReviewAt: card.progress[0]?.nextReviewAt?.toISOString() ?? null,
    })),
  });
});

learningRouter.post('/flashcards/:id/review', async (req, res) => {
  const parseResult = reviewSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid review result.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const card = await ensureFlashcardOwnedByUser(req.user!.id, req.params.id);

  if (!card) {
    return res.status(404).json({ success: false, message: 'Flashcard not found.' });
  }

  const now = new Date();
  const existingProgress = await prisma.flashcardProgress.findUnique({
    where: {
      flashcardId_userId: {
        flashcardId: req.params.id,
        userId: req.user!.id,
      },
    },
  });

  let reviewCount = existingProgress?.reviewCount ?? 0;
  let correctCount = existingProgress?.correctCount ?? 0;
  let incorrectCount = existingProgress?.incorrectCount ?? 0;
  let status = existingProgress?.status ?? 'new';
  let nextReviewAt = existingProgress?.nextReviewAt ?? new Date();

  if (parseResult.data.result === 'again') {
    incorrectCount += 1;
    reviewCount += 1;
    status = 'learning';
    nextReviewAt = new Date(now.getTime() + 15 * 60 * 1000);
  }

  if (parseResult.data.result === 'hard') {
    incorrectCount += 1;
    reviewCount += 1;
    status = 'learning';
    nextReviewAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  if (parseResult.data.result === 'good') {
    correctCount += 1;
    reviewCount += 1;
    status = correctCount >= 2 ? 'mastered' : 'learning';
    nextReviewAt = new Date(now.getTime() + (correctCount >= 2 ? 3 : 1) * 24 * 60 * 60 * 1000);
  }

  const progress = await prisma.flashcardProgress.upsert({
    where: {
      flashcardId_userId: {
        flashcardId: req.params.id,
        userId: req.user!.id,
      },
    },
    update: {
      status,
      reviewCount,
      correctCount,
      incorrectCount,
      nextReviewAt,
      lastReviewedAt: now,
    },
    create: {
      flashcardId: req.params.id,
      userId: req.user!.id,
      status,
      reviewCount,
      correctCount,
      incorrectCount,
      nextReviewAt,
      lastReviewedAt: now,
    },
  });

  return res.status(200).json({
    success: true,
    data: {
      id: progress.id,
      flashcardId: progress.flashcardId,
      userId: progress.userId,
      status: progress.status,
      reviewCount: progress.reviewCount,
      correctCount: progress.correctCount,
      incorrectCount: progress.incorrectCount,
      nextReviewAt: progress.nextReviewAt?.toISOString() ?? null,
      lastReviewedAt: progress.lastReviewedAt?.toISOString() ?? null,
    },
  });
});

learningRouter.get('/flashcards/:id/progress', async (req, res) => {
  const card = await ensureFlashcardOwnedByUser(req.user!.id, req.params.id);

  if (!card) {
    return res.status(404).json({ success: false, message: 'Flashcard not found.' });
  }

  const progress = await prisma.flashcardProgress.findUnique({
    where: {
      flashcardId_userId: {
        flashcardId: req.params.id,
        userId: req.user!.id,
      },
    },
  });

  if (!progress) {
    return res.status(200).json({
      success: true,
      data: {
        flashcardId: req.params.id,
        userId: req.user!.id,
        status: 'new',
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        nextReviewAt: null,
        lastReviewedAt: null,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: progress.id,
      flashcardId: progress.flashcardId,
      userId: progress.userId,
      status: progress.status,
      reviewCount: progress.reviewCount,
      correctCount: progress.correctCount,
      incorrectCount: progress.incorrectCount,
      nextReviewAt: progress.nextReviewAt?.toISOString() ?? null,
      lastReviewedAt: progress.lastReviewedAt?.toISOString() ?? null,
    },
  });
});

export { learningRouter };
