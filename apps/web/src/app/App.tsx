import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoadingState } from '../components/feedback/LoadingState';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { SubjectsPage } from '../pages/SubjectsPage';
import { PlannerPage } from '../pages/PlannerPage';
import { QuizzesPage } from '../pages/QuizzesPage';
import { FlashcardsPage } from '../pages/FlashcardsPage';
import { BrainGymPage } from '../pages/BrainGymPage';
import { MoodPage } from '../pages/MoodPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StudyPage } from '../pages/StudyPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export type NavItem = {
  id: string;
  label: string;
  description: string;
  path: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Overview and quick actions', path: '/' },
  {
    id: 'subjects',
    label: 'Subjects',
    description: 'Course structure and focus areas',
    path: '/subjects',
  },
  {
    id: 'study',
    label: 'Study Timer',
    description: 'Pomodoro and focus sessions',
    path: '/study',
  },
  {
    id: 'planner',
    label: 'Study Planner',
    description: 'Organize sessions and timelines',
    path: '/planner',
  },
  {
    id: 'mood',
    label: 'Mood',
    description: 'Check-ins and motivation',
    path: '/mood',
  },
  { id: 'quizzes', label: 'Quizzes', description: 'Practice and assessments', path: '/quizzes' },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Spaced repetition review',
    path: '/flashcards',
  },
  {
    id: 'brain-gym',
    label: 'Brain Gym',
    description: 'Warm-up exercises and focus drills',
    path: '/brain-gym',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Display and UI preferences',
    path: '/settings',
  },
];

function NotFoundPage() {
  return (
    <div className="page-stack">
      <h2>Page not found</h2>
      <p className="page-description">
        The page you requested is not part of the current SmartStudy AI v2.0.0 UI foundation.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to dashboard
      </Link>
    </div>
  );
}

function ProtectedLayout({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = useMemo(() => {
    const normalizedPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
    return navItems.find((item) => item.path === normalizedPath) ?? navItems[0];
  }, [location.pathname]);

  return (
    <AppShell
      navItems={navItems}
      activePage={currentPage.id}
      onNavigate={(itemId) => {
        const selectedItem = navItems.find((item) => item.id === itemId);
        if (selectedItem) {
          navigate(selectedItem.path);
        }
        setMobileOpen(false);
      }}
      currentPage={currentPage}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      onLogout={onLogout}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      userName={user.name.split(' ')[0] || user.name}
    >
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              onNavigate={(pageId) =>
                navigate(navItems.find((item) => item.id === pageId)?.path ?? '/')
              }
            />
          }
        />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/mood" element={<MoodPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/brain-gym" element={<BrainGymPage />} />
        <Route path="/settings" element={<SettingsPage theme={theme} onThemeChange={setTheme} />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const payload = (await response.json()) as {
        success?: boolean;
        data?: AuthUser;
      };

      setUser(payload.success && payload.data ? payload.data : null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    void fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore logout errors so the UI still clears the local session state
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  if (authLoading) {
    return (
      <AppShell
        navItems={navItems}
        activePage="dashboard"
        currentPage={navItems[0]}
        onNavigate={() => undefined}
        theme="light"
        onToggleTheme={() => undefined}
        mobileOpen={false}
        onMobileOpenChange={() => undefined}
        userName="Student"
      >
        <LoadingState label="Checking authentication..." />
      </AppShell>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onAuthenticated={() => void fetchCurrentUser()} />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <RegisterPage onAuthenticated={() => void fetchCurrentUser()} />
          )
        }
      />
      <Route
        path="/*"
        element={
          user ? (
            <ProtectedLayout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
