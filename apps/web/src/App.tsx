import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

type HealthResponse = {
  appName: string;
  status: string;
  environment: string;
  timestamp: string;
};

export default function App() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as HealthResponse;
        setHealth(data);
        setStatus('success');
      } catch (requestError) {
        setStatus('error');
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to reach the SmartStudy AI backend.',
        );
      }
    };

    void fetchHealth();
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Learning platform foundation</p>
        <h1>SmartStudy AI</h1>
        <div className="status-row">
          <span className={`status-badge ${status}`}>
            {status === 'loading' ? 'Checking' : status}
          </span>
          <span className="status-text">
            {status === 'loading' && 'Foundation is running'}
            {status === 'success' && 'Foundation is running'}
            {status === 'error' && 'Connection issue'}
          </span>
        </div>

        {status === 'loading' && <p className="muted">Starting core services…</p>}

        {status === 'error' && error && <p className="error-message">{error}</p>}

        {status === 'success' && health && (
          <div className="health-panel">
            <p>
              <strong>App:</strong> {health.appName}
            </p>
            <p>
              <strong>Status:</strong> {health.status}
            </p>
            <p>
              <strong>Environment:</strong> {health.environment}
            </p>
            <p>
              <strong>Timestamp:</strong> {health.timestamp}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
