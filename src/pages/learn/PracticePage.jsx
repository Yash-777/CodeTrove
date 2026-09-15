/**
 * src/pages/learn/PracticePage.jsx
 * ------------------------------------------------------------------
 * Route: /learn/practice
 * Placeholder for exercises/challenges/quizzes tied to topics (the
 * "PRACTICE" branch under LEARN in the structure diagram). Not built
 * yet - each topic would need an exercises array similar in spirit
 * to how `tools` was added per category, checked against a real
 * grading approach (unit tests for code exercises, multiple-choice
 * for quizzes).
 */

export default function PracticePage() {
  return (
    <div className="content-page">
      <h1>Practice</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Not built yet. Planned: exercises and quizzes attached to individual
        topics (similar to how Exercism pairs a concept with a coding exercise),
        plus short multiple-choice quizzes for quick review.
      </p>
    </div>
  );
}
