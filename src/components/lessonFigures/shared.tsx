import React from 'react';

export type FigureRenderer = (altText: string) => JSX.Element;

export type DiagramNode = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  title: string;
  lines?: string[];
  fill?: string;
  textColor?: string;
};

export type DiagramLink = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

export type DiagramOptions = {
  width?: number;
  height?: number;
  background?: string;
};

const defaultWidth = 760;
const defaultHeight = 360;

const toArray = (lines?: string[]) => {
  if (!lines) return [] as string[];
  return lines;
};

const computeCenter = (node: Required<Pick<DiagramNode, 'x' | 'y'>> & {
  width: number;
  height: number;
}) => ({
  x: node.x + node.width / 2,
  y: node.y + node.height / 2,
});

export const createDiagram = (
  altText: string,
  config: { nodes: DiagramNode[]; links?: DiagramLink[]; options?: DiagramOptions }
) => {
  const { nodes, links = [], options } = config;
  const width = options?.width ?? defaultWidth;
  const height = options?.height ?? defaultHeight;
  const background = options?.background ?? '#f8fafc';

  const nodeMap = new Map(
    nodes.map((node) => [node.id, { ...node, width: node.width ?? 170, height: node.height ?? 90 }])
  );

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
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={svgStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="diagram-arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#0f172a" />
        </marker>
      </defs>
      <rect x={0} y={0} width="100%" height="100%" rx={18} fill={background} />
      {Array.from(nodeMap.values()).map((node) => {
        const centerLines = toArray(node.lines);
        const fontColor = node.textColor ?? '#0f172a';
        return (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={14}
              fill={node.fill ?? '#e0f2fe'}
              stroke="#0284c7"
              strokeWidth={1.4}
            />
            <text
              x={node.x + node.width / 2}
              y={node.y + 26}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fill={fontColor}
            >
              {node.title}
            </text>
            {centerLines.map((line, index) => (
              <text
                key={`${node.id}-line-${index}`}
                x={node.x + node.width / 2}
                y={node.y + 48 + index * 18}
                textAnchor="middle"
                fontSize={13}
                fill={fontColor === '#0f172a' ? '#1f2937' : fontColor}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
      {links.map((link) => {
        const fromNode = nodeMap.get(link.from);
        const toNode = nodeMap.get(link.to);
        if (!fromNode || !toNode) return null;
        const fromCenter = computeCenter(fromNode);
        const toCenter = computeCenter(toNode);
        const midX = (fromCenter.x + toCenter.x) / 2;
        const midY = (fromCenter.y + toCenter.y) / 2 - 6;
        return (
          <g key={`${link.from}-${link.to}-${link.label ?? 'plain'}`}>
            <line
              x1={fromCenter.x}
              y1={fromCenter.y}
              x2={toCenter.x}
              y2={toCenter.y}
              stroke="#0f172a"
              strokeWidth={1.6}
              strokeDasharray={link.dashed ? '6 4' : undefined}
              markerEnd="url(#diagram-arrowhead)"
            />
            {link.label && (
              <text x={midX} y={midY} textAnchor="middle" fontSize={12} fontWeight={600} fill="#0f172a">
                {link.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
