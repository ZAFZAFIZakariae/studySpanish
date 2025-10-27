import React, { useEffect, useMemo, useState } from 'react';
import {
  LessonQuizDefinition,
  MatchingQuestion,
  MultipleChoiceQuestion,
  QuizQuestion,
  TrueFalseQuestion,
} from '@/data/lessonQuizzes/types';
import styles from './SummaryQuiz.module.css';

type QuestionStatus = 'unanswered' | 'correct' | 'incorrect';

type SummaryQuizProps = {
  quiz: LessonQuizDefinition;
  onClose?: () => void;
};

type BaseQuestionCardProps<T extends QuizQuestion> = {
  question: T;
  onStatusChange: (id: string, status: QuestionStatus) => void;
};

const createInitialMatchingSelection = (question: MatchingQuestion) =>
  question.pairs.reduce<Record<string, string>>((acc, pair) => {
    acc[pair.id] = '';
    return acc;
  }, {});

const MultipleChoiceCard: React.FC<BaseQuestionCardProps<MultipleChoiceQuestion | TrueFalseQuestion>> = ({
  question,
  onStatusChange,
}) => {
  const options = useMemo(() => {
    if (question.type === 'true-false') {
      return [
        { id: 'true', label: 'Verdadero (True)' },
        { id: 'false', label: 'Falso (False)' },
      ];
    }
    return question.options;
  }, [question]);

  const correctOption = useMemo(() => {
    if (question.type === 'true-false') {
      return question.answer ? 'Verdadero (True)' : 'Falso (False)';
    }
    return question.options.find((option) => option.id === question.answer)?.label ?? '';
  }, [question]);

  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState<QuestionStatus>('unanswered');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected('');
    setStatus('unanswered');
    setAttempts(0);
    setError(null);
    onStatusChange(question.id, 'unanswered');
  }, [onStatusChange, question]);

  const handleChange = (value: string) => {
    setSelected(value);
    setError(null);
    if (status !== 'unanswered') {
      setStatus('unanswered');
      onStatusChange(question.id, 'unanswered');
    }
  };

  const handleCheck = () => {
    if (!selected) {
      setError('Selecciona una opción antes de comprobar tu respuesta.');
      return;
    }
    const normalizedAnswer = question.type === 'true-false' ? (question.answer ? 'true' : 'false') : question.answer;
    const isCorrect = selected === normalizedAnswer;
    setStatus(isCorrect ? 'correct' : 'incorrect');
    setAttempts((prev) => prev + 1);
    onStatusChange(question.id, isCorrect ? 'correct' : 'incorrect');
  };

  const handleReset = () => {
    setSelected('');
    setStatus('unanswered');
    setAttempts(0);
    setError(null);
    onStatusChange(question.id, 'unanswered');
  };

  return (
    <li className={styles.questionCard}>
      <p className={styles.questionPrompt}>{question.prompt}</p>
      <ul className={styles.optionList}>
        {options.map((option) => (
          <li key={option.id} className={styles.optionItem}>
            <input
              type="radio"
              id={`${question.id}-${option.id}`}
              name={question.id}
              value={option.id}
              checked={selected === option.id}
              onChange={(event) => handleChange(event.target.value)}
            />
            <label className={styles.optionLabel} htmlFor={`${question.id}-${option.id}`}>
              {option.label}
            </label>
          </li>
        ))}
      </ul>
      <div className={styles.questionActions}>
        <button type="button" className="ui-button ui-button--primary" onClick={handleCheck}>
          Comprobar respuesta
        </button>
        <button type="button" className="ui-button ui-button--ghost" onClick={handleReset}>
          Reiniciar
        </button>
        {status !== 'unanswered' && (
          <span
            role="status"
            className={`${styles.feedback} ${status === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect}`}
          >
            {status === 'correct' ? '¡Correcto!' : 'Revisa la respuesta.'}
          </span>
        )}
        {attempts > 0 && (
          <span className={styles.quizProgress}>Intentos: {attempts}</span>
        )}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      {attempts > 0 && (
        <p className={styles.correctAnswer}>
          Respuesta correcta: <strong>{correctOption}</strong>
          {question.explanation ? ` · ${question.explanation}` : ''}
        </p>
      )}
    </li>
  );
};

