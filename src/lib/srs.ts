import { Flashcard } from './schemas';

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60, 90, 180, 365];

const clampBucket = (value: number) => {
  if (Number.isNaN(value) || value < 0) return 0;
  return Math.min(value, INTERVAL_DAYS.length - 1);
};

const nextBucketForGrade = (current: number, grade: ReviewGrade) => {
  switch (grade) {
    case 'again':
      return 0;
    case 'hard':
      return clampBucket(Math.max(current - 1, 1));
    case 'good':
      return clampBucket(current + 1);
    case 'easy':
      return clampBucket(current + 2);
    default:
      return clampBucket(current);
  }
};

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export const updateSRS = (card: Flashcard, grade: ReviewGrade) => {
  const now = new Date();
  const currentBucket = clampBucket(card.srs?.bucket ?? 0);
  const nextBucket = nextBucketForGrade(currentBucket, grade);
  const intervalDays = INTERVAL_DAYS[nextBucket] ?? 0;
  const nextDue = addDays(now, intervalDays);

  const streak = grade === 'again' ? 0 : (card.srs?.streak ?? 0) + 1;

  return {
    ...card,
    srs: {
      bucket: nextBucket,
      lastReview: now.toISOString(),
      nextDue: nextDue.toISOString(),
      streak,
      lastGrade: grade,
    },
  };
};

export const isDue = (card: Flashcard) => {
  if (!card.srs?.nextDue) return true;
  return new Date(card.srs.nextDue) <= new Date();
};

export const describeDueStatus = (card: Flashcard) => {
  if (!card.srs?.nextDue) return 'New';
  const dueDate = new Date(card.srs.nextDue);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Due now';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
};

export const summarizeBuckets = (cards: Flashcard[]) => {
  const summary = new Map<number, { total: number; due: number }>();
  cards.forEach((card) => {
    const bucket = clampBucket(card.srs?.bucket ?? 0);
    const entry = summary.get(bucket) ?? { total: 0, due: 0 };
    entry.total += 1;
    if (isDue(card)) entry.due += 1;
    summary.set(bucket, entry);
  });
  return Array.from(summary.entries())
    .map(([bucket, stats]) => ({ bucket, ...stats }))
    .sort((a, b) => a.bucket - b.bucket);
};
