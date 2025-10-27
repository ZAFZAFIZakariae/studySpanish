import { LessonQuizDefinition } from './types';

export const ggoTema1Quiz: LessonQuizDefinition = {
  id: 'ggo-tema-1',
  title: 'Autoevaluación · Introducción al Gobierno de TI',
  introduction:
    'Pon a prueba tus conocimientos sobre gobierno corporativo vs. gobierno de TI, roles clave y marcos de referencia.',
  questions: [
    {
      id: 'ggo-tema-1-mcq-1',
      type: 'mcq',
      prompt: '¿Cuál NO es un componente principal del gobierno de TI?',
      options: [
        { id: 'a', label: 'Strategic Alignment (Alineación estratégica)' },
        { id: 'b', label: 'Market Analysis (Análisis de mercado)' },
        { id: 'c', label: 'Resource Management (Gestión de recursos)' },
        { id: 'd', label: 'Performance Measurement (Medición del desempeño)' },
      ],
      answer: 'b',
      explanation: 'El análisis de mercado no es uno de los cinco dominios clave de gobierno de TI.',
    },
    {
      id: 'ggo-tema-1-mcq-2',
      type: 'mcq',
      prompt: '¿Cuál es el objetivo principal del gobierno de TI?',
      options: [
        { id: 'a', label: 'Garantizar proyectos a tiempo sin importar beneficios financieros.' },
        { id: 'b', label: 'Alinear la TI con el negocio y controlar riesgos tecnológicos.' },
        { id: 'c', label: 'Aumentar la cuota de mercado sin supervisión de TI.' },
        { id: 'd', label: 'Aplicar todas las normas ISO posibles.' },
      ],
      answer: 'b',
      explanation: 'El gobierno de TI busca asegurar la alineación con el negocio y el control de riesgos.',
    },
    {
      id: 'ggo-tema-1-mcq-3',
      type: 'mcq',
      prompt: '¿Quién traduce los objetivos de negocio en estrategia tecnológica dentro del gobierno de TI?',
      options: [
        { id: 'a', label: 'Junta Directiva / Board of Directors' },
        { id: 'b', label: 'CIO / Director de TI' },
        { id: 'c', label: 'CEO / Director General' },
        { id: 'd', label: 'Auditoría interna' },
      ],
      answer: 'b',
      explanation: 'El CIO actúa como puente entre las prioridades del negocio y la estrategia tecnológica.',
    },
    {
      id: 'ggo-tema-1-mcq-4',
      type: 'mcq',
      prompt: 'COBIT e ITIL son ejemplos de…',
      options: [
        { id: 'a', label: 'Lenguajes de programación' },
        { id: 'b', label: 'Marcos de referencia para el gobierno y gestión de TI' },
        { id: 'c', label: 'Frameworks de marketing' },
        { id: 'd', label: 'Modelos de hardware' },
      ],
      answer: 'b',
      explanation: 'COBIT e ITIL son marcos ampliamente usados para gobierno y gestión de TI.',
    },
    {
      id: 'ggo-tema-1-mcq-5',
      type: 'mcq',
      prompt: '¿Qué beneficio se asocia a un gobierno eficaz de TI?',
      options: [
        { id: 'a', label: 'Reducción de costos de hardware sin control presupuestario' },
        { id: 'b', label: 'Mayor alineación entre TI y objetivos del negocio' },
        { id: 'c', label: 'Eliminación completa de auditorías' },
        { id: 'd', label: 'Desvincular TI de la estrategia empresarial' },
      ],
      answer: 'b',
      explanation: 'La alineación negocio–TI es uno de los resultados esperados de un buen gobierno.',
    },
    {
      id: 'ggo-tema-1-tf-1',
      type: 'true-false',
      prompt: 'El CIO participa en foros de gobierno para alinear TI con la estrategia corporativa.',
      answer: true,
      explanation: 'La participación del CIO en foros de gobierno asegura la alineación estratégica.',
    },
    {
      id: 'ggo-tema-1-tf-2',
      type: 'true-false',
      prompt: 'Los frameworks COBIT e ITIL ayudan a garantizar que las inversiones de TI generen valor.',
      answer: true,
      explanation: 'Ambos frameworks proporcionan guías para asegurar valor y control en las inversiones.',
    },
    {
      id: 'ggo-tema-1-tf-3',
      type: 'true-false',
      prompt: 'La gestión de recursos no forma parte de los componentes básicos del gobierno de TI.',
      answer: false,
      explanation: 'La gestión de recursos es uno de los cinco componentes fundamentales.',
    },
    {
      id: 'ggo-tema-1-match-1',
      type: 'matching',
      prompt: 'Relaciona cada componente del gobierno de TI con su descripción.',
      pairs: [
        {
          id: 'alignment',
          left: 'Alineación estratégica',
          right: 'Combinar coherentemente estrategia de negocio y TI',
        },
        {
          id: 'value',
          left: 'Entrega de valor',
          right: 'Garantizar beneficios prometidos a usuarios internos',
        },
        {
          id: 'resources',
          left: 'Gestión de recursos',
          right: 'Uso óptimo de aplicaciones, datos y personal de TI',
        },
        {
          id: 'risks',
          left: 'Gestión de riesgos',
          right: 'Identificar y controlar amenazas tecnológicas',
        },
        {
          id: 'performance',
          left: 'Medición del desempeño',
          right: 'Evaluar métricas y resultados de TI',
        },
      ],
    },
    {
      id: 'ggo-tema-1-match-2',
      type: 'matching',
      prompt: 'Relaciona cada rol con su responsabilidad principal.',
      pairs: [
        {
          id: 'board',
          left: 'Consejo / Alta Dirección',
          right: 'Define políticas, aprueba inversiones y supervisa riesgos',
        },
        {
          id: 'cio',
          left: 'CIO / Director de TI',
          right: 'Traduce objetivos de negocio, gestiona el portafolio y reporta métricas',
        },
        {
          id: 'business',
          left: 'Unidades de Negocio',
          right: 'Priorizan necesidades, fijan requisitos y co-desarrollan soluciones',
        },
        {
          id: 'audit',
          left: 'Auditoría / Control Interno',
          right: 'Evalúa cumplimiento de normas, controla calidad y madurez',
        },
      ],
    },
  ],
};
