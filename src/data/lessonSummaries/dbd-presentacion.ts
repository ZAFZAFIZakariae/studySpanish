import { LessonSummaryContent } from '../../types/subject';

export const dbdPresentacionSummary: LessonSummaryContent = {
  summary: {
    original:
      'Presentamos el sílabo unidad por unidad, explicamos la ponderación de teoría, prácticas y proyecto, y repasamos el calendario de entregas y herramientas que usaremos.',
    english:
      'We walked through the syllabus unit by unit (sílabo por unidades), explained the grading split across theory, labs, and project (ponderación de teoría, prácticas y proyecto), and reviewed the deliverable calendar and tooling (calendario de entregas y herramientas).',
  },
  translation: {
    status: 'partial',
    summary:
      'Native Spanish summary is available; an English draft is being edited with subject terminology cross-checks.',
    notes:
      'Focus on aligning terminology for the Oracle toolchain before releasing the English version to students.',
    vocabulary: [
      { term: 'sílabo', translation: 'syllabus outline' },
      { term: 'ponderación', translation: 'grading weight', note: 'Breakdown across theory, labs, and project' },
      { term: 'entrega', translation: 'submission', note: 'Usually graded deliverables in the lab component' },
    ],
    milestones: [
      { label: 'Glossary review', date: '2024-04-05' },
      { label: 'Draft English summary', date: '2024-04-08' },
      { label: 'Faculty approval window', date: '2024-04-12' },
    ],
  },
};
