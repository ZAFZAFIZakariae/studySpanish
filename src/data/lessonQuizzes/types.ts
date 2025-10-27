export type MultipleChoiceOption = {
  id: string;
  label: string;
};

export type MultipleChoiceQuestion = {
  id: string;
  type: 'mcq';
  prompt: string;
  options: MultipleChoiceOption[];
  answer: string;
  explanation?: string;
};

export type TrueFalseQuestion = {
  id: string;
  type: 'true-false';
  prompt: string;
  answer: boolean;
  explanation?: string;
};

export type MatchingPair = {
  id: string;
  left: string;
  right: string;
};

export type MatchingQuestion = {
  id: string;
  type: 'matching';
  prompt: string;
  pairs: MatchingPair[];
  options?: string[];
  explanation?: string;
};

export type QuizQuestion = MultipleChoiceQuestion | TrueFalseQuestion | MatchingQuestion;

export type LessonQuizDefinition = {
  id: string;
  title: string;
  introduction?: string;
  questions: QuizQuestion[];
};
