import { CourseItem, ResourceLink, SubjectMetrics, SubjectSummary } from '../types/subject';
import { getLessonContent } from './lessonContents';
import { subjectResourceLibrary } from './subjectResources';

const DAY_IN_MS = 86_400_000;
const now = Date.now();
const toIsoDate = (offsetDays: number) => new Date(now + offsetDays * DAY_IN_MS).toISOString();

const withMinutes = (minutes: number) => minutes;

const resourceLabelOverrides: Record<string, Record<string, string>> = {
  ggo: {
    'Bedell portfolio analysis working paper (PDF)':
      'T3. Alineación de negocio y SI TI. Bedell › Methodology for Business Value Analysis of Innovative IT in a Business Sector. The Case of the Material Supply Chain (PDF)',
    'Método Bedell worksheet (PDF)':
      'T3. Alineación de negocio y SI TI. Bedell › Calcular la imp del stma de información Método Bedell VA 1 (PDF)',
    'Business value analysis methodology case (PDF)':
      'T3. Alineación de negocio y SI TI. Bedell › CiterWP10-SchuurmanBerghoutPowell+Portafolio+IMP (PDF)',
    'Alineación de negocio y TI slides (PDF)':
      'T3. Alineación de negocio y SI TI. Bedell › 22 Alineación (PDF)',
  },
};

const pickResourceLink = (subjectId: string, label: string): ResourceLink => {
  const pool = subjectResourceLibrary[subjectId] ?? [];
  const overrideLabel = resourceLabelOverrides[subjectId]?.[label];
  const lookupLabel = overrideLabel ?? label;
  const match = pool.find((resource) => resource.label === lookupLabel);

  if (!match) {
    if (process.env.NODE_ENV === 'test') {
      return { label, href: '#', type: 'pdf', description: 'Resource unavailable in test environment.' };
    }
    console.warn(`Missing resource "${label}" for subject "${subjectId}"`);
    return {
      label,
      href: '#',
      type: 'pdf',
      description: 'This resource could not be located in the current build.',
    };
  }

  if (overrideLabel) {
    return { ...match, label };
  }

  return { ...match };
};

