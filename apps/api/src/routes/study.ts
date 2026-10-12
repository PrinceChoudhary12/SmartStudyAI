import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const studyRouter = Router();
studyRouter.use(requireAuth);

const subjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value?.trim() || undefined),
  color: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
});

const chapterSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value?.trim() || undefined),
  position: z.coerce.number().int().nonnegative().default(0),
});

const noteSchema = z.object({
  subjectId: z.string().trim().min(1).optional(),
  chapterId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(2).max(100),
  content: z.string().trim().min(1).max(20000),
});

const studySessionSchema = z.object({
  subjectId: z.string().trim().min(1).optional(),
  chapterId: z.string().trim().min(1).optional(),
  sessionType: z.enum(['focus', 'short_break', 'long_break']),
  durationSeconds: z.coerce.number().int().positive().max(86400),
  completed: z.boolean().default(false),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

const moodSchema = z.object({
  mood: z.enum(['happy', 'focused', 'calm', 'tired', 'stressed', 'sad', 'excited']),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

async function ensureUserOwnsSubject(userId: string, subjectId?: string | null) {
  if (!subjectId) {
    return null;
  }

  return prisma.subject.findFirst({
    where: {
      id: subjectId,
      userId,
    },
  });
}

async function ensureUserOwnsChapter(userId: string, chapterId?: string | null) {
  if (!chapterId) {
    return null;
  }

  return prisma.chapter.findFirst({
    where: {
      id: chapterId,
      subject: {
        userId,
      },
    },
  });
}

studyRouter.get('/subjects', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ success: true, data: subjects });
});

studyRouter.post('/subjects', async (req, res) => {
  const parseResult = subjectSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid subject name.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const subject = await prisma.subject.create({
    data: {
      userId: req.user!.id,
      ...parseResult.data,
    },
  });

  return res.status(201).json({ success: true, data: subject, message: 'Subject created.' });
});

studyRouter.get('/subjects/:id', async (req, res) => {
  const subject = await prisma.subject.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found.' });
  }

  return res.status(200).json({ success: true, data: subject });
});

studyRouter.patch('/subjects/:id', async (req, res) => {
  const parseResult = subjectSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid subject updates.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const existingSubject = await prisma.subject.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!existingSubject) {
    return res.status(404).json({ success: false, message: 'Subject not found.' });
  }

  const updated = await prisma.subject.update({
    where: { id: req.params.id },
    data: parseResult.data,
  });

  return res.status(200).json({ success: true, data: updated, message: 'Subject updated.' });
});

studyRouter.delete('/subjects/:id', async (req, res) => {
  const subject = await prisma.subject.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found.' });
  }

  await prisma.subject.delete({ where: { id: req.params.id } });

  return res.status(200).json({ success: true, message: 'Subject deleted.' });
});

studyRouter.get('/subjects/:subjectId/chapters', async (req, res) => {
  const subject = await ensureUserOwnsSubject(req.user!.id, req.params.subjectId);

  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found.' });
  }

  const chapters = await prisma.chapter.findMany({
    where: { subjectId: req.params.subjectId },
    orderBy: { position: 'asc' },
  });

  return res.status(200).json({ success: true, data: chapters });
});

studyRouter.post('/subjects/:subjectId/chapters', async (req, res) => {
  const parseResult = chapterSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid chapter data.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const subject = await ensureUserOwnsSubject(req.user!.id, req.params.subjectId);

  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found.' });
  }

  const chapter = await prisma.chapter.create({
    data: {
      subjectId: req.params.subjectId,
      ...parseResult.data,
    },
  });

  return res.status(201).json({ success: true, data: chapter, message: 'Chapter created.' });
});

studyRouter.patch('/chapters/:id', async (req, res) => {
  const parseResult = chapterSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid chapter updates.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const chapter = await ensureUserOwnsChapter(req.user!.id, req.params.id);

  if (!chapter) {
    return res.status(404).json({ success: false, message: 'Chapter not found.' });
  }

  const updated = await prisma.chapter.update({
    where: { id: req.params.id },
    data: parseResult.data,
  });

  return res.status(200).json({ success: true, data: updated, message: 'Chapter updated.' });
});

studyRouter.delete('/chapters/:id', async (req, res) => {
  const chapter = await ensureUserOwnsChapter(req.user!.id, req.params.id);

  if (!chapter) {
    return res.status(404).json({ success: false, message: 'Chapter not found.' });
  }

  await prisma.chapter.delete({ where: { id: req.params.id } });

  return res.status(200).json({ success: true, message: 'Chapter deleted.' });
});

