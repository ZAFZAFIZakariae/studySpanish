import { createDiagram, type FigureRenderer } from './shared';

export const admeavFigures: Record<string, FigureRenderer> = {
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
};