export const subjectCatalog: SubjectSummary[] = [
  {
    id: 'sad',
    slug: 'distributed-applications-services',
    name: 'Distributed Applications and Services',
    tagline: 'Decks oficiales de las sesiones y notas bilingües sobre servicios distribuidos.',
    description: {
      en: 'Official lecture decks straight from class covering distributed applications and services with English recap notes for each meeting.',
      es: 'Diapositivas oficiales del curso de aplicaciones y servicios distribuidos acompañadas de resúmenes en inglés para cada sesión.',
    },
    languageProfile: {
      primary: 'es',
      supportLevel: 'partial',
      notes: 'Las clases y diapositivas están en español; mantengo apuntes de repaso en inglés para temas distribuidos.',
    },
    credits: 4,
    skills: ['aplicaciones distribuidas', 'documentación técnica', 'modelado de servicios'],
    focusAreas: ['microservicios', 'cloud computing', 'gobernanza de servicios'],
    color: '#f97316',
    reflectionPrompts: [
      '¿Qué trade-offs de calidad detectaste al diseñar la última aplicación distribuida?',
      'Convierte un patrón de servicios clave al inglés con tus propias palabras.',
    ],
    courses: [
      {
        id: 'sad-lectures',
        code: 'SAD-2024',
        title: 'Serie de clases magistrales',
        description: 'Diapositivas y bullet notes oficiales por sesión.',
        modality: 'lecture',
        schedule: 'Martes · Aula 3.2',
        languageMix: ['es'],
        focusAreas: ['microservicios', 'observabilidad', 'servicios en la nube'],
        items: [
          {
            id: 'sad-session-0',
            kind: 'lesson',
            title: 'Sesión 0 · Presentación del curso',
            language: 'es',
            ...getLessonContent('sad-session-0'),
            tags: ['orientación', 'planificación'],
            estimatedMinutes: withMinutes(45),
            dueDate: toIsoDate(-9),
            status: 'graded',
          },
          {
            id: 'sad-session-1',
            kind: 'lesson',
            title: 'Sesión 1 · Introducción y fundamentos',
            language: 'es',
            ...getLessonContent('sad-session-1'),
            tags: ['arquitectura', 'fundamentos'],
            estimatedMinutes: withMinutes(75),
            dueDate: toIsoDate(-2),
            status: 'graded',
          },
          {
            id: 'sad-session-2',
            kind: 'lesson',
            title: 'Sesión 2 · Microservicios y tácticas',
            language: 'es',
            ...getLessonContent('sad-session-2'),
            tags: ['microservicios', 'observabilidad'],
            estimatedMinutes: withMinutes(80),
            dueDate: toIsoDate(5),
            status: 'scheduled',
          },
          {
            id: 'sad-session-3',
            kind: 'lesson',
            title: 'Sesión 3 · Modelos de servicio en la nube',
            language: 'es',
            ...getLessonContent('sad-session-3'),
            tags: ['cloud', 'gobernanza'],
            estimatedMinutes: withMinutes(85),
            dueDate: toIsoDate(12),
            status: 'scheduled',
          },
        ],
      },
    ],
  },
  {
    id: 'ggo',
    slug: 'gobierno-ti',
    name: 'Gobierno de Tecnologías de la Información',
    tagline: 'Material oficial de los temas 1-3 con plantillas de trabajo.',
    description: {
      en: 'Slides and worksheets gathered from the GGO GitHub folder so every topic aligns with the source files.',
      es: 'Diapositivas y plantillas del repositorio de GGO para cubrir los temas 1-3 sin inventar laboratorios.',
    },
    languageProfile: {
      primary: 'es',
      supportLevel: 'partial',
      notes: 'Las diapositivas están en español; creo briefs en inglés para revisar conceptos clave.',
    },
    credits: 5,
    skills: ['gobierno de TI', 'alineación negocio-TI', 'modelos de valor'],
    focusAreas: ['COBIT', 'métricas de valor', 'stakeholders'],
    color: '#0ea5e9',
    reflectionPrompts: [
      'Resume en inglés qué beneficio empresarial entrega cada práctica de gobierno.',
      '¿Qué stakeholder quedó difuso en tu análisis y cómo lo aclararás?',
    ],
    courses: [
      {
        id: 'ggo-modulos',
        code: 'GGO-2024',
        title: 'Módulos de gobierno',
        description: 'Diapositivas oficiales y hojas de trabajo por tema.',
        modality: 'lecture',
        schedule: 'Jueves · Aula 1.5',
        languageMix: ['es'],
        focusAreas: ['COBIT', 'alineación', 'valor de TI'],
        cheatPapers: [
          {
            id: 'ggo-bedell-quick-sheet',
            title: 'Bedell alignment quick sheet',
            language: 'en',
            coverage: 'unit',
            description: 'Track Bedell weighting decisions alongside the official worksheet and working paper.',
            englishSummary:
              'Step-by-step prompts to capture business, organisational, and SI/IT scores in English while reviewing the Bedell portfolio case.',
            sections: [
              {
                title: 'Scoring checklist',
                bullets: [
                  'List the services or systems under evaluation with their owners.',
                  'Record criticality and effectiveness values before applying weights.',
                  'Apply Bedell weighting factors for business, organisation, and SI/IT axes.',
                  'Total each axis and compute the overall priority index.',
                ],
              },
              {
                title: 'Stakeholder cues',
                bullets: [
                  'Link each score to a COBIT objective or governance driver.',
                  'Note stakeholder concerns that could change weighting decisions.',
                  'Capture evidence or metrics you will need for the review board.',
                ],
              },
            ],
            studyTips: [
              'Fill in the sheet while reading the working paper to mirror the sample calculations.',
              'Translate Spanish column headers from the original worksheet into English notes for quick reference.',
            ],
            downloadHint: 'Pair with the Bedell portfolio analysis PDF in Lesson downloads for the numeric walkthrough.',
          },
          {
            id: 'ggo-innovative-value-playbook',
            title: 'Innovative IT value playbook',
            language: 'en',
            coverage: 'unit',
            description: 'Condenses the innovative IT value methodology into a reusable two-phase canvas.',
            englishSummary:
              'Keeps ISO 38500 principles, COBIT practices, Bedell scoring, and IIRA checkpoints aligned when evaluating innovation portfolios.',
            sections: [
              {
                title: 'Planning phase canvas',
                bullets: [
                  'Stakeholders & pain points to address with innovation.',
                  'Guiding principles from ISO 38500 and COBIT to enforce.',
                  'Innovation backlog snapshot with expected value targets.',
                ],
              },
              {
                title: 'Execution scorecard',
                bullets: [
                  'Evidence sources to validate benefits and risks.',
                  'Value metrics and governance checkpoints to monitor.',
                  'Bedell-style weighting to prioritise initiatives.',
                ],
              },
            ],
            studyTips: [
              'Review the playbook before stakeholder interviews to rehearse governance language.',
              'Highlight metrics you can reuse for your own sector and jot them into the scorecard.',
            ],
            downloadHint: 'Use alongside the innovative IT value PDF to capture sector-specific insights.',
          },
        ],
        items: [
          {
            id: 'ggo-tema-1',
            kind: 'lesson',
            title: 'Tema 1 · Introducción a Gobierno de TI',
            language: 'es',
            ...getLessonContent('ggo-tema-1'),
            tags: ['fundamentos', 'COBIT'],
            estimatedMinutes: withMinutes(70),
            dueDate: toIsoDate(-7),
            status: 'graded',
          },
          {
            id: 'ggo-tema-2',
            kind: 'lesson',
            title: 'Tema 2 · Valor de TI',
            language: 'es',
            ...getLessonContent('ggo-tema-2'),
            tags: ['valor', 'métricas'],
            estimatedMinutes: withMinutes(80),
            dueDate: toIsoDate(1),
            status: 'in-progress',
          },
          {
            id: 'ggo-tema-3',
            kind: 'lesson',
            title: 'Tema 3 · Alineación negocio–TI (Método Bedell)',
            language: 'es',
            ...getLessonContent('ggo-tema-3'),
            tags: ['alineación', 'priorización'],
            estimatedMinutes: withMinutes(85),
            dueDate: toIsoDate(8),
            status: 'scheduled',
          },
          {
            id: 'ggo-bedell-ejercicio',
            kind: 'assignment',
            title: 'Ejercicio práctico · Método Bedell',
            language: 'es',
            ...getLessonContent('ggo-bedell-ejercicio'),
            tags: ['alineación', 'worksheet'],
            estimatedMinutes: withMinutes(60),
            dueDate: toIsoDate(9),
            status: 'not-started',
            translation: {
              status: 'planned',
              summary: 'Pendiente de crear instrucciones bilingües.',
            },
          },
          {
            id: 'ggo-stakeholders',
            kind: 'assignment',
            title: 'Plantilla · Análisis de stakeholders 2024',
            language: 'es',
            ...getLessonContent('ggo-stakeholders'),
            tags: ['stakeholders', 'planificación'],
            estimatedMinutes: withMinutes(50),
            dueDate: toIsoDate(6),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'Comentarios en inglés añadidos en cada sección de la plantilla.',
            },
          },
          {
            id: 'ggo-bedell-method-portfolio',
            kind: 'reading',
            title: 'Reading · Bedell method portfolio case',
            language: 'en',
            summary: {
              original:
                "Review the Bedell method through the portfolio working paper and follow the scoring walkthrough to practise prioritising services.",
            },
            tags: ['portfolio analysis', 'governance'],
            estimatedMinutes: withMinutes(55),
            dueDate: toIsoDate(4),
            status: 'in-progress',
            resources: [
              {
                ...pickResourceLink('ggo', 'Bedell portfolio analysis working paper (PDF)'),
                description: 'Original working paper with the full scoring walkthrough.',
              },
              {
                ...pickResourceLink('ggo', 'Método Bedell worksheet (PDF)'),
                description: 'Official Spanish template used during the worked example.',
              },
            ],
          },
          {
            id: 'ggo-innovative-it-value',
            kind: 'reading',
            title: 'Reading · Business value of innovative IT',
            language: 'en',
            summary: {
              original:
                'Study the innovative IT value methodology case to see how ISO 38500, COBIT, Bedell, and IIRA combine for governance decisions.',
            },
            tags: ['value management', 'case study'],
            estimatedMinutes: withMinutes(75),
            dueDate: toIsoDate(11),
            status: 'scheduled',
            resources: [
              {
                ...pickResourceLink('ggo', 'Business value analysis methodology case (PDF)'),
                label: 'Innovative IT value methodology case (PDF)',
                description: 'Conference paper combining ISO 38500, COBIT, Bedell, and IIRA.',
              },
              {
                ...pickResourceLink('ggo', 'Alineación de negocio y TI slides (PDF)'),
                description: 'Spanish lecture deck referenced throughout the case study.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'dbd',
    slug: 'diseno-bases-datos',
    name: 'Diseño de Bases de Datos',
    tagline: 'Teoría y plan de prácticas extraídos del repositorio.',
    description: {
      en: 'Lecture PDFs, question sets, and the official practice plan exactly as stored in GitHub.',
      es: 'PDFs de teoría, baterías de preguntas y plan de prácticas tal como están en GitHub.',
    },
    languageProfile: {
      primary: 'es',
      supportLevel: 'partial',
      notes: 'Material íntegramente en español; añado resúmenes en inglés cuando lo necesito.',
    },
    credits: 6,
    skills: ['modelado relacional', 'normalización', 'SQL'],
    focusAreas: ['diseño conceptual', 'normalización', 'planificación de prácticas'],
    color: '#22c55e',
    reflectionPrompts: [
      '¿Qué regla de normalización puedes explicar ahora en inglés?',
      'Anota un ejemplo de requisito empresarial y diseña su modelo entidad-relación.',
    ],
    courses: [
      {
        id: 'dbd-teoria',
        code: 'DBD-2024',
        title: 'Teoría y prácticas',
        description: 'Recursos oficiales utilizados en clase y en laboratorio.',
        modality: 'lecture',
        schedule: 'Lunes · Aula 2.1',
        languageMix: ['es'],
        focusAreas: ['modelo relacional', 'ejercicios guiados'],
        items: [
          {
            id: 'dbd-presentacion',
            kind: 'lesson',
            title: 'Presentación inicial del curso',
            language: 'es',
            ...getLessonContent('dbd-presentacion'),
            tags: ['orientación'],
            estimatedMinutes: withMinutes(35),
            dueDate: toIsoDate(-10),
            status: 'graded',
          },
          {
            id: 'dbd-tema-1',
            kind: 'lesson',
            title: 'Tema 1 · Diseño conceptual',
            language: 'es',
            ...getLessonContent('dbd-tema-1'),
            tags: ['modelado', 'ER'],
            estimatedMinutes: withMinutes(90),
            dueDate: toIsoDate(-1),
            status: 'graded',
          },
          {
            id: 'dbd-tema-2',
            kind: 'lesson',
            title: 'Tema 2 · Normalización y dependencias',
            language: 'es',
            ...getLessonContent('dbd-tema-2'),
            tags: ['normalización', 'dependencias'],
            estimatedMinutes: withMinutes(95),
            dueDate: toIsoDate(6),
            status: 'scheduled',
          },
          {
            id: 'dbd-cuestiones-t2',
            kind: 'assignment',
            title: 'Cuestiones Tema 2',
            language: 'es',
            summary: {
              original: 'Colección de problemas sobre dependencias y normalización.',
              english: 'Problem set translated into English prompts for self-marking.',
            },
            tags: ['normalización', 'problemas'],
            estimatedMinutes: withMinutes(60),
            dueDate: toIsoDate(7),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'Notas de solución en inglés en progreso.',
            },
          },
          {
            id: 'dbd-plan-practicas',
            kind: 'reading',
            title: 'Planificación de prácticas',
            language: 'es',
            summary: {
              original: 'Cronograma oficial de prácticas con entregables por semana.',
              english: 'Practice schedule summarized in English with deadlines.',
            },
            tags: ['planificación', 'laboratorio'],
            estimatedMinutes: withMinutes(30),
            dueDate: toIsoDate(4),
            status: 'not-started',
            translation: {
              status: 'partial',
              summary: 'Tabla en inglés con fechas y entregables principales.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'snlp',
    slug: 'signal-natural-language-processing-deep-learning',
    name: 'Signal and Natural Language Processing with Deep Learning',
    tagline: 'Chapters, labs y entregables oficiales del curso de señales y NLP con deep learning.',
    description: {
      en: 'Chapter slide decks, lab PDFs, and the assignment brief exactly as provided in the SNLP folder for the Signal and NLP with Deep Learning course.',
      es: 'Diapositivas por capítulo, laboratorios y briefing de asignaciones tal como están en el repositorio del curso de Señales y NLP con Deep Learning.',
    },
    languageProfile: {
      primary: 'en',
      supportLevel: 'complete',
      notes: 'El material está en inglés; añado notas en español para reforzar vocabulario.',
    },
    credits: 6,
    skills: ['procesamiento de señales', 'modelos de lenguaje', 'deep learning'],
    focusAreas: ['procesamiento de señales', 'NLP', 'pipelines de voz'],
    color: '#a855f7',
    reflectionPrompts: [
      'Resume en español la arquitectura de señal o lenguaje que viste en el último capítulo.',
      '¿Qué dataset de audio o texto usarías para practicar la técnica discutida y por qué?',
    ],
    courses: [
      {
        id: 'snlp-lectures',
        code: 'SNLP-2024',
        title: 'Lecture series',
        description: 'Diapositivas por capítulo y briefs de evaluaciones.',
        modality: 'lecture',
        schedule: 'Miércoles · Aula virtual',
        languageMix: ['en'],
        focusAreas: ['NLP', 'speech', 'deep learning'],
        items: [
          {
            id: 'snlp-chapter-1',
            kind: 'lesson',
            title: 'Chapter 1 · Foundations',
            language: 'en',
            ...getLessonContent('snlp-chapter-1'),
            tags: ['fundamentals'],
            estimatedMinutes: withMinutes(60),
            dueDate: toIsoDate(-6),
            status: 'graded',
          },
          {
            id: 'snlp-chapter-2',
            kind: 'lesson',
            title: 'Chapter 2 · Classical NLP',
            language: 'en',
            ...getLessonContent('snlp-chapter-2'),
            tags: ['ngram', 'evaluación'],
            estimatedMinutes: withMinutes(70),
            dueDate: toIsoDate(-1),
            status: 'graded',
          },
          {
            id: 'snlp-chapter-3',
            kind: 'lesson',
            title: 'Chapter 3 · Keras for NLP',
            language: 'en',
            ...getLessonContent('snlp-chapter-3'),
            tags: ['keras', 'deep learning'],
            estimatedMinutes: withMinutes(80),
            dueDate: toIsoDate(4),
            status: 'scheduled',
          },
          {
            id: 'snlp-chapter-4',
            kind: 'lesson',
            title: 'Chapter 4 · NLP Applications',
            language: 'en',
            ...getLessonContent('snlp-chapter-4'),
            tags: ['pipelines', 'deploy'],
            estimatedMinutes: withMinutes(75),
            dueDate: toIsoDate(9),
            status: 'scheduled',
          },
          {
            id: 'snlp-chapter-5',
            kind: 'lesson',
            title: 'Chapter 5 · Large Language Models',
            language: 'en',
            ...getLessonContent('snlp-chapter-5'),
            tags: ['LLM', 'evaluación'],
            estimatedMinutes: withMinutes(80),
            dueDate: toIsoDate(15),
            status: 'scheduled',
          },
          {
            id: 'snlp-chapter-6',
            kind: 'lesson',
            title: 'Chapter 6 · Speech Processing',
            language: 'en',
            ...getLessonContent('snlp-chapter-6'),
            tags: ['speech', 'acústica'],
            estimatedMinutes: withMinutes(85),
            dueDate: toIsoDate(21),
            status: 'scheduled',
          },
          {
            id: 'snlp-assignments-brief',
            kind: 'assignment',
            title: 'Assignments overview',
            language: 'en',
            summary: {
              original: 'Summary of graded components and deliverables.',
              english: 'Same as original; in English already.',
            },
            tags: ['evaluación'],
            estimatedMinutes: withMinutes(30),
            dueDate: toIsoDate(2),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'Notas en español aclarando rúbricas y fechas.',
            },
          },
          {
            id: 'snlp-poster',
            kind: 'project',
            title: 'Poster presentation template',
            language: 'en',
            summary: {
              original: 'Poster layout and checklist for the final showcase.',
              english: 'Same template; includes bilingual cues in personal notes.',
            },
            tags: ['proyecto', 'presentación'],
            estimatedMinutes: withMinutes(120),
            dueDate: toIsoDate(25),
            status: 'not-started',
            translation: {
              status: 'partial',
              summary: 'Notas en español sobre storytelling y requisitos.',
            },
          },
        ],
      },
      {
        id: 'snlp-labs',
        code: 'SNLP-LABS',
        title: 'Laboratorios guiados',
        description: 'Guías de laboratorio con tareas paso a paso.',
        modality: 'lab',
        schedule: 'Viernes · Laboratorio 2.4',
        languageMix: ['en'],
        focusAreas: ['implementación', 'experimentos'],
        items: [
          {
            id: 'snlp-lab-prework',
            kind: 'reading',
            title: 'Lab 1 · Pre-work checklist',
            language: 'en',
            summary: {
              original: 'Preparatory steps before the first SNLP lab session.',
            },
            tags: ['setup'],
            estimatedMinutes: withMinutes(40),
            dueDate: toIsoDate(-3),
            status: 'graded',
            translation: {
              status: 'complete',
              summary: 'Notas en español para asegurar configuración correcta.',
            },
          },
          {
            id: 'snlp-lab-2',
            kind: 'lab',
            title: 'Lab Session 2 · NLP Pipeline',
            language: 'en',
            summary: {
              original: 'Hands-on pipeline exercise covering preprocessing to evaluation.',
            },
            tags: ['pipeline', 'evaluación'],
            estimatedMinutes: withMinutes(110),
            dueDate: toIsoDate(3),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'Instrucciones complementarias en español para cada bloque.',
            },
          },
          {
            id: 'snlp-lab-3',
            kind: 'lab',
            title: 'Lab Session 3 · Speech & NER',
            language: 'en',
            summary: {
              original: 'Experimentos con reconocimiento de entidades y módulos de voz.',
            },
            tags: ['speech', 'NER'],
            estimatedMinutes: withMinutes(115),
            dueDate: toIsoDate(11),
            status: 'scheduled',
            translation: {
              status: 'planned',
              summary: 'Pendiente de generar instrucciones en español tras la práctica.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'admeav',
    slug: 'advanced-methods-artificial-vision',
    name: 'Advanced Methods of Artificial Vision',
    tagline: 'Slides y notebooks oficiales para teoría y práctica de visión artificial avanzada.',
    description: {
      en: 'Slide decks, notebooks, and lab material taken verbatim from the ADMEAV GitHub folder.',
      es: 'Presentaciones, notebooks y sesiones prácticas exactamente como aparecen en GitHub para Métodos Avanzados de Visión Artificial.',
    },
    languageProfile: {
      primary: 'en',
      supportLevel: 'complete',
      notes: 'Las clases se imparten en inglés; complemento con glosarios en español de visión artificial.',
    },
    credits: 5,
    skills: ['visión artificial', 'feature engineering', 'aprendizaje profundo'],
    focusAreas: ['extracción de características', 'CNN', 'análisis de imágenes'],
    color: '#ef4444',
    reflectionPrompts: [
      'Describe en español la técnica de visión artificial usada en el último laboratorio.',
      '¿Qué métrica utilizarías para evaluar tu modelo de visión y por qué?',
    ],
    courses: [
      {
        id: 'admeav-theory',
        code: 'ADMEAV-2024',
        title: 'Teoría de visión por computador',
        description: 'Slides oficiales por unidad.',
        modality: 'lecture',
        schedule: 'Jueves · Aula multimedia',
        languageMix: ['en'],
        focusAreas: ['visión artificial', 'CNN'],
        items: [
          {
            id: 'admeav-slide-t0',
            kind: 'lesson',
            title: 'Unit 0 · Presentation',
            language: 'en',
            ...getLessonContent('admeav-slide-t0'),
            tags: ['orientación'],
            estimatedMinutes: withMinutes(40),
            dueDate: toIsoDate(-8),
            status: 'graded',
          },
          {
            id: 'admeav-slide-t1',
            kind: 'lesson',
            title: 'Unit 1 · Hand-crafted feature extraction',
            language: 'en',
            ...getLessonContent('admeav-slide-t1'),
            tags: ['feature engineering'],
            estimatedMinutes: withMinutes(85),
            dueDate: toIsoDate(-1),
            status: 'graded',
          },
          {
            id: 'admeav-slide-t2',
            kind: 'lesson',
            title: 'Unit 2 · CNN-based feature extraction',
            language: 'en',
            ...getLessonContent('admeav-slide-t2'),
            tags: ['CNN', 'transfer learning'],
            estimatedMinutes: withMinutes(90),
            dueDate: toIsoDate(6),
            status: 'scheduled',
          },
        ],
      },
      {
        id: 'admeav-labs',
        code: 'ADMEAV-LABS',
        title: 'Laboratorios y notebooks',
        description: 'Prácticas basadas en notebooks y guías oficiales.',
        modality: 'lab',
        schedule: 'Viernes · Laboratorio multimedia',
        languageMix: ['en'],
        focusAreas: ['experimentación', 'visión por computador'],
        items: [
          {
            id: 'admeav-lab-sesion1',
            kind: 'lab',
            title: 'Sesión práctica 1 · Feature Extraction',
            language: 'en',
            ...getLessonContent('admeav-lab-sesion1'),
            tags: ['feature engineering', 'notebook'],
            estimatedMinutes: withMinutes(120),
            dueDate: toIsoDate(2),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'Comentarios en español añadidos en cada bloque del notebook.',
            },
          },
          {
            id: 'admeav-notebook-glcm',
            kind: 'lab',
            title: 'Notebook · GLCM example',
            language: 'en',
            ...getLessonContent('admeav-notebook-glcm'),
            tags: ['GLCM', 'texture'],
            estimatedMinutes: withMinutes(70),
            dueDate: toIsoDate(5),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'Notas en español sobre interpretación de matrices.',
            },
            notebook: {
              id: 'admeav-notebook-glcm',
              path: 'subjects/Admeav/Teoria/Notebooks/unit_1/example_glcm.ipynb',
              colabUrl:
                'https://colab.research.google.com/github/study-compass/content/blob/main/subjects/Admeav/Teoria/Notebooks/unit_1/example_glcm.ipynb',
            },
          },
          {
            id: 'admeav-notebook-lbp',
            kind: 'lab',
            title: 'Notebook · Local Binary Patterns',
            language: 'en',
            ...getLessonContent('admeav-notebook-lbp'),
            tags: ['LBP', 'feature engineering'],
            estimatedMinutes: withMinutes(65),
            dueDate: toIsoDate(7),
            status: 'scheduled',
            translation: {
              status: 'planned',
              summary: 'Pendiente de traducir notas y resultados al español.',
            },
          },
          {
            id: 'admeav-notebook-sift',
            kind: 'lab',
            title: 'Notebook · SIFT example',
            language: 'en',
            ...getLessonContent('admeav-notebook-sift'),
            tags: ['SIFT', 'visión'],
            estimatedMinutes: withMinutes(80),
            dueDate: toIsoDate(9),
            status: 'scheduled',
            translation: {
              status: 'planned',
              summary: 'Plan para documentar resultados en español tras la práctica.',
            },
          },
        ],
      },
    ],
  },
];

const flattenItems = (subject: SubjectSummary): CourseItem[] =>
  subject.courses.flatMap((course) => course.items);

const isDueWithin = (item: CourseItem, days: number) => {
  if (!item.dueDate) return false;
  const dueTime = new Date(item.dueDate).getTime();
  if (Number.isNaN(dueTime)) return false;
  const nowTime = Date.now();
  return dueTime >= nowTime && dueTime <= nowTime + days * DAY_IN_MS;
};

const isOverdue = (item: CourseItem) => {
  if (!item.dueDate) return false;
  const dueTime = new Date(item.dueDate).getTime();
  if (Number.isNaN(dueTime)) return false;
  return dueTime < Date.now();
};

export const computeSubjectMetrics = (subject: SubjectSummary): SubjectMetrics => {
  const items = flattenItems(subject);
  const totalItems = items.length;
  const assignments = items.filter((item) => item.kind === 'assignment' || item.kind === 'project').length;
  const labs = items.filter((item) => item.kind === 'lab').length;
  const englishReady = items.filter(
    (item) => item.language === 'en' || item.translation?.status === 'complete' || item.translation?.status === 'partial'
  ).length;
  const spanishOnly = items.filter((item) => item.language === 'es' && !item.translation).length;
  const translationCoverage = totalItems === 0 ? 0 : englishReady / totalItems;
  const upcoming = items.filter((item) => isDueWithin(item, 7));
  const overdue = items.filter((item) => isOverdue(item) && item.status !== 'graded');

  return {
    subject,
    totalItems,
    assignments,
    labs,
    translationCoverage,
    englishReady,
    spanishOnly,
    upcoming,
    overdue,
  };
};

export const computeCatalogInsights = (catalog: SubjectSummary[]) => {
  const metrics = catalog.map((subject) => computeSubjectMetrics(subject));
  const totals = metrics.reduce(
    (acc, entry) => {
      acc.items += entry.totalItems;
      acc.assignments += entry.assignments;
      acc.labs += entry.labs;
      acc.englishReady += entry.englishReady;
      acc.spanishOnly += entry.spanishOnly;
      acc.subjects += 1;
      acc.overdue += entry.overdue.length;
      acc.upcoming += entry.upcoming.length;
      return acc;
    },
    {
      subjects: 0,
      items: 0,
      assignments: 0,
      labs: 0,
      englishReady: 0,
      spanishOnly: 0,
      overdue: 0,
      upcoming: 0,
    }
  );

  const translationCoverage = totals.items === 0 ? 0 : totals.englishReady / totals.items;

  return { metrics, totals: { ...totals, translationCoverage } };
};

export const getUpcomingSubjectFocus = (catalog: SubjectSummary[], windowDays = 5) => {
  const focusPool = catalog
    .flatMap((subject) =>
      flattenItems(subject).map((item) => ({
        subject,
        item,
      }))
    )
    .filter(({ item }) => isDueWithin(item, windowDays) || (item.dueDate && isOverdue(item)));

  if (focusPool.length === 0) {
    return undefined;
  }

  focusPool.sort((a, b) => {
    const dueA = a.item.dueDate ? new Date(a.item.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const dueB = b.item.dueDate ? new Date(b.item.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return dueA - dueB;
  });

  const pick = focusPool[0];
  const dueDate = pick.item.dueDate ? new Date(pick.item.dueDate) : undefined;
  return {
    subjectId: pick.subject.id,
    subjectName: pick.subject.name,
    subjectSlug: pick.subject.slug,
    itemId: pick.item.id,
    itemTitle: pick.item.title,
    dueDate: dueDate?.toISOString(),
    language: pick.item.language,
  };
};

export type CatalogInsights = ReturnType<typeof computeCatalogInsights>;
