import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

type SessionType = 'focus' | 'short_break' | 'long_break';

type StudySession = {
  id: string;
  sessionType: SessionType;
  durationSeconds: number;
  completed: boolean;
  createdAt: string;
  subjectId?: string | null;
  chapterId?: string | null;
};

type Subject = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
};

const defaultDurations: Record<SessionType, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

function formatSeconds(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function StudyPage() {
  const [mode, setMode] = useState<SessionType>('focus');
  const [remainingSeconds, setRemainingSeconds] = useState(defaultDurations.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/subjects`, { credentials: 'include' });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: Subject[] };
        setSubjects(payload.data ?? []);
      } catch {
        // ignore fetch errors for placeholder study timer
      }
    };

    void loadSubjects();
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/study-sessions`, { credentials: 'include' });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: StudySession[] };
        setSessions(payload.data ?? []);
      } catch {
        // ignore fetch errors for placeholder study timer
      }
    };

    void loadSessions();
  }, []);

  const saveCompletedSession = useCallback(async () => {
    try {
      const payload = {
        subjectId: selectedSubjectId || undefined,
        sessionType: mode,
        durationSeconds: defaultDurations[mode],
        completed: true,
      };

      const response = await fetch(`${API_BASE_URL}/study-sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) return;

      const data = (await response.json()) as { data?: StudySession };
      setLastSavedAt(data.data?.createdAt ?? new Date().toISOString());
      const refreshed = await fetch(`${API_BASE_URL}/study-sessions`, { credentials: 'include' });
      if (refreshed.ok) {
        const result = (await refreshed.json()) as { data?: StudySession[] };
        setSessions(result.data ?? []);
      }
    } catch {
      // ignore network errors; UI still keeps local timer state
    }
  }, [mode, selectedSubjectId]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);
          void saveCompletedSession();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, saveCompletedSession]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 'focus':
        return 'Focus';
      case 'short_break':
        return 'Short break';
      case 'long_break':
        return 'Long break';
      default:
        return 'Focus';
    }
  }, [mode]);

  const handleModeChange = (nextMode: SessionType) => {
    setMode(nextMode);
    setRemainingSeconds(defaultDurations[nextMode]);
    setIsRunning(false);
  };

  const toggleRunning = () => {
    setIsRunning((current) => !current);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(defaultDurations[mode]);
  };

  return (
    <div className="page-stack">
      <section className="welcome-panel">
        <div>
          <p className="eyebrow accent">Focus routine</p>
          <h2>Study timer</h2>
          <p>
            Real countdown logic for focus and recovery blocks with authenticated session tracking.
          </p>
        </div>
      </section>

      <div className="content-grid">
        <Card title="Timer">
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['focus', 'short_break', 'long_break'] as SessionType[]).map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={mode === item ? 'primary' : 'secondary'}
                  onClick={() => handleModeChange(item)}
                >
                  {item === 'focus'
                    ? 'Focus'
                    : item === 'short_break'
                      ? 'Short break'
                      : 'Long break'}
                </Button>
              ))}
            </div>

            <div style={{ fontSize: '3rem', fontWeight: 700, textAlign: 'center' }}>
              {formatSeconds(remainingSeconds)}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button type="button" onClick={toggleRunning}>
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetTimer}>
                Reset
              </Button>
            </div>

            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Current mode: <strong>{modeLabel}</strong>
            </p>

            <label style={{ display: 'grid', gap: 8 }}>
              <span>Subject</span>
              <select
                value={selectedSubjectId}
                onChange={(event) => setSelectedSubjectId(event.target.value)}
              >
                <option value="">No subject selected</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            {lastSavedAt ? (
              <small>Last saved session: {new Date(lastSavedAt).toLocaleString()}</small>
            ) : null}
          </div>
        </Card>

        <Card title="Recent sessions">
          <ul className="list-panel" style={{ paddingLeft: 0 }}>
            {sessions.length === 0 ? <p>No sessions saved yet.</p> : null}
            {sessions.slice(0, 5).map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.sessionType}</strong>
                  <p>{session.completed ? 'Completed' : 'In progress'}</p>
                </div>
                <span>{formatSeconds(session.durationSeconds)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