const MatchingCard: React.FC<BaseQuestionCardProps<MatchingQuestion>> = ({ question, onStatusChange }) => {
  const options = useMemo(() => {
    const base = question.options ?? question.pairs.map((pair) => pair.right);
    return [...new Set(base)].sort((a, b) => a.localeCompare(b, 'es')); // deterministic order
  }, [question.options, question.pairs]);

  const [selection, setSelection] = useState<Record<string, string>>(() => createInitialMatchingSelection(question));
  const [status, setStatus] = useState<QuestionStatus>('unanswered');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelection(createInitialMatchingSelection(question));
    setStatus('unanswered');
    setAttempts(0);
    setError(null);
    onStatusChange(question.id, 'unanswered');
  }, [onStatusChange, question]);

  const handleChange = (pairId: string, value: string) => {
    setSelection((prev) => ({ ...prev, [pairId]: value }));
    setError(null);
    if (status !== 'unanswered') {
      setStatus('unanswered');
      onStatusChange(question.id, 'unanswered');
    }
  };

  const handleCheck = () => {
    const allSelected = question.pairs.every((pair) => selection[pair.id]);
    if (!allSelected) {
      setError('Completa todas las asignaciones antes de comprobar tu respuesta.');
      return;
    }
    const isCorrect = question.pairs.every((pair) => selection[pair.id] === pair.right);
    setStatus(isCorrect ? 'correct' : 'incorrect');
    setAttempts((prev) => prev + 1);
    onStatusChange(question.id, isCorrect ? 'correct' : 'incorrect');
  };

  const handleReset = () => {
    setSelection(createInitialMatchingSelection(question));
    setStatus('unanswered');
    setAttempts(0);
    setError(null);
    onStatusChange(question.id, 'unanswered');
  };

  return (
    <li className={styles.questionCard}>
      <p className={styles.questionPrompt}>{question.prompt}</p>
      <div className={styles.matchingGrid}>
        {question.pairs.map((pair) => (
          <div key={pair.id} className={styles.matchRow}>
            <strong>{pair.left}</strong>
            <select
              id={`${question.id}-${pair.id}`}
              className={styles.matchSelect}
              aria-label={`Selecciona la opción que corresponde a ${pair.left}`}
              value={selection[pair.id]}
              onChange={(event) => handleChange(pair.id, event.target.value)}
            >
              <option value="">Selecciona una opción…</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className={styles.questionActions}>
        <button type="button" className="ui-button ui-button--primary" onClick={handleCheck}>
          Comprobar respuesta
        </button>
        <button type="button" className="ui-button ui-button--ghost" onClick={handleReset}>
          Reiniciar
        </button>
        {status !== 'unanswered' && (
          <span
            role="status"
            className={`${styles.feedback} ${status === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect}`}
          >
            {status === 'correct' ? '¡Correcto!' : 'Revisa la respuesta.'}
          </span>
        )}
        {attempts > 0 && (
          <span className={styles.quizProgress}>Intentos: {attempts}</span>
        )}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      {attempts > 0 && (
        <p className={styles.correctAnswer}>
          Respuesta correcta:
          <br />
          {question.pairs.map((pair) => (
            <span key={pair.id}>
              <strong>{pair.left}</strong>: {pair.right}
              <br />
            </span>
          ))}
          {question.explanation ? ` ${question.explanation}` : ''}
        </p>
      )}
    </li>
  );
};

const SummaryQuiz: React.FC<SummaryQuizProps> = ({ quiz, onClose }) => {
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>(() =>
    Object.fromEntries(quiz.questions.map((question) => [question.id, 'unanswered' as QuestionStatus]))
  );

  useEffect(() => {
    setStatuses(Object.fromEntries(quiz.questions.map((question) => [question.id, 'unanswered' as QuestionStatus])));
  }, [quiz]);

  const correctCount = useMemo(
    () => Object.values(statuses).filter((status) => status === 'correct').length,
    [statuses]
  );

  const handleStatusChange = (id: string, status: QuestionStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  return (
    <section className={styles.quizPanel} aria-label={`${quiz.title} · autoevaluación`}>
      <header className={styles.quizHeader}>
        <h4 className={styles.quizTitle}>{quiz.title}</h4>
        {quiz.introduction && <p className={styles.quizIntro}>{quiz.introduction}</p>}
        <p className={styles.quizProgress}>
          Respuestas correctas: {correctCount}/{quiz.questions.length}
        </p>
      </header>
      <ol className={styles.questionList}>
        {quiz.questions.map((question) => {
          if (question.type === 'matching') {
            return (
              <MatchingCard
                key={question.id}
                question={question}
                onStatusChange={handleStatusChange}
              />
            );
          }
          return (
            <MultipleChoiceCard
              key={question.id}
              question={question}
              onStatusChange={handleStatusChange}
            />
          );
        })}
      </ol>
      {onClose && (
        <div className={styles.quizFooter}>
          <button type="button" className="ui-button ui-button--secondary" onClick={onClose}>
            Cerrar test
          </button>
        </div>
      )}
    </section>
  );
};

export default SummaryQuiz;
