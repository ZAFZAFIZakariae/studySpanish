import React, { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Exercise, Grade } from '../lib/schemas';
import { gradeAnswer } from '../lib/grader';
import { db } from '../db';
import { ConjugationTable } from './ConjugationTable';
import styles from './ExerciseEngine.module.css';

interface ExerciseEngineProps {
  exercise: Exercise;
  onGrade?: (grade: Grade) => void;
}

export const ExerciseEngine: React.FC<ExerciseEngineProps> = ({ exercise, onGrade }) => {
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
  const [showHints, setShowHints] = useState(false);
  const [showRubric, setShowRubric] = useState(false);

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

    setFeedback(
      result.isCorrect
        ? `✅ Correct! Score ${(result.score ?? 0).toFixed(0)}%`
        : `❌ Try again. Score ${(result.score ?? 0).toFixed(0)}%`
    );
    setStartTime(Date.now());
    setAttempts(result.isCorrect ? 0 : attemptCount);

    const gradeRecord: Grade = {
      id: `${exercise.id}-${now}`,
      exerciseId: exercise.id,
      userAnswer,
      isCorrect: result.isCorrect,
      score: result.score,
      attempts: attemptCount,
      timeMs: elapsed,
      gradedAt: new Date(now).toISOString(),
      syncedAt: undefined,
    };

    await db.grades.add(gradeRecord);

    onGrade?.(gradeRecord);

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
        <fieldset className={styles.answerSurface} aria-label="Answer choices">
          <legend className="ui-section__tag">{isMulti ? 'Choose all that apply' : 'Choose one option'}</legend>
          <div className={styles.options}>
            {(exercise.options ?? []).map((option) => {
              const checked = selectedOptions.includes(option);
              return (
                <label
                  key={option}
                  className={`${styles.option} ${checked ? styles.optionSelected : ''}`}
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
                  <span className={styles.optionIndicator} aria-hidden="true">
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
        <div className={styles.answerSurface}>
          <ConjugationTable expected={expectedArray} values={tableValues} onChange={setTableValues} />
        </div>
      );
    }

    return (
      <div className={styles.answerSurface}>
        <input
          className={styles.textInput}
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
      </div>
    );
  };

  return (
    <div className={styles.exercise} aria-live="polite">
      <div className={styles.exerciseMeta}>
        {exercise.meta?.difficulty && (
          <span className="ui-chip ui-chip--muted">{exercise.meta.difficulty}</span>
        )}
        {exercise.meta?.skills?.map((skill) => (
          <span key={skill} className="ui-chip ui-chip--outline">
            {skill}
          </span>
        ))}
        {exercise.meta?.topic && <span className={styles.topicBadge}>{exercise.meta.topic}</span>}
      </div>
      <div className={styles.prompt}>
        <div className="prose">
          <ReactMarkdown>{exercise.promptMd}</ReactMarkdown>
        </div>
      </div>
      {renderInput()}
      <div className={styles.buttonRow}>
        <button type="button" onClick={submit} className={styles.submitButton}>
          Submit answer →
        </button>
        <p className="ui-section__tag">Press Enter to submit</p>
      </div>
      {feedback && (
        <div
          role="status"
          aria-live="assertive"
          className={`${styles.feedback} ${feedback.includes('Correct') ? styles.feedbackSuccess : styles.feedbackError}`}
        >
          {feedback}
        </div>
      )}
      {(exercise.feedback?.hints?.length || exercise.rubric) && (
        <div className={styles.supportRow}>
          {exercise.feedback?.hints?.length ? (
            <button type="button" className={styles.supportButton} onClick={() => setShowHints((prev) => !prev)}>
              {showHints ? 'Hide hints' : `Show hints (${exercise.feedback.hints.length})`}
            </button>
          ) : null}
          {exercise.rubric ? (
            <button type="button" className={styles.supportButton} onClick={() => setShowRubric((prev) => !prev)}>
              {showRubric ? 'Hide rubric' : 'Show rubric'}
            </button>
          ) : null}
        </div>
      )}
      {showHints && exercise.feedback?.hints && (
        <ul className={styles.hintList} aria-label="Hints">
          {exercise.feedback.hints.map((hint, index) => (
            <li key={`${hint}-${index}`}>{hint}</li>
          ))}
        </ul>
      )}
      {showRubric && exercise.rubric && (
        <div className={styles.rubric} aria-label="Rubric">
          <ReactMarkdown>{exercise.rubric}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};
