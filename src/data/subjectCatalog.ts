import { CourseItem, SubjectMetrics, SubjectSummary } from '../types/subject';

const DAY_IN_MS = 86_400_000;
const now = Date.now();
const toIsoDate = (offsetDays: number) => new Date(now + offsetDays * DAY_IN_MS).toISOString();

const withMinutes = (minutes: number) => minutes;

export const subjectCatalog: SubjectSummary[] = [
  {
    id: 'sad',
    slug: 'software-architecture-design',
    name: 'Software Architecture & Design',
    tagline: 'Translate microservices theory into resilient blueprints.',
    description: {
      en: 'Explore architectural styles, documentation assets, and scenario-driven evaluations with bilingual support for Spanish slide decks.',
      es: 'Explora estilos arquitectónicos, documentación y evaluaciones guiadas por escenarios con apoyo bilingüe para las presentaciones en español.',
    },
    languageProfile: {
      primary: 'es',
      supportLevel: 'partial',
      notes: 'Lecture decks are in Spanish; English-first briefs and key terminology lists are available for each session.',
    },
    credits: 6,
    skills: ['architecture decision records', 'microservices', 'cloud strategy'],
    focusAreas: ['design thinking', 'system reliability', 'governance'],
    color: '#f97316',
    reflectionPrompts: [
      'How did the English outline help you justify the selected architecture pattern?',
      'Which Spanish term caused friction and how will you memorise it?',
    ],
    courses: [
      {
        id: 'sad-teoria',
        code: 'SAD-201',
        title: 'Theory & Decision Frameworks',
        description: 'Weekly lectures unpacking architecture drivers, trade-offs, and documentation patterns.',
        modality: 'lecture',
        schedule: 'Tuesdays 09:00 · Hybrid',
        languageMix: ['es'],
        focusAreas: ['ATAM', 'ADR writing'],
        items: [
          {
            id: 'sad-lecture-foundations',
            kind: 'lesson',
            title: 'Introducción a arquitectura de software',
            language: 'es',
            summary: {
              original: 'Panorama de estilos arquitectónicos, capas y tácticas de calidad.',
              english: 'Overview of architectural styles, layered designs, and quality attribute tactics to watch.',
            },
            tags: ['architecture', 'theory'],
            estimatedMinutes: withMinutes(90),
            dueDate: toIsoDate(-3),
            status: 'graded',
            translation: {
              status: 'complete',
              summary: 'Read the English primer before reviewing Spanish slides to anchor vocabulary.',
              glossary: ['arquitectura hexagonal', 'tácticas de calidad'],
            },
          },
          {
            id: 'sad-adr-workshop',
            kind: 'assignment',
            title: 'ADR: Arquitectura hexagonal vs. microservicios',
            language: 'es',
            summary: {
              original: 'Redacta un ADR comparando arquitectura hexagonal y microservicios para un nuevo producto SaaS.',
              english: 'Draft an ADR comparing hexagonal architecture and microservices for a new SaaS product.',
            },
            tags: ['architecture', 'writing', 'analysis'],
            estimatedMinutes: withMinutes(120),
            dueDate: toIsoDate(2),
            status: 'in-progress',
            translation: {
              status: 'complete',
              summary: 'Follow the supplied English template; keep Spanish keywords in the context section.',
              glossary: ['puertos y adaptadores', 'dominio core'],
            },
          },
          {
            id: 'sad-review-questions',
            kind: 'lesson',
            title: 'Banco de preguntas: Tácticas de calidad',
            language: 'es',
            summary: {
              original: 'Preguntas tipo examen enfocadas en atributos de calidad y riesgos.',
              english: 'Exam-style prompts focusing on quality attributes and risk mitigation approaches.',
            },
            tags: ['revision', 'quality attributes'],
            estimatedMinutes: withMinutes(45),
            dueDate: toIsoDate(5),
            status: 'scheduled',
            translation: {
              status: 'partial',
              summary: 'Key questions have English hints; free-response rationales still need polishing.',
            },
          },
        ],
        cheatPapers: [
          {
            id: 'sad-teoria-cheat',
            title: 'Architecture decision playbook',
            language: 'en',
            coverage: 'full-course',
            description: 'Exhaustive bilingual outline covering every lecture and ADR exercise.',
            englishSummary:
              'Maps the full course into drivers, tactics, documentation assets, and evaluation loops so you can revise everything in English at a glance.',
            spanishSummary:
              'Incluye recordatorios en español de términos críticos y pasos para conectar teoría con las prácticas de decisión.',
            sections: [
              {
                title: 'Architecture foundations & drivers',
                bullets: [
                  'Contrasta estilos en capas, hexagonal, microservicios y event-driven con sus atributos de calidad asociados.',
                  'Lista impulsores de negocio, stakeholders y escenarios tácticos vinculados a métricas de valor.',
                  'Plantilla ADR paso a paso con indicaciones bilingües para contexto, decisión, estado y consecuencias.',
                ],
              },
              {
                title: 'Quality tactics & documentation',
                bullets: [
                  'Resumen de tácticas de disponibilidad, rendimiento, seguridad y mantenibilidad con ejemplos de trade-offs.',
                  'Guía para seleccionar viewpoints y construir mapas de capacidad alineados con las lecciones.',
                  'Checklist para elaborar documentación liviana: diagramas C4, catálogos de decisiones y matrices RACI.',
                ],
              },
              {
                title: 'Evaluation workflows',
                bullets: [
                  'Secuencia completa del método ATAM con preguntas gatillo bilingües para cada fase.',
                  'Tablas de priorización de escenarios y criterios de riesgo traducidos.',
                  'Hoja de cálculo para puntuar opciones arquitectónicas con métricas cuantitativas y narrativas.',
                ],
              },
            ],
            studyTips: [
              'Repasa una sección antes de cada clase y subraya la terminología española que aún te cuesta.',
              'Usa el checklist ADR para ensayar justificaciones en inglés antes de escribir la versión final en español.',
              'Relaciona cada táctica con un sistema real de tu portafolio para reforzar la memoria a largo plazo.',
            ],
            downloadHint: 'Consulta docs/cheat-papers/sad-theory-cheat.md para la versión completa y exportable.',
          },
        ],
      },
      {
        id: 'sad-practical',
        code: 'SAD-241',
        title: 'Practical Microservices Lab',
        description: 'Hands-on labs configuring observability, resilience, and deployment topologies.',
        modality: 'lab',
        schedule: 'Thursdays 12:00 · On-campus',
        languageMix: ['es', 'en'],
        focusAreas: ['observability', 'documentation'],
        items: [
          {
            id: 'sad-lab-monitoring',
            kind: 'lab',
            title: 'Laboratorio: Observabilidad en microservicios',
            language: 'es',
            summary: {
              original: 'Instrumenta métricas, logs y traces para el sistema de pedidos.',
              english: 'Instrument metrics, logs, and traces for the order management system.',
            },
            tags: ['observability', 'devops'],
            estimatedMinutes: withMinutes(150),
            dueDate: toIsoDate(-1),
            status: 'submitted',
            translation: {
              status: 'machine',
              summary: 'Machine-translated checklist verified for accuracy; screenshots still in Spanish.',
              notes: 'Consider adding manual English captions for Grafana dashboards.',
            },
            lab: {
              environment: 'Docker Compose stack with Jaeger and Prometheus',
              checklists: [
                'Configura exportadores en los servicios críticos.',
                'Anota 3 hipótesis de fallo y captura evidencia.',
                'Sube un ADR resumido en inglés.',
              ],
              deliverable: 'Zip con dashboards + ADR en doble idioma.',
            },
          },
          {
            id: 'sad-lab-resilience',
            kind: 'lab',
            title: 'Chaos engineering sprint',
            language: 'en',
            summary: {
              original: 'Inject latency and failure into the payment gateway to validate fallbacks.',
              english: 'Stress the payment gateway with latency and failure injections to verify fallbacks.',
            },
            tags: ['resilience', 'testing'],
            estimatedMinutes: withMinutes(120),
            dueDate: toIsoDate(6),
            status: 'not-started',
            translation: {
              status: 'complete',
              summary: 'Use the English runbook to brief Spanish-speaking teammates before executing failures.',
            },
            lab: {
              environment: 'Kubernetes + Gremlin sandbox',
              checklists: [
                'Mapa dependencias y define umbrales críticos.',
                'Programa tres experimentos y registra resultados.',
              ],
            },
          },
        ],
        cheatPapers: [
          {
            id: 'sad-lab-cheat',
            title: 'Microservices lab runbook',
            language: 'en',
            coverage: 'labs',
            description: 'Single-page operational guide consolidating every lab step, checklist, and bilingual command reference.',
            englishSummary:
              'Covers environments, observability stack setup, resilience drills, and deployment workflows with English-first explanations.',
            spanishSummary:
              'Incluye comandos anotados en español para que puedas seguir cada laboratorio sin perder matices locales.',
            sections: [
              {
                title: 'Environment & scaffolding',
                bullets: [
                  'Diagrama de servicios, colas y gateways con equivalentes de terminología en ambos idiomas.',
                  'Guía de configuración de contenedores, variables y secretos compartidos.',
                  'Plantilla de historias de usuario técnicas para preparar cada sprint de laboratorio.',
                ],
              },
              {
                title: 'Observability & resilience drills',
                bullets: [
                  'Pasos para instrumentar métricas, logs y traces con ejemplos de consultas listos.',
                  'Procedimiento de chaos engineering con checklist de rollback bilingüe.',
                  'Matriz de incidentes con niveles de severidad y playbooks de respuesta.',
                ],
              },
              {
                title: 'Deployment & documentation',
                bullets: [
                  'Pipeline CI/CD completo con puntos de control para revisiones en inglés.',
                  'Checklist de pruebas de humo, contratos y documentación post-lanzamiento.',
                  'Formato para reportar hallazgos y próximos pasos en español e inglés.',
                ],
              },
            ],
            studyTips: [
              'Simula cada laboratorio en seco usando la tabla de incidentes antes del día oficial.',
              'Practica explicando en inglés cada métrica de observabilidad a un compañero.',
              'Documenta ajustes de infraestructura en español para reforzar vocabulario técnico.',
            ],
            downloadHint: 'Disponible en docs/cheat-papers/sad-lab-cheat.md con enlaces a scripts auxiliares.',
          },
        ],
      },
    ],
  },
  {
    id: 'ggo',
    slug: 'it-governance',
    name: 'Gobierno de TI',
    tagline: 'Align technology portfolios with executive strategy.',
    description: {
      en: 'Bridge Spanish governance frameworks with English executive summaries and stakeholder templates.',
      es: 'Conecta los marcos de gobierno de TI con plantillas ejecutivas en inglés.',
    },
    languageProfile: {
      primary: 'es',
      supportLevel: 'partial',
      notes: 'Spanish readings with concise English briefs and bilingual stakeholder canvases.',
    },
    credits: 5,
    skills: ['stakeholder mapping', 'value management', 'strategic alignment'],
    focusAreas: ['COBIT', 'risk management', 'business alignment'],
    color: '#22d3ee',
    reflectionPrompts: [
      'Which stakeholder insight surprised you when drafting the bilingual executive memo?',
      'How confident are you presenting the value map in English?',
    ],
    courses: [
      {
        id: 'ggo-intro',
        code: 'GGO-101',
        title: 'Introducción al gobierno de TI',
        description: 'Foundational lectures covering COBIT principles, value delivery, and performance metrics.',
        modality: 'lecture',
        schedule: 'Mondays 15:00 · In-person',
        languageMix: ['es'],
        focusAreas: ['COBIT', 'value delivery'],
        items: [
          {
            id: 'ggo-reading-cobit',
            kind: 'reading',
            title: 'Lectura: Marco COBIT 2019',
            language: 'es',
            summary: {
              original: 'Resumen de dominios, factores de diseño y metas alineadas a COBIT 2019.',
              english: 'Digest of COBIT 2019 domains, design factors, and governance objectives.',
            },
            tags: ['governance', 'frameworks'],
            estimatedMinutes: withMinutes(80),
            dueDate: toIsoDate(1),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'English highlights for each governance objective; need glossary for acronyms.',
            },
          },
          {
            id: 'ggo-executive-brief',
            kind: 'assignment',
            title: 'Executive brief: Valor de TI',
            language: 'es',
            summary: {
              original: 'Elabora un memo ejecutivo que justifique la inversión en un nuevo sistema ERP.',
              english: 'Write an executive memo justifying investment in a new ERP system.',
            },
            tags: ['writing', 'strategy'],
            estimatedMinutes: withMinutes(90),
            dueDate: toIsoDate(4),
            status: 'not-started',
            translation: {
              status: 'complete',
              summary: 'Use the English memo template and translate key KPIs back to Spanish for the appendix.',
            },
          },
        ],
        cheatPapers: [
          {
            id: 'ggo-intro-cheat',
            title: 'Governance executive cheat paper',
            language: 'en',
            coverage: 'full-course',
            description: 'Full-stack summary of COBIT, value delivery, and performance domains with bilingual scorecards.',
            englishSummary:
              'Covers every lecture outcome in memo-ready English so you can brief executives without re-reading Spanish slides.',
            spanishSummary:
              'Contiene traducciones clave al español para conservar el matiz de los marcos regulatorios.',
            sections: [
              {
                title: 'COBIT 2019 essentials',
                bullets: [
                  'Resumen de principios, objetivos de gobierno y factores de diseño con tablas bilingües.',
                  'Mapa de metas en cascada y ejemplos de métricas alineadas a cada dominio.',
                  'Glosario de procesos EDM/APO/BAI/DSS/MEA con equivalencias ejecutivas.',
                ],
              },
              {
                title: 'Value delivery & performance',
                bullets: [
                  'Matrices de beneficios, riesgos y costos traducidas para memorandos rápidos.',
                  'Plantilla de cuadro de mando integral con KPI en ambos idiomas.',
                  'Checklist para evaluar madurez y justificar inversiones ERP en minutos.',
                ],
              },
              {
                title: 'Stakeholder communication',
                bullets: [
                  'Guía para construir mapas de poder/interés y canales de comunicación.',
                  'Scripts breves en inglés para responder preguntas frecuentes en comités.',
                  'Lista de verificación de entregables por audiencia (CEO, CFO, PMO).',
                ],
              },
            ],
            studyTips: [
              'Practica cada script frente a un espejo para ganar fluidez en inglés ejecutivo.',
              'Actualiza el cuadro de mando con ejemplos reales de tu empresa para afianzar conceptos.',
              'Comparte el glosario con tus compañeros para validar traducciones clave.',
            ],
            downloadHint: 'Disponible en docs/cheat-papers/ggo-intro-cheat.md con plantillas reutilizables.',
          },
        ],
      },
      {
        id: 'ggo-workshop',
        code: 'GGO-205',
        title: 'Stakeholder Workshops',
        description: 'Interactive labs mapping stakeholders and quantifying IT-business alignment.',
        modality: 'lab',
        schedule: 'Wednesdays 17:00 · Workshop',
        languageMix: ['es', 'en'],
        focusAreas: ['stakeholder alignment', 'facilitation'],
        items: [
          {
            id: 'ggo-lab-bedell',
            kind: 'lab',
            title: 'Método Bedell para alineación negocio-TI',
            language: 'es',
            summary: {
              original: 'Aplica el método Bedell para evaluar el impacto del sistema de información propuesto.',
              english: 'Apply the Bedell method to evaluate the impact of the proposed information system.',
            },
            tags: ['analysis', 'value'],
            estimatedMinutes: withMinutes(110),
            dueDate: toIsoDate(-5),
            status: 'submitted',
            translation: {
              status: 'machine',
              summary: 'Rough English translation of the scoring sheet; facilitator notes remain in Spanish.',
              notes: 'Schedule time to refine facilitator instructions.',
            },
            lab: {
              environment: 'Stakeholder canvas template (Miro) bilingual',
              checklists: [
                'Identifica stakeholders clave y pondera influencia.',
                'Evalúa impacto del sistema propuesto en 3 horizontes.',
                'Prepara una síntesis de riesgos en inglés.',
              ],
            },
          },
          {
            id: 'ggo-lab-stakeholder-map',
            kind: 'project',
            title: 'Stakeholder map & translation clinic',
            language: 'en',
            summary: {
              original: 'Deliver stakeholder analysis slides in English with annotated Spanish glossary.',
              english: 'Deliver stakeholder analysis slides in English and include a supporting Spanish glossary.',
            },
            tags: ['presentation', 'bilingual'],
            estimatedMinutes: withMinutes(100),
            dueDate: toIsoDate(8),
            status: 'scheduled',
            translation: {
              status: 'complete',
              summary: 'Slides already in English; maintain glossary for Spanish delivery.',
            },
          },
        ],
        cheatPapers: [
          {
            id: 'ggo-workshop-cheat',
            title: 'Stakeholder facilitation blueprint',
            language: 'en',
            coverage: 'labs',
            description: 'Minute-by-minute facilitation script with bilingual prompts, scoring rubrics, and follow-up templates.',
            englishSummary:
              'Bundles alignment canvases, Bedell scoring tables, and translation clinics so you can run every workshop confidently in English.',
            spanishSummary:
              'Incorpora instrucciones en español para explicar dinámicas sin perder claridad.',
            sections: [
              {
                title: 'Workshop setup',
                bullets: [
                  'Checklist previo: objetivos, agenda y materiales con traducción.',
                  'Plantillas de canvas y scoring listos para imprimir o compartir en Miro.',
                  'Lista de stakeholders sugeridos y roles durante las dinámicas.',
                ],
              },
              {
                title: 'Execution scripts',
                bullets: [
                  'Guión bilingüe para abrir sesiones, explicar Bedell y moderar debates.',
                  'Banco de preguntas para descubrir dolor de negocio y medir alineación.',
                  'Tablas para registrar puntajes y acuerdos inmediatos.',
                ],
              },
              {
                title: 'Follow-up & translation clinic',
                bullets: [
                  'Plantilla de acta en inglés con glosario español adjunto.',
                  'Checklist de compromisos, riesgos y responsables post taller.',
                  'Guía rápida para preparar mapas visuales bilingües.',
                ],
              },
            ],
            studyTips: [
              'Haz role-play de cada sección con compañeros para ganar confianza.',
              'Cronometra cada bloque usando la guía minuto a minuto para evitar retrasos.',
              'Resalta términos difíciles en la clínica de traducción para repasarlos luego.',
            ],
            downloadHint: 'Consulta docs/cheat-papers/ggo-workshop-cheat.md con enlaces a canvas editables.',
          },
        ],
      },
    ],
  },
  {
    id: 'dbd',
    slug: 'database-design',
    name: 'Diseño de Bases de Datos',
    tagline: 'Design bilingual schemas and optimise SQL workflow.',
    description: {
      en: 'Solidify relational modelling concepts with English walkthroughs for Spanish lab guides.',
      es: 'Consolida el modelado relacional con guías en español y explicaciones en inglés.',
    },
    languageProfile: {
      primary: 'es',
      supportLevel: 'complete',
      notes: 'Every lab includes English instructions, ERD terminology, and bilingual SQL comments.',
    },
    credits: 4,
    skills: ['normalisation', 'SQL optimisation', 'data modelling'],
    focusAreas: ['database design', 'queries'],
    color: '#38bdf8',
    reflectionPrompts: [
      'Which Spanish database term still needs an English cue?',
      'How can you reuse the English ERD legend for the next project?',
    ],
    courses: [
      {
        id: 'dbd-lecture',
        code: 'DBD-110',
        title: 'Modelado relacional',
        description: 'Lectures and guided practice around conceptual, logical, and physical design.',
        modality: 'lecture',
        schedule: 'Fridays 10:00 · Hybrid',
        languageMix: ['es'],
        focusAreas: ['normalisation', 'constraints'],
        items: [
          {
            id: 'dbd-erd-lesson',
            kind: 'lesson',
            title: 'Caso estudio: Biblioteca universitaria',
            language: 'es',
            summary: {
              original: 'Modela entidades y relaciones para la biblioteca, incluyendo préstamos y multas.',
              english: 'Model the library ERD with loans, fines, and bilingual attribute naming tips.',
            },
            tags: ['erd', 'case study'],
            estimatedMinutes: withMinutes(70),
            dueDate: toIsoDate(3),
            status: 'in-progress',
            translation: {
              status: 'complete',
              summary: 'Use the English checklist before switching to the Spanish modelling worksheet.',
            },
          },
          {
            id: 'dbd-quiz-normalisation',
            kind: 'assignment',
            title: 'Quiz: Formas normales',
            language: 'es',
            summary: {
              original: 'Evalúa tu dominio de 1FN-3FN y BCNF.',
              english: 'Assess your mastery of 1NF-3NF and BCNF with bilingual answer keys.',
            },
            tags: ['quiz', 'normalisation'],
            estimatedMinutes: withMinutes(35),
            dueDate: toIsoDate(-2),
            status: 'graded',
            translation: {
              status: 'complete',
              summary: 'Answer key includes English explanations for each violation.',
            },
          },
        ],
        cheatPapers: [
          {
            id: 'dbd-lecture-cheat',
            title: 'Relational modelling master sheet',
            language: 'en',
            coverage: 'full-course',
            description: 'Complete ERD, normalisation, and constraint reference with bilingual annotations.',
            englishSummary:
              'Summarises conceptual through physical design, normal forms, and SQL integrity rules for fast English revision.',
            spanishSummary:
              'Incluye cuadros de equivalencias en español para vocabulario de entidades, atributos y restricciones.',
            sections: [
              {
                title: 'Conceptual & logical design',
                bullets: [
                  'Pasos para levantar requisitos, identificar entidades y relaciones cardinales.',
                  'Patrones para modelar jerarquías, asociaciones débiles y multivaluados.',
                  'Guía para transformar modelos conceptuales en esquemas lógicos bilingües.',
                ],
              },
              {
                title: 'Normalisation toolkit',
                bullets: [
                  'Tabla comparativa de 1FN a BCNF con ejemplos ilustrativos.',
                  'Procedimiento para detectar dependencias funcionales y multivaluadas.',
                  'Checklist de síntomas de denormalización aceptable para rendimiento.',
                ],
              },
              {
                title: 'Constraints & SQL patterns',
                bullets: [
                  'Listado bilingüe de constraints (PK, FK, CHECK, UNIQUE) con sintaxis.',
                  'Snippets SQL comentados para triggers, vistas y reglas de negocio.',
                  'Preguntas frecuentes de examen con respuestas explicadas.',
                ],
              },
            ],
            studyTips: [
              'Redibuja el ERD de ejemplo usando la nomenclatura inglesa para memorizar términos.',
              'Practica detectar dependencias funcionales con los casos resueltos.',
              'Enseña a un compañero la sección de constraints para consolidar tu dominio.',
            ],
            downloadHint: 'Ubica el resumen extendido en docs/cheat-papers/dbd-lecture-cheat.md.',
          },
        ],
      },
      {
        id: 'dbd-lab',
        code: 'DBD-204',
        title: 'Laboratorio SQL Performance',
        description: 'Practical lab to optimise SQL queries with bilingual documentation.',
        modality: 'lab',
        schedule: 'Thursdays 18:00 · Online',
        languageMix: ['es', 'en'],
        focusAreas: ['query tuning', 'indexing'],
        items: [
          {
            id: 'dbd-lab-indexing',
            kind: 'lab',
            title: 'Optimización de consultas con índices',
            language: 'es',
            summary: {
              original: 'Mide el impacto de índices compuestos en consultas críticas.',
              english: 'Measure the impact of composite indexes on critical queries.',
            },
            tags: ['sql', 'performance'],
            estimatedMinutes: withMinutes(120),
            dueDate: toIsoDate(7),
            status: 'scheduled',
            translation: {
              status: 'complete',
              summary: 'Step-by-step English lab instructions with cross-referenced Spanish screenshots.',
            },
            lab: {
              environment: 'PostgreSQL 15 + pg_stat_statements',
              checklists: [
                'Captura plan de ejecución base.',
                'Aplica índices propuestos y compara métricas.',
                'Escribe conclusiones en ambos idiomas.',
              ],
            },
          },
        ],
        cheatPapers: [
          {
            id: 'dbd-lab-cheat',
            title: 'SQL performance war room sheet',
            language: 'en',
            coverage: 'labs',
            description: 'Step-by-step bilingual lab manual consolidating every optimisation drill and measurement table.',
            englishSummary:
              'Walks through indexing strategy, query plans, benchmarking, and reporting so you can execute labs without flipping notes.',
            spanishSummary:
              'Describe métricas clave y comandos en español para seguir el laboratorio al pie de la letra.',
            sections: [
              {
                title: 'Preparation & baselines',
                bullets: [
                  'Checklist para clonar base de datos, poblarla y capturar planes iniciales.',
                  'Tabla de métricas (tiempo, buffers, CPU) con traducción.',
                  'Guía para habilitar pg_stat_statements y registrar resultados.',
                ],
              },
              {
                title: 'Indexing & tuning drills',
                bullets: [
                  'Recetario de índices simples, compuestos y parciales con ejemplos.',
                  'Secuencia para analizar EXPLAIN/ANALYZE y detectar cuellos de botella.',
                  'Tips para reescribir consultas y usar CTEs o particiones.',
                ],
              },
              {
                title: 'Reporting & bilingual delivery',
                bullets: [
                  'Formato de informe con tablas comparativas antes/después.',
                  'Guión en inglés para presentar hallazgos a profesores o stakeholders.',
                  'Checklist para documentar aprendizajes en español dentro del repositorio.',
                ],
              },
            ],
            studyTips: [
              'Cronometra cada experimento y anota observaciones en ambos idiomas.',
              'Ejecuta las consultas del recetario en un entorno limpio antes del laboratorio real.',
              'Practica explicar cada mejora de rendimiento con el guión incluido.',
            ],
            downloadHint: 'Manual detallado disponible en docs/cheat-papers/dbd-lab-cheat.md.',
          },
        ],
      },
    ],
  },
  {
    id: 'snlp',
    slug: 'statistical-nlp',
    name: 'Statistical NLP',
    tagline: 'Blend English theory with Spanish corpora experiments.',
    description: {
      en: 'Balance English research papers with Spanish corpora labs and translation cheat-sheets.',
      es: 'Equilibra artículos de investigación en inglés con laboratorios de corpus en español.',
    },
    languageProfile: {
      primary: 'en',
      supportLevel: 'partial',
      notes: 'Most lectures are in English; lab rubrics include Spanish clarifications for datasets.',
    },
    credits: 5,
    skills: ['language modelling', 'evaluation metrics', 'data wrangling'],
    focusAreas: ['N-grams', 'neural language models', 'evaluation'],
    color: '#a855f7',
    reflectionPrompts: [
      'Which Spanish annotations posed evaluation issues and how did you resolve them?',
      'Summarise today’s paper in Spanish to reinforce comprehension.',
    ],
    courses: [
      {
        id: 'snlp-lecture',
        code: 'SNLP-320',
        title: 'Probabilistic Foundations',
        description: 'Lectures covering N-gram models, smoothing, and evaluation metrics.',
        modality: 'lecture',
        schedule: 'Tuesdays 14:00 · Online',
        languageMix: ['en'],
        focusAreas: ['probability', 'evaluation'],
        items: [
          {
            id: 'snlp-lesson-smoothing',
            kind: 'lesson',
            title: 'Lecture: Kneser-Ney smoothing',
            language: 'en',
            summary: {
              original: 'Deep dive into absolute discounting and interpolated Kneser-Ney.',
              english: 'Deep dive into absolute discounting and interpolated Kneser-Ney.',
            },
            tags: ['theory', 'probability'],
            estimatedMinutes: withMinutes(80),
            dueDate: toIsoDate(-4),
            status: 'graded',
            translation: {
              status: 'planned',
              summary: 'Spanish crib sheet pending for smoothing terminology.',
            },
          },
          {
            id: 'snlp-reading-mt',
            kind: 'reading',
            title: 'Paper: Statistical MT with sparse features',
            language: 'en',
            summary: {
              original: 'Research paper on sparse feature integration for phrase-based MT.',
              english: 'Research paper on sparse feature integration for phrase-based MT.',
            },
            tags: ['research', 'machine translation'],
            estimatedMinutes: withMinutes(95),
            dueDate: toIsoDate(2),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'Spanish abstract provided; figure captions pending translation.',
            },
          },
        ],
        cheatPapers: [
          {
            id: 'snlp-lecture-cheat',
            title: 'Probabilistic NLP mega summary',
            language: 'en',
            coverage: 'full-course',
            description: 'Complete rundown of N-gram theory, smoothing, evaluation, and translation models with bilingual cues.',
            englishSummary:
              'Condenses every lecture into digestible formulas, diagrams, and evaluation workflows written in English.',
            spanishSummary:
              'Resalta equivalencias en español para métricas, términos estadísticos y pasos de derivación.',
            sections: [
              {
                title: 'N-gram modelling fundamentals',
                bullets: [
                  'Definiciones clave, supuestos de Markov y cálculo de probabilidades con ejemplos anotados.',
                  'Tabla comparativa de smoothing (Laplace, Good-Turing, Kneser-Ney) con intuiciones bilingües.',
                  'Notas sobre perplexity, cross-entropy y ajuste de parámetros.',
                ],
              },
              {
                title: 'Machine translation & sequence models',
                bullets: [
                  'Resumen de modelos IBM, alineamientos y decoding beam search.',
                  'Guía para integrar sparse features y optimización discriminativa.',
                  'Tabla de comparación entre modelos estadísticos y neurales.',
                ],
              },
              {
                title: 'Evaluation & error analysis',
                bullets: [
                  'Checklist para calcular BLEU, METEOR y métricas humanas.',
                  'Plantilla de matriz de errores con categorías bilingües.',
                  'Pasos para elaborar resúmenes en español de papers ingleses.',
                ],
              },
            ],
            studyTips: [
              'Repite las derivaciones con la sección de fórmulas hasta poder explicarlas sin guion.',
              'Traduce al español cada término complejo y agrega ejemplos propios.',
              'Usa la matriz de errores para analizar tus prácticas y reforzar vocabulario.',
            ],
            downloadHint: 'Encuentra el resumen completo en docs/cheat-papers/snlp-lecture-cheat.md.',
          },
        ],
      },
      {
        id: 'snlp-lab',
        code: 'SNLP-360',
        title: 'Corpus Labs',
        description: 'Weekly labs experimenting with Spanish corpora and bilingual evaluation.',
        modality: 'lab',
        schedule: 'Fridays 11:00 · Lab',
        languageMix: ['en', 'es'],
        focusAreas: ['data prep', 'evaluation'],
        items: [
          {
            id: 'snlp-lab-ner',
            kind: 'lab',
            title: 'Lab: Named Entity Recognition en corpus español',
            language: 'es',
            summary: {
              original: 'Entrena y evalúa modelos NER sobre el corpus AnCora.',
              english: 'Train and evaluate NER models on the AnCora corpus.',
            },
            tags: ['ner', 'python'],
            estimatedMinutes: withMinutes(140),
            dueDate: toIsoDate(0),
            status: 'in-progress',
            translation: {
              status: 'partial',
              summary: 'English lab notebook provided; dataset instructions remain in Spanish.',
            },
            lab: {
              environment: 'Google Colab + spaCy',
              checklists: [
                'Configura entorno bilingüe con comentarios en inglés/español.',
                'Evalúa F1 y analiza errores con notas bilingües.',
              ],
            },
          },
          {
            id: 'snlp-project-poster',
            kind: 'project',
            title: 'Poster project: Bias in language models',
            language: 'en',
            summary: {
              original: 'Prepare a bilingual poster discussing bias metrics on Spanish benchmarks.',
              english: 'Create a bilingual poster that explains bias metrics on Spanish-language benchmarks.',
            },
            tags: ['research', 'presentation'],
            estimatedMinutes: withMinutes(200),
            dueDate: toIsoDate(12),
            status: 'scheduled',
            translation: {
              status: 'complete',
              summary: 'Poster template includes Spanish captions and English narrative.',
            },
          },
        ],
        cheatPapers: [
          {
            id: 'snlp-lab-cheat',
            title: 'Corpus experimentation field guide',
            language: 'en',
            coverage: 'labs',
            description: 'Hands-on bilingual lab reference covering setup, modelling, evaluation, and reporting for every corpus activity.',
            englishSummary:
              'Walks through preprocessing, training loops, evaluation checkpoints, and reporting expectations for all labs.',
            spanishSummary:
              'Incluye instrucciones específicas en español para manipular corpus y documentar hallazgos.',
            sections: [
              {
                title: 'Environment prep & datasets',
                bullets: [
                  'Checklist de configuración en Colab y requisitos de librerías.',
                  'Guía para descargar y explorar AnCora, Europarl y corpus complementarios.',
                  'Plantillas de notas bilingües para registrar observaciones de datos.',
                ],
              },
              {
                title: 'Model training routines',
                bullets: [
                  'Secuencia para entrenar NER, POS tagging y lenguaje con spaCy/HF.',
                  'Consejos de hiperparámetros con traducción y rangos recomendados.',
                  'Scripts listos para experimentos con seguimiento de semillas.',
                ],
              },
              {
                title: 'Evaluation & reporting',
                bullets: [
                  'Checklist de métricas (precision, recall, F1) y visualizaciones sugeridas.',
                  'Guía bilingüe para análisis de error y redacción de conclusiones.',
                  'Formato de póster y entregables con secciones en inglés y español.',
                ],
              },
            ],
            studyTips: [
              'Documenta cada experimento en la plantilla de notas para detectar patrones rápidamente.',
              'Practica presentar resultados en inglés y luego traduce los insights clave al español.',
              'Repite experimentos con variaciones mínimas para dominar el flujo de trabajo.',
            ],
            downloadHint: 'Disponible en docs/cheat-papers/snlp-lab-cheat.md listo para imprimir.',
          },
        ],
      },
    ],
  },
  {
    id: 'admeav',
    slug: 'advanced-machine-learning',
    name: 'Advanced Machine Learning',
    tagline: 'Synthesize machine learning theory across languages.',
    description: {
      en: 'Combine English-heavy research seminars with Spanish implementation clinics and bilingual glossaries.',
      es: 'Combina seminarios de investigación en inglés con clínicas de implementación en español y glosarios bilingües.',
    },
    languageProfile: {
      primary: 'en',
      supportLevel: 'partial',
      notes: 'Seminars in English; lab notebooks provide Spanish callouts for tricky proofs.',
    },
    credits: 6,
    skills: ['bayesian inference', 'optimisation', 'ml ops'],
    focusAreas: ['probabilistic modelling', 'ethics', 'deployment'],
    color: '#facc15',
    reflectionPrompts: [
      'Explain the latest seminar topic in Spanish to ensure cross-language retention.',
      'Log a vocabulary pair for each confusing Spanish technical term.',
    ],
    courses: [
      {
        id: 'admeav-seminar',
        code: 'ADML-401',
        title: 'Research Seminar Series',
        description: 'Weekly research paper discussions with bilingual recap sheets.',
        modality: 'seminar',
        schedule: 'Thursdays 08:00 · Hybrid',
        languageMix: ['en'],
        focusAreas: ['bayesian inference', 'causality'],
        items: [
          {
            id: 'admeav-paper-gaussian',
            kind: 'reading',
            title: 'Paper: Gaussian Processes with Constraints',
            language: 'en',
            summary: {
              original: 'Review constrained Gaussian Process inference and sparse approximations.',
              english: 'Review constrained Gaussian Process inference techniques and sparse approximation methods.',
            },
            tags: ['research', 'gaussian processes'],
            estimatedMinutes: withMinutes(110),
            dueDate: toIsoDate(-6),
            status: 'graded',
            translation: {
              status: 'partial',
              summary: 'Spanish annotations cover figures; need translation for appendix proofs.',
            },
          },
          {
            id: 'admeav-seminar-dl',
            kind: 'lesson',
            title: 'Seminar: Continual learning debate',
            language: 'en',
            summary: {
              original: 'Panel discussion on catastrophic forgetting mitigation strategies.',
              english: 'Host a panel conversation that compares strategies to reduce catastrophic forgetting.',
            },
            tags: ['discussion', 'continual learning'],
            estimatedMinutes: withMinutes(75),
            dueDate: toIsoDate(1),
            status: 'scheduled',
            translation: {
              status: 'planned',
              summary: 'Spanish recap sheet scheduled after the live debate.',
            },
          },
        ],
        cheatPapers: [
          {
            id: 'admeav-seminar-cheat',
            title: 'Advanced ML seminar digest',
            language: 'en',
            coverage: 'full-course',
            description: 'Comprehensive recap of every seminar paper, debate theme, and bilingual vocabulary list.',
            englishSummary:
              'Distills key theorems, experiment takeaways, and discussion prompts so you can brief the cohort in English quickly.',
            spanishSummary:
              'Ofrece resúmenes ejecutivos en español para explicar los conceptos complejos tras cada sesión.',
            sections: [
              {
                title: 'Gaussian processes & Bayesian inference',
                bullets: [
                  'Notas sobre kernels, inducción escasa y restricciones con ejemplos numéricos.',
                  'Guía para derivar funciones de covarianza y explicar su intuición en español.',
                  'Checklist de preguntas para dirigir debates sobre aproximaciones y trade-offs.',
                ],
              },
              {
                title: 'Continual learning & ethics',
                bullets: [
                  'Resumen bilingüe de métodos contra el olvido catastrófico (regularización, rehearsal, arquitectura).',
                  'Lista de pros/contras para comparar papers recientes.',
                  'Plantilla de discusión ética con prompts sobre sesgos, transparencia y responsabilidad.',
                ],
              },
              {
                title: 'Seminar facilitation toolkit',
                bullets: [
                  'Cronograma sugerido para presentaciones y paneles.',
                  'Banco de preguntas rápidas en inglés/español para dinamizar Q&A.',
                  'Checklist de entregables post-seminario (resumen, glosario, acciones).',
                ],
              },
            ],
            studyTips: [
              'Redacta un mini brief en inglés después de cada lectura usando la plantilla incluida.',
              'Traduce al español los conceptos más complejos para verificar comprensión.',
              'Graba tu intervención de debate y evalúa fluidez con el banco de preguntas.',
            ],
            downloadHint: 'Consulta docs/cheat-papers/admeav-seminar-cheat.md para la versión completa.',
          },
        ],
      },
      {
        id: 'admeav-lab',
        code: 'ADML-455',
        title: 'MLOps Implementation Clinics',
        description: 'Apply research ideas to bilingual ML pipelines with fairness tracking.',
        modality: 'lab',
        schedule: 'Saturdays 09:00 · Lab',
        languageMix: ['en', 'es'],
        focusAreas: ['ml ops', 'ethics'],
        items: [
          {
            id: 'admeav-lab-monitoring',
            kind: 'lab',
            title: 'Lab: Monitorización de modelos bilingües',
            language: 'es',
            summary: {
              original: 'Configura monitoreo para drift lingüístico en modelos desplegados.',
              english: 'Configure monitoring for linguistic drift in deployed models.',
            },
            tags: ['ml ops', 'monitoring'],
            estimatedMinutes: withMinutes(160),
            dueDate: toIsoDate(9),
            status: 'not-started',
            translation: {
              status: 'partial',
              summary: 'English runbook available; dashboards still annotated in Spanish.',
            },
            lab: {
              environment: 'MLflow + Evidently + FastAPI',
              checklists: [
                'Define métricas de drift en ambos idiomas.',
                'Configura alertas y documenta respuestas en inglés.',
              ],
            },
          },
          {
            id: 'admeav-project-ethics',
            kind: 'project',
            title: 'Capstone: Ethical deployment playbook',
            language: 'en',
            summary: {
              original: 'Draft a bilingual playbook for deploying ML services ethically.',
              english: 'Draft a bilingual playbook that guides ethical deployment of machine learning services.',
            },
            tags: ['ethics', 'project'],
            estimatedMinutes: withMinutes(210),
            dueDate: toIsoDate(14),
            status: 'scheduled',
            translation: {
              status: 'complete',
              summary: 'Template includes Spanish action cards and English executive summary.',
            },
          },
        ],
        cheatPapers: [
          {
            id: 'admeav-lab-cheat',
            title: 'Bilingual MLOps implementation dossier',
            language: 'en',
            coverage: 'labs',
            description: 'End-to-end operational dossier with bilingual runbooks, fairness checkpoints, and deployment rituals.',
            englishSummary:
              'Consolidates monitoring recipes, deployment scripts, and ethical guardrails in English so you can run clinics smoothly.',
            spanishSummary:
              'Incluye anotaciones en español para explicar configuraciones y métricas a equipos locales.',
            sections: [
              {
                title: 'Pipeline setup & automation',
                bullets: [
                  'Checklist de infraestructura (repos, CI/CD, contenedores) con pasos bilingües.',
                  'Guía para parametrizar experimentos en MLflow y sincronizar con Evidently.',
                  'Tabla de responsabilidades RACI para equipo técnico y stakeholders.',
                ],
              },
              {
                title: 'Monitoring & drift response',
                bullets: [
                  'Procedimientos para configurar métricas de drift lingüístico y alertas automáticas.',
                  'Playbook de respuesta con escenarios comunes y acciones recomendadas.',
                  'Formato de bitácora bilingüe para incidentes y aprendizajes.',
                ],
              },
              {
                title: 'Ethical deployment playbook',
                bullets: [
                  'Lista de chequeo de fairness, privacidad y explicabilidad.',
                  'Guía para preparar briefing ejecutivo bilingüe previo a producción.',
                  'Plantilla de tablero de control con indicadores técnicos y de impacto social.',
                ],
              },
            ],
            studyTips: [
              'Ensaya la ejecución del runbook antes de cada clínica y ajusta tiempos.',
              'Comparte el tablero de control con mentores para recibir retroalimentación temprana.',
              'Convierte las anotaciones españolas en tarjetas de memoria para reforzar vocabulario.',
            ],
            downloadHint: 'Versión extendida guardada en docs/cheat-papers/admeav-lab-cheat.md.',
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
