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
        <fieldset className="space-y-2" aria-label="Answer choices">
          <legend className="font-semibold">Choose {isMulti ? 'all that apply' : 'one option'}</legend>
          <div className="space-y-1">
            {(exercise.options ?? []).map((option) => {
              const checked = selectedOptions.includes(option);
              return (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    name={`exercise-${exercise.id}`}
                    value={option}
                    checked={checked}
                    onChange={() => toggleOption(option)}
                  />
                  <span>{option}</span>
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
        className="border rounded p-2 w-full"
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
    <div className="space-y-3" aria-live="polite">
      <div className="prose max-w-none">
        <ReactMarkdown>{exercise.promptMd}</ReactMarkdown>
      </div>
      {renderInput()}
      <button
        type="button"
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded focus-visible:ring"
      >
        Submit answer
      </button>
      {feedback && (
        <div role="status" aria-live="assertive" className="font-medium">
          {feedback}
        </div>
      )}
    </div>
  );
};
