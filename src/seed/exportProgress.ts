import { db } from '../db';

/**
 * Exports the user's progress as a JSON file:
 * - All grades (full attempt history)
 * - All flashcards SRS state
 * Returns the exported object for optional in-app use.
 */
export async function exportProgress(filename = 'progress-export.json') {
  const [grades, flashcards] = await Promise.all([
    db.grades.toArray(),
    db.flashcards.toArray(),
  ]);

  const payload = {
    appVersion: import.meta.env?.VITE_APP_VERSION ?? 'dev',
    exportedAt: new Date().toISOString(),
    counts: {
      grades: grades.length,
      flashcards: flashcards.length,
    },
    grades,
    flashcards,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return payload;
}
