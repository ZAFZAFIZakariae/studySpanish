import { LessonQuizDefinition } from './types';

export const ggoTema3Quiz: LessonQuizDefinition = {
  id: 'ggo-tema-3',
  title: 'Autoevaluación · Alineación Negocio–TI',
  introduction:
    'Refuerza el modelo de alineamiento estratégico, las herramientas de análisis y las buenas prácticas para sincronizar negocio y TI.',
  questions: [
    {
      id: 'ggo-tema-3-mcq-1',
      type: 'mcq',
      prompt: 'En el Modelo de Alineación Estratégico (SAM), la perspectiva “Ejecución Estratégica” corresponde a…',
      options: [
        { id: 'a', label: 'TI planificando estrategia independiente' },
        { id: 'b', label: 'La estrategia de negocio dirige las iniciativas de TI' },
        { id: 'c', label: 'La estrategia de TI despliega procesos de negocio' },
        { id: 'd', label: 'Exclusivamente la infraestructura de TI' },
      ],
      answer: 'b',
      explanation: 'En “Ejecución estratégica” la estrategia de negocio determina prioridades que TI ejecuta.',
    },
    {
      id: 'ggo-tema-3-mcq-2',
      type: 'mcq',
      prompt: 'El eje “integración funcional” del SAM se refiere a la alineación entre…',
      options: [
        { id: 'a', label: 'Factores externos e internos de la organización' },
        { id: 'b', label: 'Negocio y TI (procesos y operaciones)' },
        { id: 'c', label: 'Departamentos financieros y de TI' },
        { id: 'd', label: 'Proyectos innovadores y proyectos operativos' },
      ],
      answer: 'b',
      explanation: 'La integración funcional une procesos y operaciones de negocio con los de TI.',
    },
    {
      id: 'ggo-tema-3-mcq-3',
      type: 'mcq',
      prompt: 'El análisis PESTEL evalúa…',
      options: [
        { id: 'a', label: 'Fortalezas y debilidades internas (SWOT)' },
        { id: 'b', label: 'Competencia directa y cuota de mercado' },
        { id: 'c', label: 'Factores Políticos, Económicos, Sociales, Tecnológicos, Ambientales y Legales' },
        { id: 'd', label: 'Únicamente factores ambientales y legales' },
      ],
      answer: 'c',
      explanation: 'PESTEL estudia el macroentorno con seis categorías principales.',
    },
    {
      id: 'ggo-tema-3-mcq-4',
      type: 'mcq',
      prompt: 'Porter’s Five Forces incluye el análisis de…',
      options: [
        { id: 'a', label: 'Estrategias internas de la empresa' },
        { id: 'b', label: 'Elementos macroeconómicos' },
        { id: 'c', label: 'Amenaza de productos sustitutos en el mercado' },
        { id: 'd', label: 'Exclusivamente competidores y nuevos entrantes' },
      ],
      answer: 'c',
      explanation: 'Las fuerzas de Porter consideran sustitutos junto con proveedores, clientes, competidores y entrantes.',
    },
    {
      id: 'ggo-tema-3-mcq-5',
      type: 'mcq',
      prompt: 'Una buena práctica para la alineación negocio–TI es…',
      options: [
        { id: 'a', label: 'Excluir al equipo de TI de las reuniones estratégicas' },
        { id: 'b', label: 'Mantener KPIs separados para negocio y TI' },
        { id: 'c', label: 'Establecer indicadores compartidos entre negocio y TI' },
        { id: 'd', label: 'Realizar la planificación estratégica solo cada cinco años' },
      ],
      answer: 'c',
      explanation: 'Los indicadores compartidos ayudan a alinear resultados de negocio y de TI.',
    },
    {
      id: 'ggo-tema-3-tf-1',
      type: 'true-false',
      prompt: 'En el SAM, la perspectiva “Nivel de Servicio” se centra en alinear la infraestructura TI con necesidades de negocio actuales.',
      answer: true,
      explanation: 'El nivel de servicio conecta infraestructura y procesos para sostener operaciones del negocio.',
    },
    {
      id: 'ggo-tema-3-tf-2',
      type: 'true-false',
      prompt: 'Las herramientas SWOT y PESTEL deben aplicarse solo al negocio y nunca a la estrategia TI.',
      answer: false,
      explanation: 'Aplicar estas herramientas a ambos dominios mantiene la coherencia estratégica.',
    },
    {
      id: 'ggo-tema-3-tf-3',
      type: 'true-false',
      prompt: 'Traducir prioridades del negocio en hojas de ruta tecnológicas es una práctica clave de alineación.',
      answer: true,
      explanation: 'Las hojas de ruta conectan prioridades estratégicas con capacidades de TI.',
    },
    {
      id: 'ggo-tema-3-match-1',
      type: 'matching',
      prompt: 'Relaciona cada perspectiva del SAM con su enfoque.',
      pairs: [
        {
          id: 'execution',
          left: 'Ejecución estratégica',
          right: 'La estrategia de negocio dirige a TI',
        },
        {
          id: 'transformation',
          left: 'Transformación tecnológica',
          right: 'La estrategia de TI impulsa iniciativas de negocio',
        },
        {
          id: 'potential',
          left: 'Potencial competitivo',
          right: 'Innovación y nuevos modelos de negocio habilitados por TI',
        },
        {
          id: 'service',
          left: 'Nivel de servicio',
          right: 'La infraestructura TI se ajusta a los procesos de negocio',
        },
      ],
    },
    {
      id: 'ggo-tema-3-match-2',
      type: 'matching',
      prompt: 'Relaciona cada herramienta estratégica con lo que analiza.',
      pairs: [
        {
          id: 'swot',
          left: 'SWOT (DAFO)',
          right: 'Fortalezas, debilidades, oportunidades y amenazas',
        },
        {
          id: 'pestel',
          left: 'PESTEL',
          right: 'Factores políticos, económicos, sociales, tecnológicos, ambientales y legales',
        },
        {
          id: 'porter',
          left: 'Cinco Fuerzas de Porter',
          right: 'Competidores, clientes, proveedores, entrantes y sustitutos',
        },
      ],
    },
  ],
};
