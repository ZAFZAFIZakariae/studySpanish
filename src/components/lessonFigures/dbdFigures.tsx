import { createDiagram, type FigureRenderer } from './shared';

export const dbdFigures: Record<string, FigureRenderer> = {
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
  'dbd-tema-2/recuperacion': (altText) =>
    createDiagram(altText, {
      nodes: [
        {
          id: 'buffer',
          x: 40,
          y: 160,
          width: 200,
          title: 'Buffer manager',
          lines: ['Páginas sucias', 'Pin / unpin'],
        },
        {
          id: 'recovery',
          x: 300,
          y: 100,
          width: 220,
          title: 'Recovery manager',
          lines: ['Analiza', 'Rehace / deshace'],
          fill: '#fef3c7',
        },
        {
          id: 'log',
          x: 300,
          y: 260,
          width: 220,
          title: 'Registro WAL',
          lines: ['Entradas REDO / UNDO'],
          fill: '#ede9fe',
        },
        {
          id: 'disk',
          x: 580,
          y: 160,
          width: 200,
          title: 'Ficheros de datos',
          lines: ['Segmentos en disco'],
          fill: '#dcfce7',
        },
        {
          id: 'checkpoint',
          x: 300,
          y: 20,
          width: 200,
          title: 'Checkpoint',
          lines: ['LSN', 'Dirty page table'],
        },
      ],
      links: [
        { from: 'buffer', to: 'recovery', label: 'Páginas modificadas' },
        { from: 'recovery', to: 'buffer', label: 'Operaciones UNDO', via: [{ x: 200, y: 60 }] },
        { from: 'recovery', to: 'log', label: 'Registros REDO/UNDO' },
        { from: 'log', to: 'recovery', label: 'Lectura secuencial', dashed: true },
        { from: 'log', to: 'disk', label: 'Flush WAL', via: [{ x: 520, y: 300 }] },
        { from: 'recovery', to: 'disk', label: 'Forzar escritura', via: [{ x: 480, y: 80 }] },
        { from: 'checkpoint', to: 'log', label: 'Marca LSN' },
        { from: 'checkpoint', to: 'disk', label: 'Sincroniza buffers', via: [{ x: 520, y: 40 }] },
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
};
