import { useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { SubjectsPage } from '../pages/SubjectsPage';
import { PlannerPage } from '../pages/PlannerPage';
import { QuizzesPage } from '../pages/QuizzesPage';
import { FlashcardsPage } from '../pages/FlashcardsPage';
import { BrainGymPage } from '../pages/BrainGymPage';
import { SettingsPage } from '../pages/SettingsPage';

export type NavItem = {
  id: string;
  label: string;
  description: string;
  path: string;
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
    id: 'planner',
    label: 'Study Planner',
    description: 'Organize sessions and timelines',
    path: '/planner',
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

function AppRoutes() {
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
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      userName="Student"
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
        <Route path="/planner" element={<PlannerPage />} />
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

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
