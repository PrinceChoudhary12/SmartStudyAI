import { Card } from '../components/ui/Card';

const schedule = [
  { label: 'Math focus block', time: '9:00 AM - 10:15 AM' },
  { label: 'Essay review', time: '1:00 PM - 2:00 PM' },
  { label: 'Science recap', time: '7:00 PM - 7:45 PM' },
];

export function PlannerPage() {
  return (
    <div className="page-stack">
      <h2>Study Planner</h2>
      <p className="page-description">
        Planning tools and time-block management will be implemented in a later milestone.
      </p>
      <div className="cards-grid">
        {schedule.map((item) => (
          <Card key={item.label} title={item.label}>
            <p>{item.time}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
