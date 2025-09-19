import { Exercise } from './schemas';

const normalize = (s: string) =>
  s.toLowerCase()
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '') // remove diacritics but keep ñ
   .replace(/ñ/g, 'ñ')
   .trim()
   .replace(/\s+/g, ' ');

const levenshtein = (a: string, b: string): number => {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : Math.min(dp[i-1][j-1]+1, dp[i][j-1]+1, dp[i-1][j]+1);
  return dp[a.length][b.length];
};

export const gradeAnswer = (exercise: Exercise, userAnswer: any) => {
  const normAns = (v: string) => normalize(v);
  const expected = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
  const user = Array.isArray(userAnswer) ? userAnswer : [userAnswer];

  if (exercise.type === 'conjugate') {
    let correct = 0;
    const total = expected.length;
    expected.forEach((e, i) => {
      const u = user[i] ?? '';
      const dist = levenshtein(normAns(e), normAns(u));
      if ((u.length <= 6 && dist <= 1) || (u.length > 6 && dist <= 2) || normAns(e) === normAns(u))
        correct++;
    });
    return { isCorrect: correct === total, score: (correct/total)*100 };
  }

  let correct = 0;
  expected.forEach(e => {
    if (user.some(u => {
      const dist = levenshtein(normAns(e), normAns(u));
      return (u.length <= 6 && dist <= 1) || (u.length > 6 && dist <= 2) || normAns(e) === normAns(u);
    })) correct++;
  });

  return { isCorrect: correct === expected.length, score: (correct/expected.length)*100 };
};
