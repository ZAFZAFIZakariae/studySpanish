import { createDiagram, type FigureRenderer } from './shared';

export const generalFigures: Record<string, FigureRenderer> = {
  'admeav/t0-roadmap': (altText) =>
    createDiagram(altText, {
      nodes: [
        {
          id: 'theory',
          x: 36,
          y: 60,
          width: 200,
          title: 'Bloques teóricos',
          lines: ['T0–T9', 'Notebook + masterclass'],
        },
        {
          id: 'labs',
          x: 280,
          y: 60,
          width: 200,
          title: 'Prácticas guiadas',
          lines: ['P1–P5', 'Integración de código'],
          fill: '#ede9fe',
        },
        {
          id: 'exams',
          x: 524,
          y: 60,
          width: 200,
          title: 'Evaluaciones',
          lines: ['Parcial 05/11', 'Final 21/01'],
          fill: '#fee2e2',
        },
        {
          id: 'project',
          x: 280,
          y: 220,
          width: 200,
          title: 'Proyecto final',
          lines: ['Entrega 15/01', 'Código + demo'],
          fill: '#dcfce7',
        },
      ],
      links: [
        { from: 'theory', to: 'labs', label: 'Aplicar conceptos' },
        { from: 'labs', to: 'project', label: 'Iteraciones' },
        { from: 'theory', to: 'exams', label: 'Pruebas' },
        { from: 'project', to: 'exams', label: 'Retroalimentación', dashed: true },
      ],
    }),
  'admeav/t1-taxonomy': (altText) =>
    createDiagram(altText, {
      nodes: [
        {
          id: 'core',
          x: 270,
          y: 140,
          width: 220,
          title: 'Descriptores clásicos',
          lines: ['Vector de características'],
          fill: '#fef3c7',
        },
        {
          id: 'global',
          x: 60,
          y: 40,
          title: 'Globales',
          lines: ['Histograma', 'Momentos'],
        },
        {
          id: 'local',
          x: 520,
          y: 40,
          title: 'Locales',
          lines: ['Parches', 'LBP, HOG'],
        },
        {
          id: 'keypoints',
          x: 60,
          y: 240,
          title: 'Puntos clave',
          lines: ['SIFT/SURF'],
        },
        {
          id: 'filters',
          x: 520,
          y: 240,
          title: 'Filtros',
          lines: ['Gabor', 'Bancos multiescala'],
        },
      ],
      links: [
        { from: 'core', to: 'global' },
        { from: 'core', to: 'local' },
        { from: 'core', to: 'keypoints' },
        { from: 'core', to: 'filters' },
      ],
    }),
  'admeav/t2-hierarchy': (altText) =>
    createDiagram(altText, {
      nodes: [
        {
          id: 'input',
          x: 40,
          y: 140,
          width: 180,
          title: 'Entrada',
          lines: ['Imágenes, vídeo'],
          fill: '#ede9fe',
        },
        {
          id: 'low',
          x: 240,
          y: 40,
          width: 180,
          title: 'Capas iniciales',
          lines: ['Bordes', 'Texturas básicas'],
        },
        {
          id: 'mid',
          x: 440,
          y: 40,
          width: 180,
          title: 'Capas intermedias',
          lines: ['Partes de objetos'],
        },
        {
          id: 'high',
          x: 240,
          y: 220,
          width: 180,
          title: 'Capas profundas',
          lines: ['Conceptos', 'Semántica'],
        },
        {
          id: 'output',
          x: 440,
          y: 220,
          width: 180,
          title: 'Salidas',
          lines: ['Clases', 'Embeddings'],
          fill: '#dcfce7',
        },
      ],
      links: [
        { from: 'input', to: 'low', label: 'Convolución' },
        { from: 'low', to: 'mid', label: 'Pooling' },
        { from: 'mid', to: 'high', label: 'Bloques residuales' },
        { from: 'high', to: 'output', label: 'Clasificación' },
      ],
    }),
  'dbd-tema-2/estados': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'active', x: 60, y: 150, title: 'Activa', lines: ['Ejecución en curso'] },
        {
          id: 'partial',
          x: 240,
          y: 150,
          title: 'Parcialmente confirmada',
          lines: ['Operaciones completadas'],
        },
        { id: 'committed', x: 440, y: 150, title: 'Confirmada', lines: ['COMMIT'] },
        { id: 'failed', x: 240, y: 40, title: 'Fallida', lines: ['Error detectado'], fill: '#fee2e2' },
        { id: 'aborted', x: 240, y: 260, title: 'Abortada', lines: ['ROLLBACK'], fill: '#fde68a' },
      ],
      links: [
        { from: 'active', to: 'partial', label: 'Ejecución' },
        { from: 'partial', to: 'committed', label: 'COMMIT' },
        { from: 'partial', to: 'failed', label: 'Violación' },
        { from: 'failed', to: 'aborted', label: 'Undo' },
        { from: 'active', to: 'aborted', label: 'Cancelación', dashed: true },
      ],
    }),
  'dbd-tema-2/acid': (altText) =>
    createDiagram(altText, {
      nodes: [
        {
          id: 'center',
          x: 290,
          y: 140,
          width: 200,
          title: 'Transacción',
          lines: ['Unidad lógica'],
          fill: '#fef3c7',
        },
        { id: 'atomic', x: 60, y: 40, title: 'Atomicidad', lines: ['Todo o nada'] },
        { id: 'consistency', x: 520, y: 40, title: 'Consistencia', lines: ['Estados válidos'] },
        { id: 'isolation', x: 60, y: 240, title: 'Aislamiento', lines: ['Concurrencia controlada'] },
        { id: 'durability', x: 520, y: 240, title: 'Durabilidad', lines: ['Persistencia'] },
      ],
      links: [
        { from: 'center', to: 'atomic' },
        { from: 'center', to: 'consistency' },
        { from: 'center', to: 'isolation' },
        { from: 'center', to: 'durability' },
      ],
    }),
  'dbd-presentacion/competencias': (altText) =>
    createDiagram(altText, {
      nodes: [
        {
          id: 'gestion',
          x: 60,
          y: 110,
          width: 220,
          title: 'Gestión y administración',
          lines: ['Componentes SGBD', 'Integridad y seguridad'],
        },
        {
          id: 'diseno',
          x: 460,
          y: 110,
          width: 220,
          title: 'Diseño avanzado',
          lines: ['Físico, PL/SQL', 'Casos reales'],
        },
        {
          id: 'practicas',
          x: 260,
          y: 250,
          width: 240,
          title: 'Aprendizaje práctico',
          lines: ['Laboratorios Oracle', 'Proyecto integrador'],
          fill: '#dcfce7',
        },
      ],
      links: [
        { from: 'gestion', to: 'practicas', label: 'Administrar' },
        { from: 'diseno', to: 'practicas', label: 'Implementar' },
      ],
    }),
  'ggo-tema-1/niveles': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'assembly', x: 300, y: 40, title: 'Asamblea', lines: ['Propietarios', 'Supervisión'], width: 180 },
        { id: 'board', x: 300, y: 140, title: 'Consejo', lines: ['Estrategia', 'Control'], width: 180 },
        { id: 'management', x: 300, y: 240, title: 'Dirección general', lines: ['Ejecución', 'Gestión diaria'], width: 200 },
        { id: 'cio', x: 520, y: 140, title: 'CIO / TI', lines: ['Alineación', 'Innovación'], fill: '#ede9fe' },
      ],
      links: [
        { from: 'assembly', to: 'board', label: 'Mandato' },
        { from: 'board', to: 'management', label: 'Supervisión' },
        { from: 'board', to: 'cio', label: 'Participación TI' },
      ],
    }),
  'ggo-tema-1/alineacion': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'business', x: 40, y: 140, width: 200, title: 'Estrategia de negocio', lines: ['Objetivos', 'KPIs'] },
        { id: 'value', x: 300, y: 40, width: 200, title: 'Valor generado', lines: ['Beneficios', 'Resultados'], fill: '#dcfce7' },
        {
          id: 'ti',
          x: 520,
          y: 140,
          width: 200,
          title: 'Estrategia TI',
          lines: ['Portafolio', 'Arquitectura'],
        },
        {
          id: 'ops',
          x: 300,
          y: 240,
          width: 200,
          title: 'Procesos y personas',
          lines: ['Servicios', 'Gobierno'],
          fill: '#ede9fe',
        },
      ],
      links: [
        { from: 'business', to: 'ti', label: 'Demandas' },
        { from: 'ti', to: 'ops', label: 'Servicios' },
        { from: 'ops', to: 'value', label: 'Beneficios' },
        { from: 'value', to: 'business', label: 'Feedback', dashed: true },
      ],
    }),
  'ggo-tema-2/componentes': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'valor', x: 280, y: 140, width: 200, title: 'Valor de TI', lines: ['Resultados netos'], fill: '#fef3c7' },
        { id: 'benef', x: 60, y: 40, title: 'Beneficios', lines: ['Ingresos', 'Eficiencia'], fill: '#dcfce7' },
        { id: 'cost', x: 520, y: 40, title: 'Costos', lines: ['CAPEX/OPEX'], fill: '#fee2e2' },
        { id: 'risk', x: 60, y: 240, title: 'Riesgos', lines: ['Seguridad', 'Cumplimiento'] },
        { id: 'exp', x: 520, y: 240, title: 'Experiencia', lines: ['Usuarios', 'Clientes'] },
      ],
      links: [
        { from: 'benef', to: 'valor' },
        { from: 'cost', to: 'valor' },
        { from: 'risk', to: 'valor' },
        { from: 'exp', to: 'valor' },
      ],
    }),
  'ggo-tema-2/valit-flujo': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'demand', x: 40, y: 160, width: 160, title: 'Demandas estratégicas', lines: ['Necesidades de negocio'] },
        { id: 'concept', x: 220, y: 80, width: 160, title: 'Modelo conceptual', lines: ['Visión servicio'] },
        { id: 'design', x: 400, y: 80, width: 160, title: 'Modelo lógico', lines: ['Requisitos detallados'] },
        { id: 'transition', x: 400, y: 220, width: 160, title: 'Transición', lines: ['Catálogo', 'Preparación'] },
        { id: 'ops', x: 580, y: 160, width: 160, title: 'Operación', lines: ['Métricas', 'Mejora continua'] },
      ],
      links: [
        { from: 'demand', to: 'concept', label: 'Val IT' },
        { from: 'concept', to: 'design', label: 'Diseño' },
        { from: 'design', to: 'transition', label: 'Construcción' },
        { from: 'transition', to: 'ops', label: 'Entrega' },
        { from: 'ops', to: 'demand', label: 'Retroalimentación', dashed: true },
      ],
    }),
  'ggo-tema-3/dimensiones': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'bus-strat', x: 80, y: 60, width: 200, title: 'Estrategia negocio', lines: ['Mercado', 'Ventaja'] },
        { id: 'ti-strat', x: 480, y: 60, width: 200, title: 'Estrategia TI', lines: ['Innovación', 'Arquitectura'] },
        {
          id: 'bus-infra',
          x: 80,
          y: 220,
          width: 200,
          title: 'Infraestructura negocio',
          lines: ['Procesos', 'Habilidades'],
        },
        {
          id: 'ti-infra',
          x: 480,
          y: 220,
          width: 200,
          title: 'Infraestructura TI',
          lines: ['Plataformas', 'Operaciones'],
        },
        {
          id: 'align',
          x: 280,
          y: 140,
          width: 200,
          title: 'Alineación',
          lines: ['Integración funcional', 'Ajuste estratégico'],
          fill: '#dcfce7',
        },
      ],
      links: [
        { from: 'bus-strat', to: 'align' },
        { from: 'ti-strat', to: 'align' },
        { from: 'bus-infra', to: 'align' },
        { from: 'ti-infra', to: 'align' },
      ],
    }),
  'ggo-tema-3/sam': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'center', x: 300, y: 140, width: 220, title: 'Modelo SAM', lines: ['Henderson & Venkatraman'], fill: '#fef3c7' },
        { id: 'exec', x: 60, y: 60, title: 'Ejecución estratégica', lines: ['Negocio → TI'] },
        { id: 'transform', x: 520, y: 60, title: 'Transformación tecnológica', lines: ['TI impulsa negocio'] },
        { id: 'potential', x: 60, y: 240, title: 'Potencial competitivo', lines: ['Innovación'] },
        { id: 'service', x: 520, y: 240, title: 'Nivel de servicio', lines: ['Infraestructura TI'] },
      ],
      links: [
        { from: 'center', to: 'exec' },
        { from: 'center', to: 'transform' },
        { from: 'center', to: 'potential' },
        { from: 'center', to: 'service' },
      ],
    }),
  'sad-session-0/estructura': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'theory', x: 60, y: 80, width: 200, title: 'Teoría & seminarios', lines: ['Martes', 'Sesiones mixtas'] },
        { id: 'labs', x: 460, y: 80, width: 200, title: 'Laboratorio', lines: ['Viernes', 'Hands-on'] },
        { id: 'eval', x: 260, y: 220, width: 240, title: 'Evaluación', lines: ['Examen 25%', 'Proyecto 25%', 'Cuestionarios 25%', 'Lab exam 25%'], fill: '#fef3c7' },
      ],
      links: [
        { from: 'theory', to: 'labs', label: 'Aplicar' },
        { from: 'theory', to: 'eval', label: 'Conocimientos' },
        { from: 'labs', to: 'eval', label: 'Entrega' },
      ],
    }),
  'sad-session-1/transicion': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'mono', x: 40, y: 150, width: 180, title: 'Monolito inicial', lines: ['Sencillez', 'Despliegue único'] },
        { id: 'modular', x: 260, y: 150, width: 180, title: 'Monolito modular', lines: ['Interfaces claras'] },
        { id: 'services', x: 480, y: 150, width: 200, title: 'Servicios distribuidos', lines: ['Escalado', 'Releases independientes'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'mono', to: 'modular', label: 'Refactorización' },
        { from: 'modular', to: 'services', label: 'Extracción de dominios' },
      ],
    }),
  'sad-session-2/elementos': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'service', x: 300, y: 140, width: 200, title: 'Microservicio', lines: ['Responsabilidad clara'], fill: '#fef3c7' },
        { id: 'domain', x: 60, y: 140, title: 'Dominio', lines: ['Bounded context'] },
        { id: 'team', x: 300, y: 40, title: 'Equipo', lines: ['Autonomía', 'Cadencia propia'] },
        { id: 'contract', x: 540, y: 140, title: 'Contrato/API', lines: ['Compatibilidad', 'Versionado'] },
        { id: 'platform', x: 300, y: 240, title: 'Plataforma', lines: ['Observabilidad', 'CI/CD', 'Seguridad'], fill: '#ede9fe' },
      ],
      links: [
        { from: 'domain', to: 'service' },
        { from: 'team', to: 'service' },
        { from: 'contract', to: 'service' },
        { from: 'platform', to: 'service' },
      ],
    }),
  'sad-session-3/responsabilidades': (altText) =>
    createDiagram(altText, {
      nodes: [
        {
          id: 'iaas',
          x: 60,
          y: 140,
          width: 200,
          title: 'IaaS',
          lines: ['Proveedor: HW/virtualización', 'Equipo: SO → app'],
        },
        {
          id: 'paas',
          x: 300,
          y: 60,
          width: 200,
          title: 'PaaS',
          lines: ['Proveedor: runtime', 'Equipo: código + datos'],
          fill: '#fef3c7',
        },
        {
          id: 'saas',
          x: 540,
          y: 140,
          width: 200,
          title: 'SaaS',
          lines: ['Proveedor: aplicación completa', 'Equipo: configuración'],
          fill: '#dcfce7',
        },
      ],
      links: [
        { from: 'iaas', to: 'paas', label: 'Menos control' },
        { from: 'paas', to: 'saas', label: 'Más servicio' },
      ],
    }),
  'snlp-chapter-1/panorama': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'audio', x: 60, y: 60, width: 200, title: 'Audio', lines: ['Ambiente', 'Voz'] },
        { id: 'music', x: 60, y: 220, width: 200, title: 'Música', lines: ['Análisis', 'Síntesis'] },
        { id: 'text', x: 540, y: 140, width: 200, title: 'Texto', lines: ['NLP', 'Modelos generativos'] },
        {
          id: 'apps',
          x: 300,
          y: 140,
          width: 200,
          title: 'Aplicaciones',
          lines: ['Clasificación', 'Generación', 'Recomendación'],
          fill: '#dcfce7',
        },
      ],
      links: [
        { from: 'audio', to: 'apps' },
        { from: 'music', to: 'apps' },
        { from: 'text', to: 'apps' },
      ],
    }),
  'snlp-chapter-2/pipeline': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'raw', x: 40, y: 160, width: 160, title: 'Señal cruda', lines: ['PCM'] },
        { id: 'windows', x: 200, y: 80, width: 160, title: 'Ventanas', lines: ['Segmentación'] },
        { id: 'stft', x: 360, y: 80, width: 160, title: 'Transformada', lines: ['STFT / Mel'] },
        { id: 'features', x: 360, y: 220, width: 160, title: 'Características', lines: ['MFCC', 'Chroma'], fill: '#ede9fe' },
        { id: 'model', x: 520, y: 160, width: 160, title: 'Modelo', lines: ['Clasificador', 'DL'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'raw', to: 'windows', label: 'Preprocesado' },
        { from: 'windows', to: 'stft', label: 'FFT' },
        { from: 'stft', to: 'features', label: 'Resumen' },
        { from: 'features', to: 'model', label: 'Entrenamiento' },
      ],
    }),
  'snlp-chapter-3/keras-pipeline': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'define', x: 40, y: 160, width: 150, title: 'Definir modelo', lines: ['Capas'] },
        { id: 'compile', x: 200, y: 160, width: 150, title: 'Compilar', lines: ['Optimización'] },
        { id: 'train', x: 360, y: 160, width: 150, title: 'Entrenar', lines: ['fit()'] },
        { id: 'evaluate', x: 520, y: 160, width: 150, title: 'Evaluar', lines: ['Métricas'] },
        { id: 'deploy', x: 680, y: 160, width: 150, title: 'Desplegar', lines: ['Inferencia'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'define', to: 'compile' },
        { from: 'compile', to: 'train' },
        { from: 'train', to: 'evaluate' },
        { from: 'evaluate', to: 'deploy' },
      ],
    }),
  'snlp-chapter-4/representaciones': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'onehot', x: 40, y: 160, width: 160, title: 'One-hot / BOW', lines: ['Vectores dispersos'] },
        { id: 'tfidf', x: 220, y: 160, width: 160, title: 'TF-IDF', lines: ['Peso por relevancia'] },
        { id: 'dense', x: 400, y: 160, width: 160, title: 'Embeddings densos', lines: ['Word2Vec', 'GloVe'], fill: '#ede9fe' },
        { id: 'context', x: 580, y: 160, width: 180, title: 'Contextualizados', lines: ['ELMo', 'BERT'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'onehot', to: 'tfidf' },
        { from: 'tfidf', to: 'dense' },
        { from: 'dense', to: 'context' },
      ],
    }),
  'snlp-chapter-5/evolucion': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'bow', x: 40, y: 160, width: 150, title: 'Bag-of-Words', lines: ['Conteo'] },
        { id: 'embed', x: 200, y: 160, width: 150, title: 'Embeddings', lines: ['Word2Vec/GloVe'] },
        { id: 'rnn', x: 360, y: 160, width: 150, title: 'RNN/LSTM', lines: ['Contexto secuencial'] },
        { id: 'transformer', x: 520, y: 160, width: 170, title: 'Transformers', lines: ['Atención'], fill: '#ede9fe' },
        { id: 'llm', x: 700, y: 160, width: 150, title: 'LLM', lines: ['Escalado masivo'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'bow', to: 'embed' },
        { from: 'embed', to: 'rnn' },
        { from: 'rnn', to: 'transformer' },
        { from: 'transformer', to: 'llm' },
      ],
    }),
  'snlp-chapter-6/evolucion': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'hmm', x: 60, y: 160, width: 160, title: 'HMM', lines: ['Modelos estadísticos'] },
        { id: 'gmm', x: 240, y: 160, width: 160, title: 'GMM-HMM', lines: ['Acústica mejorada'] },
        { id: 'dnn', x: 420, y: 160, width: 160, title: 'DNN híbridos', lines: ['CNN/RNN'] },
        { id: 'e2e', x: 600, y: 160, width: 160, title: 'End-to-end', lines: ['CTC', 'Attention'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'hmm', to: 'gmm' },
        { from: 'gmm', to: 'dnn' },
        { from: 'dnn', to: 'e2e' },
      ],
    }),
};
