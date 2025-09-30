export type SubjectLanguage = 'en' | 'es';

export type TranslationStatus = 'complete' | 'partial' | 'machine' | 'planned';

export interface TranslationMilestone {
  label: string;
  date: string;
}

export interface TranslationVocabularyEntry {
  term: string;
  translation: string;
  note?: string;
}

export interface TranslationSupport {
  status: TranslationStatus;
  summary?: string;
  notes?: string;
  glossary?: string[];
  vocabulary?: TranslationVocabularyEntry[];
  milestones?: TranslationMilestone[];
}

export type CourseItemKind = 'lesson' | 'reading' | 'assignment' | 'lab' | 'project';

export type CourseItemStatus = 'not-started' | 'in-progress' | 'submitted' | 'graded' | 'blocked' | 'scheduled';

export interface CourseItem {
  id: string;
  kind: CourseItemKind;
  title: string;
  language: SubjectLanguage;
  summary: {
    original: string;
    english?: string;
  };
  content?: {
    original: string;
    english?: string;
  };
  tags: string[];
  estimatedMinutes?: number;
  dueDate?: string;
  status?: CourseItemStatus;
  translation?: TranslationSupport;
  lab?: {
    environment: string;
    checklists: string[];
    deliverable?: string;
  };
  notebook?: {
    id: string;
    path: string;
    colabUrl?: string;
  };
}

export type LessonSummaryContent = Pick<CourseItem, 'summary' | 'translation' | 'content'>;

export interface CheatPaperSection {
  title: string;
  bullets: string[];
}

export interface CheatPaper {
  id: string;
  title: string;
  language: SubjectLanguage;
  coverage: 'full-course' | 'unit' | 'labs';
  description: string;
  englishSummary: string;
  spanishSummary?: string;
  sections: CheatPaperSection[];
  studyTips: string[];
  downloadHint?: string;
}

export interface SubjectCourse {
  id: string;
  code?: string;
  title: string;
  description: string;
  modality: 'lecture' | 'lab' | 'seminar' | 'project';
  schedule: string;
  languageMix: SubjectLanguage[];
  focusAreas: string[];
  items: CourseItem[];
  cheatPapers?: CheatPaper[];
}

export interface SubjectSummary {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: {
    en: string;
    es?: string;
  };
  languageProfile: {
    primary: SubjectLanguage;
    supportLevel: 'complete' | 'partial' | 'planned';
    notes: string;
  };
  credits: number;
  skills: string[];
  focusAreas: string[];
  color: string;
  courses: SubjectCourse[];
  reflectionPrompts: string[];
}

export interface SubjectMetrics {
  subject: SubjectSummary;
  totalItems: number;
  assignments: number;
  labs: number;
  translationCoverage: number;
  englishReady: number;
  spanishOnly: number;
  upcoming: CourseItem[];
  overdue: CourseItem[];
}
