import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Lesson } from '../lib/schemas';

export const HomePage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    let active = true;
    db.lessons
      .toArray()
      .then((items) => {
        if (!active) return;
        const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title));
        setLessons(sorted);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-6" aria-labelledby="home-heading">
      <header className="space-y-2">
        <h1 id="home-heading" className="text-3xl font-bold">Study Spanish Coach</h1>
        <p className="text-lg" aria-live="polite">
          Track mastery, practise verbs, and stay ready for C1 presentations—even offline.
        </p>
      </header>

      <div>
        <h2 className="text-xl font-semibold" id="lesson-list-heading">Lessons</h2>
        <nav aria-labelledby="lesson-list-heading">
          <ul className="divide-y" role="list">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="py-3">
                <Link
                  to={`/lessons/${lesson.slug}`}
                  className="font-medium text-blue-700 underline focus-visible:ring"
                >
                  {lesson.title}
                </Link>
                <div className="text-sm text-gray-600" aria-label={`Tags for ${lesson.title}`}>
                  {lesson.tags.join(', ')}
                </div>
              </li>
            ))}
            {lessons.length === 0 && (
              <li className="py-3 text-sm" aria-live="polite">
                No lessons imported yet. Use the Content Manager to add the latest content drop.
              </li>
            )}
          </ul>
        </nav>
      </div>

      <aside className="bg-gray-100 p-4 rounded" aria-label="Quick actions">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>
            <Link to="/dashboard" className="text-blue-700 underline focus-visible:ring">
              Review your progress dashboard
            </Link>
          </li>
          <li>
            <Link to="/flashcards" className="text-blue-700 underline focus-visible:ring">
              Drill high-priority flashcards
            </Link>
          </li>
          <li>
            <Link to="/content-manager" className="text-blue-700 underline focus-visible:ring">
              Import a new JSON content drop
            </Link>
          </li>
        </ul>
      </aside>
    </section>
  );
};

export default HomePage;
