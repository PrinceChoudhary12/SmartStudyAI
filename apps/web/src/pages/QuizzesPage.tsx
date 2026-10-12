import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';

const quizSets = [
  { title: 'Algebra basics', level: 'Beginner' },
  { title: 'World history quiz', level: 'Intermediate' },
  { title: 'Biology review', level: 'Advanced' },
];

export function QuizzesPage() {
  return (
    <div className="page-stack">
      <h2>Quizzes</h2>
      <p className="page-description">
        Interactive quiz generation and assessment flows are planned for a future milestone.
      </p>
      <div className="cards-grid">
        {quizSets.map((quiz) => (
          <Card key={quiz.title} title={quiz.title}>
            <p>Difficulty: {quiz.level}</p>
          </Card>
        ))}
      </div>
      <EmptyState
        title="No quiz engine yet"
        description="This placeholder page is included so the UI structure is ready for the future quiz experience."
      />
    </div>
  );
}
