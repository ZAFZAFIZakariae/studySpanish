import { LessonQuizDefinition } from './types';

export const ggoTema4Quiz: LessonQuizDefinition = {
  id: 'ggo-tema-4',
  title: 'Autoevaluación · Recursos y Arquitectura Empresarial',
  introduction:
    'Valida tu dominio del método Bedell, la clasificación de recursos, el outsourcing responsable y la arquitectura empresarial.',
  questions: [
    {
      id: 'ggo-tema-4-mcq-1',
      type: 'mcq',
      prompt: 'El método Bedell permite a las organizaciones…',
      options: [
        { id: 'a', label: 'Elaborar diagramas de red física.' },
        { id: 'b', label: 'Decidir objetivamente dónde invertir en proyectos TI según valor y riesgo.' },
        { id: 'c', label: 'Calcular el costo de la energía eléctrica.' },
        { id: 'd', label: 'Definir políticas de recursos humanos.' },
      ],
      answer: 'b',
      explanation: 'Bedell prioriza inversiones TI utilizando datos de valor y riesgo alineados al negocio.',
    },
    {
      id: 'ggo-tema-4-mcq-2',
      type: 'mcq',
      prompt: '¿Cuál es un ejemplo de recurso en arquitectura empresarial?',
      options: [
        { id: 'a', label: 'Publicidad en redes sociales.' },
        { id: 'b', label: 'Una aplicación de software que soporta procesos de negocio.' },
        { id: 'c', label: 'Un cliente potencial.' },
        { id: 'd', label: 'Productos terminados en almacén.' },
      ],
      answer: 'b',
      explanation: 'Las aplicaciones forman parte de los recursos que sustentan capacidades del negocio.',
    },
    {
      id: 'ggo-tema-4-mcq-3',
      type: 'mcq',
      prompt: 'Un beneficio típico de externalizar servicios TI es…',
      options: [
        { id: 'a', label: 'Control absoluto sin acuerdos formales.' },
        { id: 'b', label: 'Acceso a talento especializado y reducción de costos operativos.' },
        { id: 'c', label: 'Mantenimiento interno más complejo.' },
        { id: 'd', label: 'Eliminación de la necesidad de supervisión de calidad.' },
      ],
      answer: 'b',
      explanation: 'La externalización busca aprovechar economías de escala y expertise especializado.',
    },
    {
      id: 'ggo-tema-4-mcq-4',
      type: 'mcq',
      prompt: 'La norma ISO/IEC 37500 se aplica a…',
      options: [
        { id: 'a', label: 'Protocolos de seguridad de redes.' },
        { id: 'b', label: 'La contratación y gestión de servicios externos (outsourcing).' },
        { id: 'c', label: 'Esquemas de base de datos.' },
        { id: 'd', label: 'Metodologías ágiles de desarrollo.' },
      ],
      answer: 'b',
      explanation: 'ISO/IEC 37500 es el estándar internacional para gobernar acuerdos de outsourcing.',
    },
    {
      id: 'ggo-tema-4-mcq-5',
      type: 'mcq',
      prompt: 'ArchiMate es un lenguaje utilizado para…',
      options: [
        { id: 'a', label: 'Programar soluciones de inteligencia artificial.' },
        { id: 'b', label: 'Modelar arquitecturas de negocio, aplicaciones, datos y tecnología.' },
        { id: 'c', label: 'Gestionar bases de datos relacionales.' },
        { id: 'd', label: 'Diseñar interfaces gráficas artísticas.' },
      ],
      answer: 'b',
      explanation: 'ArchiMate es un lenguaje de modelado para arquitecturas empresariales.',
    },
    {
      id: 'ggo-tema-4-tf-1',
      type: 'true-false',
      prompt: 'El método Bedell basa las decisiones de inversión TI en criterios intuitivos sin datos objetivos.',
      answer: false,
      explanation: 'Bedell usa métricas objetivas para priorizar inversiones.',
    },
    {
      id: 'ggo-tema-4-tf-2',
      type: 'true-false',
      prompt: 'ISO/IEC 37500 proporciona pautas para gestionar outsourcing de TI.',
      answer: true,
      explanation: 'La norma cubre la relación cliente-proveedor a lo largo del ciclo de vida del servicio.',
    },
    {
      id: 'ggo-tema-4-tf-3',
      type: 'true-false',
      prompt: 'Las herramientas ArchiMate o MEGA permiten visualizar cómo se relacionan procesos, aplicaciones, datos y tecnología.',
      answer: true,
      explanation: 'Estas herramientas facilitan la comprensión integral de la arquitectura empresarial.',
    },
    {
      id: 'ggo-tema-4-match-1',
      type: 'matching',
      prompt: 'Relaciona cada tipo de recurso con su descripción.',
      pairs: [
        { id: 'apps', left: 'Aplicaciones', right: 'Sistemas de software que soportan procesos de negocio' },
        { id: 'data', left: 'Datos / Información', right: 'Conjunto de datos y conocimiento gestionado por la organización' },
        { id: 'people', left: 'Personas', right: 'Roles, competencias y equipos internos' },
        { id: 'tech', left: 'Tecnología', right: 'Infraestructura de hardware, redes y plataformas de TI' },
      ],
    },
    {
      id: 'ggo-tema-4-match-2',
      type: 'matching',
      prompt: 'Relaciona los conceptos clave de outsourcing con su descripción.',
      pairs: [
        {
          id: 'outsourcing',
          left: 'Externalización',
          right: 'Contratar partes de procesos o servicios TI a proveedores externos',
        },
        {
          id: 'advantage',
          left: 'Ventaja del outsourcing',
          right: 'Reducción de costos y enfoque en competencias clave',
        },
        {
          id: 'disadvantage',
          left: 'Desventaja del outsourcing',
          right: 'Pérdida de control directo y dependencia de terceros',
        },
        {
          id: 'iso37500',
          left: 'ISO/IEC 37500',
          right: 'Estándar internacional para gestionar contratos de outsourcing',
        },
      ],
    },
  ],
};
