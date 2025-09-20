import React, { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Exercise } from '../lib/schemas';
import { gradeAnswer } from '../lib/grader';
import { db } from '../db';
import { ConjugationTable } from './ConjugationTable';

interface ExerciseEngineProps {
  exercise: Exercise;
}

export const ExerciseEngine: React.FC<ExerciseEngineProps> = ({ exercise }) => {
  const expectedArray = useMemo(
    () => (Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer]),
    [exercise.answer]
  );
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [tableValues, setTableValues] = useState<string[]>(expectedArray.map(() => ''));
  const [feedback, setFeedback] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());

  useEffect(() => {
    setInputValue('');
    setSelectedOptions([]);
    setTableValues(expectedArray.map(() => ''));
    setFeedback('');
    setAttempts(0);
    setStartTime(Date.now());
  }, [exercise.id, expectedArray]);

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) => {
      if (exercise.type === 'multi') {
        return prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option];
      }
      return [option];
    });
  };

  const getUserAnswer = () => {
    if (exercise.type === 'multi') return selectedOptions;
    if (exercise.type === 'mcq') return selectedOptions[0] ?? '';
    if (exercise.type === 'conjugate') return tableValues;
    return inputValue;
  };

  const submit = async () => {
    const attemptCount = attempts + 1;
    const now = Date.now();
    const elapsed = now - startTime;
    const userAnswer = getUserAnswer();
    const result = gradeAnswer(exercise, userAnswer);

    setFeedback(result.isCorrect ? '✅ Correct!' : '❌ Try again.');
    setStartTime(Date.now());
    setAttempts(result.isCorrect ? 0 : attemptCount);

    await db.grades.add({
      id: `${exercise.id}-${now}`,
      exerciseId: exercise.id,
      userAnswer,
      isCorrect: result.isCorrect,
      score: result.score,
      attempts: attemptCount,
      timeMs: elapsed,
      gradedAt: new Date(now).toISOString(),
      syncedAt: undefined,
    });

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const syncManager = (registration as ServiceWorkerRegistration & {
          sync?: { register: (tag: string) => Promise<void> };
        }).sync;
        syncManager?.register('sync-grades').catch(() => undefined);
        registration.active?.postMessage({ type: 'SYNC_GRADES' });
      } catch (error) {
        console.warn('Background sync unavailable', error);
      }
    }

    if (result.isCorrect) {
      setInputValue('');
      setSelectedOptions([]);
      setTableValues(expectedArray.map(() => ''));
    }
  };

  const renderInput = () => {
    if (exercise.type === 'mcq' || exercise.type === 'multi') {
      const isMulti = exercise.type === 'multi';
      return (
        <fieldset className="space-y-4" aria-label="Answer choices">
          <legend className="text-sm font-semibold text-slate-700">
            Choose {isMulti ? 'all that apply' : 'one option'}
          </legend>
          <div className="grid gap-2">
            {(exercise.options ?? []).map((option) => {
              const checked = selectedOptions.includes(option);
              return (
                <label
                  key={option}
                  className={`group relative flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    checked
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                      : 'border-slate-200/80 bg-white/90 text-slate-700 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    name={`exercise-${exercise.id}`}
                    value={option}
                    checked={checked}
                    onChange={() => toggleOption(option)}
                    className="sr-only"
                  />
                  <span>{option}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs transition ${
                      checked
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    }

    if (exercise.type === 'conjugate') {
      return (
        <ConjugationTable expected={expectedArray} values={tableValues} onChange={setTableValues} />
      );
    }

    return (
      <input
        className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-inner transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        value={inputValue}
        aria-label="Your answer"
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
    );
  };

  return (
    <div className="space-y-5" aria-live="polite">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{exercise.promptMd}</ReactMarkdown>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-inner">
        {renderInput()}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 focus-visible:ring"
        >
          Submit answer
          <span aria-hidden="true">→</span>
        </button>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Press Enter to submit</p>
      </div>
      {feedback && (
        <div
          role="status"
          aria-live="assertive"
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedback.includes('Correct')
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback}
        </div>
      )}
    </div>
  );
};
