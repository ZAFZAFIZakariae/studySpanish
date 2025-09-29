import React from 'react';
import type { FigureRenderer } from './shared';

type BoxOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  lines?: string[];
  fill?: string;
};

const createLabeledBox = ({ x, y, width, height, title, lines = [], fill = '#e0f2fe' }: BoxOptions) => (
  <g key={`${title}-${x}-${y}`}>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={12}
      fill={fill}
      stroke="#0284c7"
      strokeWidth={1.5}
    />
    <text x={x + width / 2} y={y + 26} textAnchor="middle" fontSize={15} fontWeight={600} fill="#0f172a">
      {title}
    </text>
    {lines.map((line, index) => (
      <text
        key={`${title}-line-${index}`}
        x={x + width / 2}
        y={y + 50 + index * 18}
        textAnchor="middle"
        fontSize={13}
        fill="#1f2937"
      >
        {line}
      </text>
    ))}
  </g>
);

const createArrow = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: { label?: string; offset?: number; dashed?: boolean } = {}
) => {
  const { label, offset = 0, dashed = false } = options;
  const midX = (x1 + x2) / 2 + (y1 === y2 ? 0 : offset);
  const midY = (y1 + y2) / 2 + (x1 === x2 ? 0 : offset);
  const path = `M ${x1} ${y1} L ${x2} ${y2}`;

  return (
    <g key={`arrow-${x1}-${y1}-${x2}-${y2}`}>
      <path d={path} stroke="#0f172a" strokeWidth={1.6} markerEnd="url(#arrowhead)" strokeDasharray={dashed ? '6 4' : undefined} />
      {label && (
        <text x={midX} y={midY - 6} textAnchor="middle" fontSize={12} fill="#0f172a" fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  );
};

const svgBase = (
  altText: string,
  viewBox: string,
  children: React.ReactNode,
  options: { width?: number; height?: number } = {}
) => {
  const { width = 720, height = 360 } = options;
  const svgStyle: React.CSSProperties = {
    display: 'block',
    width: `${width}px`,
    minWidth: `${width}px`,
    height: `${height}px`,
    minHeight: `${height}px`,
  };
  return (
    <svg
      role="img"
      aria-label={altText}
      viewBox={viewBox}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={svgStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#0f172a" />
        </marker>
      </defs>
      <rect x={0} y={0} width="100%" height="100%" fill="#f8fafc" rx={18} />
      {children}
    </svg>
  );
};

export const dbdTema1Figures: Record<string, FigureRenderer> = {
  'dbd-tema-1/esquemas': (altText) =>
    svgBase(
      altText,
      '0 0 720 360',
      <>
        {createLabeledBox({
          x: 32,
          y: 40,
          width: 200,
          height: 110,
          title: 'Esquema lógico',
          lines: ['Tablas y relaciones', 'Consultas SQL'],
        })}
        {createLabeledBox({
          x: 32,
          y: 170,
          width: 200,
          height: 110,
          title: 'Esquema físico',
          lines: ['Índices y ficheros', 'Implementación en disco'],
        })}
        {createLabeledBox({
          x: 268,
          y: 110,
          width: 200,
          height: 120,
          title: 'SGBD Oracle',
          lines: ['Traduce esquemas', 'Gestiona buffers'],
          fill: '#fef3c7',
        })}
        {createLabeledBox({
          x: 508,
          y: 70,
          width: 180,
          height: 120,
          title: 'SQL Developer',
          lines: ['Cliente de consultas', 'Vista para estudiantes'],
          fill: '#ede9fe',
        })}
        {createLabeledBox({
          x: 508,
          y: 210,
          width: 180,
          height: 110,
          title: 'Base de datos Ciclismo',
          lines: ['Persistencia en disco'],
          fill: '#dcfce7',
        })}
        {createArrow(208, 95, 268, 150, { label: 'Definición', offset: -12 })}
        {createArrow(208, 225, 268, 190, { label: 'Implementación', offset: 12 })}
        {createArrow(468, 160, 508, 130, { label: 'Consultas', offset: -14 })}
        {createArrow(508, 240, 468, 210, { label: 'Bloques', offset: 14 })}
        {createArrow(368, 230, 598, 240, { label: 'Persistencia', dashed: true })}
      </>
    ),
  'dbd-tema-1/resumen': (altText) =>
    svgBase(
      altText,
      '0 0 720 360',
      <>
        {createLabeledBox({
          x: 260,
          y: 140,
          width: 200,
          height: 120,
          title: 'SGBD',
          lines: ['Motor central', 'Control de transacciones'],
          fill: '#fef9c3',
        })}
        {createLabeledBox({
          x: 60,
          y: 40,
          width: 180,
          height: 100,
          title: 'Integración',
          lines: ['Datos unificados', 'Persistencia'],
        })}
        {createLabeledBox({
          x: 480,
          y: 40,
          width: 180,
          height: 100,
          title: 'Vistas parciales',
          lines: ['Esquemas externos', 'Experiencia adaptada'],
        })}
        {createLabeledBox({
          x: 60,
          y: 220,
          width: 180,
          height: 110,
          title: 'Integridad',
          lines: ['Concurrencia', 'Recuperación'],
        })}
        {createLabeledBox({
          x: 480,
          y: 220,
          width: 180,
          height: 110,
          title: 'Seguridad',
          lines: ['Usuarios', 'Permisos'],
        })}
        {createArrow(240, 90, 260, 170)}
        {createArrow(460, 90, 460, 170)}
        {createArrow(240, 275, 260, 210)}
        {createArrow(460, 275, 460, 210)}
        <text x={360} y={70} textAnchor="middle" fontSize={16} fontWeight={600} fill="#0f172a">
          Arquitectura en niveles
        </text>
      </>
    ),
  'dbd-tema-1/consulta': (altText) =>
    svgBase(
      altText,
      '0 0 760 360',
      <>
        {createLabeledBox({
          x: 40,
          y: 120,
          width: 160,
          height: 120,
          title: '1. Usuario',
          lines: ['Consulta en vista', 'o esquema lógico'],
          fill: '#ede9fe',
        })}
        {createLabeledBox({
          x: 220,
          y: 70,
          width: 160,
          height: 140,
          title: '2. Traducción',
          lines: ['Esquema externo → lógico', 'Esquema lógico → físico'],
        })}
        {createLabeledBox({
          x: 220,
          y: 230,
          width: 160,
          height: 90,
          title: 'Catálogo',
          lines: ['Metadatos de esquemas'],
          fill: '#dcfce7',
        })}
        {createLabeledBox({
          x: 400,
          y: 120,
          width: 160,
          height: 120,
          title: '3. Lectura',
          lines: ['Solicitud de bloques', 'al sistema operativo'],
          fill: '#bae6fd',
        })}
        {createLabeledBox({
          x: 580,
          y: 120,
          width: 160,
          height: 120,
          title: '4. Resultado',
          lines: ['Datos devueltos', 'sin modificar la BD'],
          fill: '#fef3c7',
        })}
        {createArrow(200, 180, 220, 180)}
        {createArrow(380, 180, 400, 180)}
        {createArrow(560, 180, 580, 180)}
        {createArrow(300, 210, 300, 230, { dashed: true })}
        {createArrow(300, 320, 300, 260, { dashed: true })}
        <text x={300} y={300} textAnchor="middle" fontSize={12} fill="#0f172a">
          Consulta de metadatos
        </text>
      </>
    ),
  'dbd-tema-1/actualizacion': (altText) =>
    svgBase(
      altText,
      '0 0 780 360',
      <>
        {createLabeledBox({
          x: 30,
          y: 120,
          width: 160,
          height: 120,
          title: '1. Usuario',
          lines: ['INSERT / UPDATE / DELETE'],
          fill: '#ede9fe',
        })}
        {createLabeledBox({
          x: 210,
          y: 120,
          width: 160,
          height: 120,
          title: '2. Traducción',
          lines: ['Esquemas externo/lógico/físico'],
        })}
        {createLabeledBox({
          x: 390,
          y: 120,
          width: 160,
          height: 120,
          title: '3. Lectura de bloques',
          lines: ['Carga a buffers'],
          fill: '#bae6fd',
        })}
        {createLabeledBox({
          x: 570,
          y: 70,
          width: 170,
          height: 110,
          title: '4. Actualización',
          lines: ['Cambios en memoria', 'sobre buffers'],
          fill: '#fef3c7',
        })}
        {createLabeledBox({
          x: 570,
          y: 210,
          width: 170,
          height: 110,
          title: '5. Escritura en disco',
          lines: ['Persistencia diferida'],
          fill: '#dcfce7',
        })}
        {createArrow(190, 180, 210, 180)}
        {createArrow(370, 180, 390, 180)}
        {createArrow(550, 130, 570, 125)}
        {createArrow(550, 230, 570, 255)}
        {createArrow(655, 180, 655, 210, { label: 'buffers actualizados' })}
        <text x={480} y={250} textAnchor="middle" fontSize={12} fill="#0f172a">
          Bloques cargados en memoria principal
        </text>
      </>
    ),
  'dbd-tema-1/centralizada': (altText) =>
    svgBase(
      altText,
      '0 0 640 320',
      <>
        {createLabeledBox({
          x: 250,
          y: 120,
          width: 160,
          height: 120,
          title: 'Servidor central',
          lines: ['SGBD + aplicaciones', 'Gestión de E/S'],
          fill: '#fef3c7',
        })}
        {['Terminal 1', 'Terminal 2', 'Terminal 3'].map((title, index) =>
          createLabeledBox({
            x: 60 + index * 190,
            y: 30,
            width: 120,
            height: 80,
            title,
            lines: ['Visualización'],
            fill: '#ede9fe',
          })
        )}
        {['Pantalla', 'Impresora', 'Disco'].map((title, index) =>
          createLabeledBox({
            x: 60 + index * 190,
            y: 240,
            width: 120,
            height: 70,
            title,
            lines: ['E/S centralizada'],
            fill: '#dcfce7',
          })
        )}
        {createArrow(120, 110, 330, 120)}
        {createArrow(310, 110, 330, 120)}
        {createArrow(500, 110, 410, 120)}
        {createArrow(330, 240, 120, 240)}
        {createArrow(330, 240, 310, 240)}
        {createArrow(330, 240, 500, 240)}
        <text x={330} y={210} textAnchor="middle" fontSize={12} fill="#0f172a">
          Red de terminales sin procesamiento local
        </text>
      </>
    ),
  'dbd-tema-1/servicios': (altText) =>
    svgBase(
      altText,
      '0 0 720 360',
      <>
        {createLabeledBox({
          x: 80,
          y: 60,
          width: 160,
          height: 90,
          title: 'Servidor web',
          lines: ['HTTP / APIs'],
        })}
        {createLabeledBox({
          x: 280,
          y: 60,
          width: 160,
          height: 90,
          title: 'Servidor de correo',
          lines: ['Mensajería'],
        })}
        {createLabeledBox({
          x: 480,
          y: 60,
          width: 160,
          height: 90,
          title: 'Servidor de ficheros',
          lines: ['Compartición'],
        })}
        {createLabeledBox({
          x: 280,
          y: 190,
          width: 160,
          height: 110,
          title: 'Servidor SGBD',
          lines: ['Procesamiento SQL', 'Transacciones'],
          fill: '#fef3c7',
        })}
        {['Cliente A', 'Cliente B', 'Cliente C'].map((title, index) =>
          createLabeledBox({
            x: 80 + index * 200,
            y: 320 - 90,
            width: 160,
            height: 80,
            title,
            lines: ['Aplicaciones locales'],
            fill: '#ede9fe',
          })
        )}
        {createArrow(160, 150, 360, 190)}
        {createArrow(360, 150, 360, 190)}
        {createArrow(560, 150, 360, 190)}
        {createArrow(160, 290, 360, 250)}
        {createArrow(360, 290, 360, 250)}
        {createArrow(560, 290, 360, 250)}
        <text x={360} y={20} textAnchor="middle" fontSize={16} fontWeight={600} fill="#0f172a">
          Arquitectura cliente-servidor distribuida
        </text>
      </>
    ),
  'dbd-tema-1/cliente-servidor': (altText) =>
    svgBase(
      altText,
      '0 0 720 360',
      <>
        {createLabeledBox({
          x: 80,
          y: 80,
          width: 220,
          height: 200,
          title: 'Cliente',
          lines: ['Interfaz de usuario', 'Programas Visual / C++ / Java', 'Gestión de interacciones'],
          fill: '#ede9fe',
        })}
        {createLabeledBox({
          x: 420,
          y: 80,
          width: 220,
          height: 200,
          title: 'Servidor SGBD',
          lines: ['Procesador de consultas SQL', 'Gestor de transacciones', 'Acceso al almacenamiento'],
          fill: '#fef3c7',
        })}
        {createArrow(300, 150, 420, 150, { label: 'Consultas SQL' })}
        {createArrow(420, 210, 300, 210, { label: 'Resultados / confirmaciones' })}
        <text x={360} y={320} textAnchor="middle" fontSize={13} fill="#0f172a">
          Colaboración a través de la red sobre un mismo esquema lógico
        </text>
      </>
    ),
  'dbd-tema-1/lab': (altText) =>
    svgBase(
      altText,
      '0 0 720 320',
      <>
        {createLabeledBox({
          x: 80,
          y: 110,
          width: 200,
          height: 120,
          title: 'SQL Developer',
          lines: ['Cliente del laboratorio', 'Consultas y scripts'],
          fill: '#ede9fe',
        })}
        {createLabeledBox({
          x: 300,
          y: 60,
          width: 200,
          height: 100,
          title: 'Servidor Oracle',
          lines: ['Motor SGBD'],
          fill: '#fef3c7',
        })}
        {createLabeledBox({
          x: 300,
          y: 200,
          width: 200,
          height: 90,
          title: 'Esquema lógico Ciclismo',
          lines: ['Tablas compartidas'],
          fill: '#bae6fd',
        })}
        {createLabeledBox({
          x: 520,
          y: 140,
          width: 140,
          height: 100,
          title: 'Administrador',
          lines: ['Controla esquema físico'],
          fill: '#dcfce7',
        })}
        {createArrow(280, 160, 300, 110, { label: 'Conexión', offset: -10 })}
        {createArrow(300, 150, 280, 170, { label: 'Resultados', offset: 10 })}
        {createArrow(400, 160, 400, 200)}
        {createArrow(500, 190, 520, 190)}
        <text x={360} y={30} textAnchor="middle" fontSize={16} fontWeight={600} fill="#0f172a">
          Entorno del laboratorio BDASI
        </text>
      </>
    ),
};

export type { FigureRenderer };
