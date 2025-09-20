import { Exercise } from './schemas';

const ENYE_PLACEHOLDER = '__~enye~__';
const ENYE_PLACEHOLDER_UPPER = '__~ENYE~__';

const preserveEnye = (value: string) =>
  value
    .replace(/ñ/g, ENYE_PLACEHOLDER)
    .replace(/Ñ/g, ENYE_PLACEHOLDER_UPPER);

const restoreEnye = (value: string) =>
  value
    .replace(new RegExp(ENYE_PLACEHOLDER, 'g'), 'ñ')
    .replace(new RegExp(ENYE_PLACEHOLDER_UPPER, 'g'), 'Ñ');

const stripInvertedPunctuation = (value: string) => value.replace(/[¡¿]/g, '');

const stripDiacritics = (value: string) =>
  restoreEnye(
    preserveEnye(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  );

const baseNormalize = (value: string, collapseSpaces = true) => {
  let processed = stripInvertedPunctuation(stripDiacritics(value)).toLowerCase();
  processed = processed.trim();
  return collapseSpaces ? processed.replace(/\s+/g, ' ') : processed;
};

const normalize = (value: string) => baseNormalize(value, true);

const sanitizeRegexSource = (pattern: string) => baseNormalize(pattern, false);

const levenshtein = (a: string, b: string): number => {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j - 1] + 1, dp[i][j - 1] + 1, dp[i - 1][j] + 1);
  return dp[a.length][b.length];
};

const matchWithTolerance = (expected: string, received: string) => {
  if (!received) return false;
  if (expected === received) return true;
  const expectedHasEnye = expected.includes('ñ');
  const receivedHasEnye = received.includes('ñ');
  if (expectedHasEnye !== receivedHasEnye) return false;
  const distance = levenshtein(expected, received);
  const threshold = received.length <= 6 ? 1 : 2;
  return distance <= threshold;
};

const createAcceptedMatchers = (accepted: string[] = []) => {
  const anchored: RegExp[] = [];
  const keywords: RegExp[] = [];

  accepted.forEach((entry) => {
    const rawPattern = entry.startsWith('re:') ? entry.slice(3) : entry;
    const pattern = sanitizeRegexSource(rawPattern);
    const regex = new RegExp(pattern, 'i');
    if (/^\^.*\$$/.test(pattern.trim())) anchored.push(regex);
    else keywords.push(regex);
  });

  return { anchored, keywords };
};

const matchesAccepted = (value: string, matchers: ReturnType<typeof createAcceptedMatchers> | null) => {
  if (!matchers) return false;
  const normalizedValue = normalize(value);

  if (matchers.anchored.some((regex) => regex.test(normalizedValue))) {
    return true;
  }

  if (matchers.keywords.length) {
    return matchers.keywords.every((regex) => regex.test(normalizedValue));
  }

  return false;
};

const asArray = (value: unknown) => (Array.isArray(value) ? value : [value]);

export const gradeAnswer = (exercise: Exercise, userAnswer: unknown) => {
  const expected = asArray(exercise.answer).map((value) => normalize(String(value ?? '')));
  const user = asArray(userAnswer).map((value) => String(value ?? ''));

  const matchers = exercise.accepted?.length ? createAcceptedMatchers(exercise.accepted) : null;

  if (exercise.type === 'conjugate') {
    let correct = 0;
    expected.forEach((expectedForm, index) => {
      const attempt = normalize(user[index] ?? '');
      if (matchWithTolerance(expectedForm, attempt)) {
        correct++;
        return;
      }
      if (matchers && matchesAccepted(user[index] ?? '', matchers)) {
        correct++;
      }
    });
    const score = expected.length ? (correct / expected.length) * 100 : 0;
    return { isCorrect: correct === expected.length, score };
  }

  if (exercise.type === 'multi') {
    const matched = new Set<number>();
    let correct = 0;
    let incorrectSelections = 0;

    user.forEach((attemptRaw) => {
      const attempt = normalize(attemptRaw);
      const matchIndex = expected.findIndex((expectedValue, index) =>
        !matched.has(index) && matchWithTolerance(expectedValue, attempt)
      );
      if (matchIndex >= 0) {
        matched.add(matchIndex);
        correct++;
      } else if (!(matchers && matchesAccepted(attemptRaw, matchers))) {
        incorrectSelections++;
      }
    });

    const total = expected.length + incorrectSelections;
    const score = total ? (correct / total) * 100 : 0;
    return { isCorrect: correct === expected.length && incorrectSelections === 0, score };
  }

  let correctCount = 0;
  expected.forEach((expectedValue) => {
    const matched = user.some((attemptRaw) => {
      const attempt = normalize(attemptRaw);
      if (matchWithTolerance(expectedValue, attempt)) {
        return true;
      }
      if (expected.length === 1 && matchers) {
        return matchesAccepted(attemptRaw, matchers);
      }
      return false;
    });

    if (matched) {
      correctCount++;
    }
  });

  if (correctCount === 0 && expected.length === 1 && matchers) {
    const combined = user.join(' ');
    if (matchesAccepted(combined, matchers)) {
      correctCount = 1;
    }
  }

  const score = expected.length ? (correctCount / expected.length) * 100 : 0;
  return { isCorrect: correctCount === expected.length, score };
};
