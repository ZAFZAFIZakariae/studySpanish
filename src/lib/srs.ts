import { Flashcard } from './schemas';

export const updateSRS = (card: Flashcard, success: boolean) => {
  const now = new Date();
  const bucket = success ? Math.min((card.srs?.bucket ?? 0)+1, 5) : 0;
  const days = [0,1,3,7,14,30][bucket];
  const nextDue = new Date(now.getTime() + days*86400000).toISOString();
  return {
    ...card,
    srs: { bucket, lastReview: now.toISOString(), nextDue }
  };
};

export const isDue = (card: Flashcard) => {
  if (!card.srs?.nextDue) return true;
  return new Date(card.srs.nextDue) <= new Date();
};
