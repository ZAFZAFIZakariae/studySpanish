import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../db';
import { Exercise, Lesson } from '../lib/schemas';
import { LessonViewer } from '../components/LessonViewer';
import { ExerciseEngine } from '../components/ExerciseEngine';

const LessonPage: React.FC = () => {
  const { slug } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    const load = async () => {
      const found = await db.lessons.where('slug').equals(slug).first();
      if (!active) return;
      if (!found) {
        setStatus('missing');
        return;
      }
      setLesson(found);
      const lessonExercises = await db.exercises.where('lessonId').equals(found.id).toArray();
      if (!active) return;
      setExercises(lessonExercises);
      setStatus('ready');
    };
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (status === 'loading') {
    return (
      <p role="status" className="italic">
        Loading lesson…
      </p>
    );
  }

  if (status === 'missing' || !lesson) {
    return (
      <p role="alert" className="text-red-600">
        Lesson not found. Import the latest content drop to continue.
      </p>
    );
  }

  return (
    <article className="space-y-6" aria-labelledby="lesson-title">
      <header className="space-y-2">
        <h1 id="lesson-title" className="text-2xl font-bold">
          {lesson.title}
        </h1>
        <p className="text-sm text-gray-600" aria-label="Lesson tags">
          {lesson.tags.join(', ')}
        </p>
      </header>

      <LessonViewer markdown={lesson.markdown} />

      <section className="space-y-4" aria-labelledby="lesson-exercises-heading">
        <h2 id="lesson-exercises-heading" className="text-xl font-semibold">
          Practise the lesson
        </h2>
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="border rounded p-4 shadow-sm"
            aria-label={`Exercise ${exercise.id}`}
          >
            <ExerciseEngine exercise={exercise} />
          </div>
        ))}
        {exercises.length === 0 && (
          <p role="status" className="italic">
            No exercises found for this lesson yet.
          </p>
        )}
      </section>
    </article>
  );
};

export default LessonPage;
