import { LessonQuizDefinition } from './types';

export const ggoTema2Quiz: LessonQuizDefinition = {
  id: 'ggo-tema-2',
  title: 'Autoevaluación · Entrega de Valor en TI',
  introduction:
    'Repasa los principios de ITIL 4, el marco Val IT y las prácticas para medir y comunicar valor en servicios de TI.',
  questions: [
    {
      id: 'ggo-tema-2-mcq-1',
      type: 'mcq',
      prompt: 'Según ITGI, una iniciativa de TI se considera exitosa si…',
      options: [
        { id: 'a', label: 'Se completa mucho antes de la fecha límite.' },
        { id: 'b', label: 'Se entrega a tiempo, dentro del presupuesto y con los beneficios acordados.' },
        { id: 'c', label: 'Su costo total es cero.' },
        { id: 'd', label: 'Mejora la moral del equipo de TI sin importar resultados.' },
      ],
      answer: 'b',
      explanation: 'ITGI define el éxito combinando plazo, presupuesto y beneficios entregados.',
    },
    {
      id: 'ggo-tema-2-mcq-2',
      type: 'mcq',
      prompt: 'El principio ITIL “Focus on value” implica…',
      options: [
        { id: 'a', label: 'Priorizar siempre la rentabilidad financiera sobre la satisfacción del usuario.' },
        { id: 'b', label: 'Entender el uso del servicio y medir su impacto en el valor percibido.' },
        { id: 'c', label: 'Generar la mayor cantidad posible de proyectos TI.' },
        { id: 'd', label: 'Reducir el tiempo de respuesta sin evaluar beneficios.' },
      ],
      answer: 'b',
      explanation: 'Focus on value exige medir cómo el servicio impacta a los usuarios y al negocio.',
    },
    {
      id: 'ggo-tema-2-mcq-3',
      type: 'mcq',
      prompt: 'En Val IT, el dominio de Gestión se ocupa de…',
      options: [
        { id: 'a', label: 'Definir la arquitectura empresarial de TI.' },
        { id: 'b', label: 'Monitorear cada inversión para asegurar que genere los beneficios planeados.' },
        { id: 'c', label: 'Solo auditar la seguridad de la información.' },
        { id: 'd', label: 'El desarrollo de aplicaciones web.' },
      ],
      answer: 'b',
      explanation: 'El dominio de Gestión de Val IT se centra en obtener beneficios concretos de cada inversión.',
    },
    {
      id: 'ggo-tema-2-mcq-4',
      type: 'mcq',
      prompt: '¿Cuál es un paso clave para medir y comunicar el valor de TI?',
      options: [
        { id: 'a', label: 'Externalizar todo el proyecto.' },
        { id: 'b', label: 'Modelar las capacidades de negocio y su relación con TI.' },
        { id: 'c', label: 'Evitar involucrar a los stakeholders.' },
        { id: 'd', label: 'Publicar reportes solo al final del año.' },
      ],
      answer: 'b',
      explanation: 'Modelar capacidades permite vincular resultados de TI con beneficios para el negocio.',
    },
    {
      id: 'ggo-tema-2-mcq-5',
      type: 'mcq',
      prompt: 'Una buena práctica para gestionar el valor es…',
      options: [
        { id: 'a', label: 'Invertir únicamente en proyectos de bajo riesgo.' },
        { id: 'b', label: 'Mantener un portafolio equilibrado (innovación, mejora continua, operaciones).' },
        { id: 'c', label: 'Ignorar el impacto estratégico de los proyectos.' },
        { id: 'd', label: 'Omitir la revisión de beneficios tras la implementación.' },
      ],
      answer: 'b',
      explanation: 'Un portafolio balanceado permite sostener valor y gestionar riesgos.',
    },
    {
      id: 'ggo-tema-2-tf-1',
      type: 'true-false',
      prompt: 'Val IT se enfoca solamente en gobierno estratégico y deja de lado la ejecución operativa.',
      answer: false,
      explanation: 'Val IT incluye prácticas para gobernar y gestionar la entrega de valor, no solo la estrategia.',
    },
    {
      id: 'ggo-tema-2-tf-2',
      type: 'true-false',
      prompt: 'Un portafolio equilibrado de TI debe incluir proyectos de innovación, mejora e mantenimiento.',
      answer: true,
      explanation: 'Equilibrar el portafolio evita sesgos y sostiene beneficios a largo plazo.',
    },
    {
      id: 'ggo-tema-2-tf-3',
      type: 'true-false',
      prompt: 'En ITIL 4, el valor incorpora la utilidad y la importancia percibida de los servicios.',
      answer: true,
      explanation: 'ITIL 4 define el valor en términos de utilidad y garantía percibida.',
    },
    {
      id: 'ggo-tema-2-match-1',
      type: 'matching',
      prompt: 'Relaciona cada principio de ITIL 4 con su enfoque.',
      pairs: [
        {
          id: 'focus',
          left: 'Focus on value',
          right: 'Entender el uso del servicio y medir su impacto en el valor',
        },
        {
          id: 'collaborate',
          left: 'Collaborate and promote visibility',
          right: 'Trabajar con el negocio y transparentar el rendimiento',
        },
        {
          id: 'simple',
          left: 'Keep it simple and practical',
          right: 'Evitar complejidad innecesaria en procesos',
        },
      ],
    },
    {
      id: 'ggo-tema-2-match-2',
      type: 'matching',
      prompt: 'Relaciona cada etapa del proceso de creación de valor con su descripción.',
      pairs: [
        {
          id: 'strategic-demands',
          left: 'Strategic Demands (Demandas estratégicas)',
          right: 'Visión de negocio y necesidades arquitectónicas',
        },
        {
          id: 'logical-design',
          left: 'Logical Design (Diseño lógico)',
          right: 'Requisitos detallados y arquitectura técnica',
        },
        {
          id: 'transition',
          left: 'Transition (Transición)',
          right: 'Preparación para producción, catálogo y soporte',
        },
        {
          id: 'operation',
          left: 'Operation (Operación)',
          right: 'Monitoreo de métricas, incidencias y niveles de servicio',
        },
      ],
    },
  ],
};
