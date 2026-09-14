import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

type LoginPayload = {
  email: string;
  password: string;
};

type LoginPageProps = {
  onAuthenticated: () => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<LoginPayload>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formValues),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? 'Unable to sign in.');
      }

      onAuthenticated();
      navigate('/');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to sign in right now. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-content">
      <div className="page-stack" style={{ maxWidth: '480px', margin: '0 auto' }}>
        <Card title="Welcome back">
          <p className="page-description" style={{ marginBottom: '1rem' }}>
            Sign in to continue using your SmartStudy AI workspace.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span>Email</span>
              <input
                type="email"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="student@example.com"
                required
              />
            </label>

            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span>Password</span>
              <input
                type="password"
                value={formValues.password}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="At least 8 characters"
                required
              />
            </label>

            {error ? <p className="error-state">{error}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Card>

        <p className="page-description" style={{ textAlign: 'center' }}>
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </main>
  );
}