studyRouter.get('/notes', async (req, res) => {
  const notes = await prisma.note.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
  });

  return res.status(200).json({ success: true, data: notes });
});

studyRouter.post('/notes', async (req, res) => {
  const parseResult = noteSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid note data.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { subjectId, chapterId, ...rest } = parseResult.data;

  if (subjectId) {
    const subject = await ensureUserOwnsSubject(req.user!.id, subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
  }

  if (chapterId) {
    const chapter = await ensureUserOwnsChapter(req.user!.id, chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }
  }

  const note = await prisma.note.create({
    data: {
      userId: req.user!.id,
      subjectId: subjectId ?? null,
      chapterId: chapterId ?? null,
      ...rest,
    },
  });

  return res.status(201).json({ success: true, data: note, message: 'Note created.' });
});

studyRouter.get('/notes/:id', async (req, res) => {
  const note = await prisma.note.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!note) {
    return res.status(404).json({ success: false, message: 'Note not found.' });
  }

  return res.status(200).json({ success: true, data: note });
});

studyRouter.patch('/notes/:id', async (req, res) => {
  const parseResult = noteSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid note updates.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const existingNote = await prisma.note.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!existingNote) {
    return res.status(404).json({ success: false, message: 'Note not found.' });
  }

  const { subjectId, chapterId, ...rest } = parseResult.data;

  if (subjectId) {
    const subject = await ensureUserOwnsSubject(req.user!.id, subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
  }

  if (chapterId) {
    const chapter = await ensureUserOwnsChapter(req.user!.id, chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }
  }

  const updated = await prisma.note.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      subjectId: subjectId ?? undefined,
      chapterId: chapterId ?? undefined,
    },
  });

  return res.status(200).json({ success: true, data: updated, message: 'Note updated.' });
});

studyRouter.delete('/notes/:id', async (req, res) => {
  const note = await prisma.note.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!note) {
    return res.status(404).json({ success: false, message: 'Note not found.' });
  }

  await prisma.note.delete({ where: { id: req.params.id } });

  return res.status(200).json({ success: true, message: 'Note deleted.' });
});

studyRouter.get('/study-sessions', async (req, res) => {
  const sessions = await prisma.studySession.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ success: true, data: sessions });
});

studyRouter.post('/study-sessions', async (req, res) => {
  const parseResult = studySessionSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid session data.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { subjectId, chapterId, startedAt, endedAt, ...rest } = parseResult.data;

  if (subjectId) {
    const subject = await ensureUserOwnsSubject(req.user!.id, subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
  }

  if (chapterId) {
    const chapter = await ensureUserOwnsChapter(req.user!.id, chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }
  }

  const session = await prisma.studySession.create({
    data: {
      userId: req.user!.id,
      subjectId: subjectId ?? null,
      chapterId: chapterId ?? null,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      endedAt: endedAt ? new Date(endedAt) : null,
      ...rest,
    },
  });

  return res.status(201).json({ success: true, data: session, message: 'Study session created.' });
});

studyRouter.patch('/study-sessions/:id', async (req, res) => {
  const parseResult = studySessionSchema.partial().safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid session updates.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const session = await prisma.studySession.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Study session not found.' });
  }

  const { subjectId, chapterId, startedAt, endedAt, ...rest } = parseResult.data;

  if (subjectId) {
    const subject = await ensureUserOwnsSubject(req.user!.id, subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
  }

  if (chapterId) {
    const chapter = await ensureUserOwnsChapter(req.user!.id, chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }
  }

  const updated = await prisma.studySession.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      subjectId: subjectId ?? undefined,
      chapterId: chapterId ?? undefined,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      endedAt: endedAt ? new Date(endedAt) : undefined,
    },
  });

  return res.status(200).json({ success: true, data: updated, message: 'Study session updated.' });
});

studyRouter.get('/moods', async (req, res) => {
  const moods = await prisma.moodEntry.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ success: true, data: moods });
});

studyRouter.post('/moods', async (req, res) => {
  const parseResult = moodSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid mood.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const mood = await prisma.moodEntry.create({
    data: {
      userId: req.user!.id,
      ...parseResult.data,
    },
  });

  return res.status(201).json({ success: true, data: mood, message: 'Mood saved.' });
});

export { studyRouter };
