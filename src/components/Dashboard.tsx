import React, { useEffect, useState } from 'react';
import { db } from '../db';

export const Dashboard: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Promise.all([db.exercises.count(), db.grades.where('isCorrect').equals(true).count()])
      .then(([total, correct]) => setProgress(total ? (correct/total)*100 : 0));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Dashboard</h2>
      <div className="bg-gray-200 h-4 rounded">
        <div className="bg-green-500 h-4 rounded" style={{ width: `${progress}%` }} />
      </div>
      <p>{progress.toFixed(1)}% mastered</p>
    </div>
  );
};
