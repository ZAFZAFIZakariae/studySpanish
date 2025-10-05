import { createDiagram, type FigureRenderer } from './shared';

export const sadFigures: Record<string, FigureRenderer> = {
  'sad-session-0/estructura': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'theory', x: 60, y: 80, width: 200, title: 'Teoría & seminarios', lines: ['Martes', 'Sesiones mixtas'] },
        { id: 'labs', x: 460, y: 80, width: 200, title: 'Laboratorio', lines: ['Viernes', 'Hands-on'] },
        {
          id: 'eval',
          x: 260,
          y: 220,
          width: 240,
          title: 'Evaluación',
          lines: ['Examen 25%', 'Proyecto 25%', 'Cuestionarios 25%', 'Lab exam 25%'],
          fill: '#fef3c7',
        },
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
        {
          id: 'services',
          x: 480,
          y: 150,
          width: 200,
          title: 'Servicios distribuidos',
          lines: ['Escalado', 'Releases independientes'],
          fill: '#dcfce7',
        },
      ],
      links: [
        { from: 'mono', to: 'modular', label: 'Refactorización' },
        { from: 'modular', to: 'services', label: 'Extracción de dominios' },
      ],
    }),
  'sad-session-2/elementos': (altText) =>
    createDiagram(altText, {
      nodes: [
        {
          id: 'service',
          x: 300,
          y: 140,
          width: 200,
          title: 'Microservicio',
          lines: ['Responsabilidad clara'],
          fill: '#fef3c7',
        },
        { id: 'domain', x: 60, y: 140, title: 'Dominio', lines: ['Bounded context'] },
        { id: 'team', x: 300, y: 40, title: 'Equipo', lines: ['Autonomía', 'Cadencia propia'] },
        { id: 'contract', x: 540, y: 140, title: 'Contrato/API', lines: ['Compatibilidad', 'Versionado'] },
        {
          id: 'platform',
          x: 300,
          y: 240,
          title: 'Plataforma',
          lines: ['Observabilidad', 'CI/CD', 'Seguridad'],
          fill: '#ede9fe',
        },
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
};
