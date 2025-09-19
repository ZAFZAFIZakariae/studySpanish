import React, { useState } from 'react';
import { Exercise } from '../lib/schemas';
import { gradeAnswer } from '../lib/grader';
import { db } from '../db';

export const ExerciseEngine: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const [input, setInput] = useState<any>('');
  const [feedback, setFeedback] = useState<string>('');

  const submit = async () => {
    const result = gradeAnswer(exercise, input);
    setFeedback(result.isCorrect ? '✅ Correct!' : '❌ Try again.');
    await db.grades.add({
      id: `${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      userAnswer: input,
      isCorrect: result.isCorrect,
      score: result.score,
      attempts: 1,
      timeMs: 0,
      gradedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-2">
      <div dangerouslySetInnerHTML={{ __html: exercise.promptMd }} />
      <input
        className="border rounded p-2 w-full"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button onClick={submit} className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
      {feedback && <div>{feedback}</div>}
    </div>
  );
};
