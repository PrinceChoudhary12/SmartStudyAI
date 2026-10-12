import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

type DashboardPageProps = {
  onNavigate: (pageId: string) => void;
};

const activityItems = [
  { title: 'Math revision', detail: 'Completed 3 practice problems', time: '2 hours ago' },
  { title: 'Biology notes', detail: 'Updated chapter summary', time: 'Yesterday' },
  { title: 'Pomodoro session', detail: 'Finished a 35-minute focus sprint', time: 'Last week' },
];

const upcomingItems = [
  { title: 'Chemistry recap', time: 'Today • 4:30 PM' },
  { title: 'History flashcard review', time: 'Tomorrow • 9:00 AM' },
  { title: 'Algebra check-in', time: 'Friday • 1:15 PM' },
];

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="page-stack">
      <section className="welcome-panel">
        <div>
          <p className="eyebrow accent">Foundation UI</p>
          <h2>Welcome to SmartStudy AI</h2>
          <p>
            This dashboard is a clean UI foundation for the upcoming learning platform. Real data
            and AI features are intentionally not implemented yet.
          </p>
        </div>
        <Badge tone="info">Prototype dashboard</Badge>
      </section>

      <section className="stats-grid" aria-label="Study summary">
        <Card className="stat-card">
          <p>Study time</p>
          <strong>5h 30m</strong>
          <small>Demo value</small>
        </Card>
        <Card className="stat-card">
          <p>Tasks completed</p>
          <strong>18</strong>
          <small>Demo value</small>
        </Card>
        <Card className="stat-card">
          <p>Current streak</p>
          <strong>7 days</strong>
          <small>Demo value</small>
        </Card>
        <Card className="stat-card">
          <p>Learning progress</p>
          <strong>82%</strong>
          <small>Demo value</small>
        </Card>
      </section>

      <section className="quick-actions" aria-label="Quick actions">
        <Button type="button" onClick={() => onNavigate('subjects')}>
          Explore Subjects
        </Button>
        <Button type="button" variant="secondary" onClick={() => onNavigate('planner')}>
          Open Study Planner
        </Button>
        <Button type="button" variant="secondary" onClick={() => onNavigate('quizzes')}>
          Practice Quizzes
        </Button>
        <Button type="button" variant="ghost" onClick={() => onNavigate('flashcards')}>
          Review Flashcards
        </Button>
      </section>

      <section className="content-grid">
        <Card title="Recent activity">
          <ul className="list-panel">
            {activityItems.map((item) => (
              <li key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span>{item.time}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Upcoming study">
          <ul className="list-panel">
            {upcomingItems.map((item) => (
              <li key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                </div>
                <span>{item.time}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
