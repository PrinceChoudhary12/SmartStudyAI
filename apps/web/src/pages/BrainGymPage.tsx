import { Card } from '../components/ui/Card';

const exercises = [
  { title: 'Pattern recognition', detail: 'Quick visual matching exercise' },
  { title: 'Memory recall', detail: 'Short sequence memory challenge' },
  { title: 'Focus sprint', detail: 'Timed attention and reflection exercise' },
];

export function BrainGymPage() {
  return (
    <div className="page-stack">
      <h2>Brain Gym</h2>
      <p className="page-description">
        Brain-training games and exercises are planned for a future milestone.
      </p>
      <div className="cards-grid">
        {exercises.map((exercise) => (
          <Card key={exercise.title} title={exercise.title}>
            <p>{exercise.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
