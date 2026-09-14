import { Card } from '../components/ui/Card';

const cards = [
  {
    question: 'What is photosynthesis?',
    answer: 'The process plants use to convert light energy into chemical energy.',
  },
  { question: 'What is the derivative of x²?', answer: '2x' },
  { question: 'Who wrote the Declaration of Independence?', answer: 'Thomas Jefferson' },
];

export function FlashcardsPage() {
  return (
    <div className="page-stack">
      <h2>Flashcards</h2>
      <p className="page-description">
        Flashcard drills and spaced repetition are a later roadmap milestone.
      </p>
      <div className="cards-grid">
        {cards.map((card) => (
          <Card key={card.question} title={card.question}>
            <p>{card.answer}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
