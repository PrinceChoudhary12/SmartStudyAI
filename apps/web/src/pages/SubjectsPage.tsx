import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';

const subjects = [
  { name: 'Mathematics', progress: '78%' },
  { name: 'Biology', progress: '63%' },
  { name: 'History', progress: '52%' },
];

export function SubjectsPage() {
  return (
    <div className="page-stack">
      <h2>Subjects</h2>
      <p className="page-description">
        Subject organization and progress tracking will be added in a future milestone.
      </p>
      <div className="cards-grid">
        {subjects.map((subject) => (
          <Card key={subject.name} title={subject.name}>
            <div className="progress-block">
              <div className="progress-meta">
                <span>Progress</span>
                <strong>{subject.progress}</strong>
              </div>
              <div className="progress-bar" aria-hidden="true">
                <span style={{ width: subject.progress }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <EmptyState
        title="No subject details yet"
        description="This page is a placeholder for the future course management experience."
      />
    </div>
  );
}
