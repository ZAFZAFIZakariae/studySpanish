import { createDiagram, type FigureRenderer } from './shared';

export const ggoFigures: Record<string, FigureRenderer> = {
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
};
