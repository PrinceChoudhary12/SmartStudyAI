import { useMemo, useState } from 'react';
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
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Overview and quick actions' },
  { id: 'subjects', label: 'Subjects', description: 'Course structure and focus areas' },
  { id: 'planner', label: 'Study Planner', description: 'Organize sessions and timelines' },
  { id: 'quizzes', label: 'Quizzes', description: 'Practice and assessments' },
  { id: 'flashcards', label: 'Flashcards', description: 'Spaced repetition review' },
  { id: 'brain-gym', label: 'Brain Gym', description: 'Warm-up exercises and focus drills' },
  { id: 'settings', label: 'Settings', description: 'Display and UI preferences' },
];

export default function App() {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = useMemo(
    () => navItems.find((item) => item.id === activePage) ?? navItems[0],
    [activePage],
  );

  const renderPage = () => {
    switch (activePage) {
      case 'subjects':
        return <SubjectsPage />;
      case 'planner':
        return <PlannerPage />;
      case 'quizzes':
        return <QuizzesPage />;
      case 'flashcards':
        return <FlashcardsPage />;
      case 'brain-gym':
        return <BrainGymPage />;
      case 'settings':
        return <SettingsPage theme={theme} onThemeChange={setTheme} />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <AppShell
      navItems={navItems}
      activePage={activePage}
      onNavigate={(itemId) => {
        setActivePage(itemId);
        setMobileOpen(false);
      }}
      currentPage={currentPage}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      userName="Student"
    >
      {renderPage()}
    </AppShell>
  );
}
