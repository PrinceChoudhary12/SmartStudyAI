import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

type Mood = 'happy' | 'focused' | 'calm' | 'tired' | 'stressed' | 'sad' | 'excited';

type MoodEntry = {
  id: string;
  mood: Mood;
  note?: string | null;
  createdAt: string;
};

const quotes: Record<Mood, string> = {
  happy: 'Your progress is proof that consistency creates momentum.',
  focused: 'One clear goal is worth a hundred scattered tasks.',
  calm: 'A calm mind helps you absorb what matters most.',
  tired: 'Rest is part of progress. Protect your energy and keep going gently.',
  stressed: 'Small steady steps will get you through this session.',
  sad: 'Even difficult days can still contain meaningful learning.',
  excited: 'Channel that energy into one focused next step.',
};

const moodOptions: Mood[] = ['happy', 'focused', 'calm', 'tired', 'stressed', 'sad', 'excited'];

export function MoodPage() {
  const [selectedMood, setSelectedMood] = useState<Mood>('focused');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const loadEntries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/moods`, { credentials: 'include' });
      if (!response.ok) return;
      const payload = (await response.json()) as { data?: MoodEntry[] };
      setEntries(payload.data ?? []);
    } catch {
      // ignore load failures for the mood page
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/moods`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: selectedMood, note: note.trim() || undefined }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setStatusMessage(payload.message ?? 'Unable to save mood right now.');
        return;
      }

      setStatusMessage('Mood saved.');
      setNote('');
      await loadEntries();
    } catch {
      setStatusMessage('Unable to save mood right now.');
    }
  };

  return (
    <div className="page-stack">
      <section className="welcome-panel">
        <div>
          <p className="eyebrow accent">Mood check-in</p>
          <h2>How are you feeling today?</h2>
          <p>
            Static curated motivation keeps the experience lightweight while supporting a healthy
            study rhythm.
          </p>
        </div>
      </section>

      <div className="content-grid">
        <Card title="Check in">
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {moodOptions.map((mood) => (
                <Button
                  key={mood}
                  type="button"
                  variant={selectedMood === mood ? 'primary' : 'secondary'}
                  onClick={() => setSelectedMood(mood)}
                >
                  {mood}
                </Button>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="Optional note about your study energy or mindset"
              style={{ width: '100%', resize: 'vertical' }}
            />

            <Button type="button" onClick={handleSave}>
              Save mood
            </Button>

            {statusMessage ? (
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>{statusMessage}</p>
            ) : null}
          </div>
        </Card>

        <Card title="Motivation">
          <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>{quotes[selectedMood]}</p>

          <h3>Recent mood entries</h3>
          <ul className="list-panel" style={{ paddingLeft: 0 }}>
            {entries.length === 0 ? <p>No recent mood entries yet.</p> : null}
            {entries.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.mood}</strong>
                  <p>{entry.note ?? 'No note recorded.'}</p>
                </div>
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
