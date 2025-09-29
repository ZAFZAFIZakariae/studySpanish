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

type Point = {
  x: number;
  y: number;
};

const toArray = (lines?: string[]) => {
  if (!lines) return [] as string[];
  return lines;
};

const contentPadding = 16;
const headerLineHeight = 22;
const bodyLineHeight = 18;
const lineGap = 8;
const approximateCharWidth = 6.2;

const computeCenter = (node: Required<Pick<DiagramNode, 'x' | 'y'>> & {
  width: number;
  height: number;
}) => ({
  x: node.x + node.width / 2,
  y: node.y + node.height / 2,
});

const computeEdgePoint = (
  node: Required<Pick<DiagramNode, 'x' | 'y' | 'width' | 'height'>>,
  target: Point
): Point => {
  const center = computeCenter(node);
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  if (dx === 0 && dy === 0) {
    return center;
  }

  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx === 0) {
    return {
      x: center.x,
      y: center.y + Math.sign(dy) * halfHeight,
    };
  }

  if (absDy === 0) {
    return {
      x: center.x + Math.sign(dx) * halfWidth,
      y: center.y,
    };
  }

  const scaleX = halfWidth / absDx;
  const scaleY = halfHeight / absDy;
  const scale = Math.min(scaleX, scaleY);

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
};

const adjustPointAlongLine = (from: Point, to: Point, distance: number): Point => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / length) * distance,
    y: from.y + (dy / length) * distance,
  };
};

const clampPadding = (lineLength: number, requested: number) => {
  if (lineLength <= 0) {
    return 0;
  }
  const maxPadding = Math.max(0, lineLength / 2 - 1);
  return Math.max(0, Math.min(requested, maxPadding));
};

export const createDiagram = (
  altText: string,
  config: { nodes: DiagramNode[]; links?: DiagramLink[]; options?: DiagramOptions }
) => {
  const { nodes, links = [], options } = config;
  const width = options?.width ?? defaultWidth;
  const height = options?.height ?? defaultHeight;
  const background = options?.background ?? '#f8fafc';

  const nodeMap = new Map(
    nodes.map((node) => {
      const width = node.width ?? 170;
      const linesArray = toArray(node.lines);
      const usableWidth = Math.max(40, width - contentPadding * 2);
      const approxCharsPerLine = Math.max(10, Math.floor(usableWidth / approximateCharWidth));
      const estimatedBodyLines = linesArray.reduce((count, line) => {
        const trimmed = line.trim();
        if (!trimmed) return count + 1;
        return count + Math.max(1, Math.ceil(trimmed.length / approxCharsPerLine));
      }, 0);
      const contentHeight =
        headerLineHeight +
        (estimatedBodyLines > 0 ? lineGap + estimatedBodyLines * bodyLineHeight : 0);
      const minimumHeight = Math.max(90, contentPadding * 2 + contentHeight);
      const height = Math.max(node.height ?? 0, minimumHeight);
      return [
        node.id,
        {
          ...node,
          width,
          height,
          linesArray,
        },
      ];
    })
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
        const centerLines = node.linesArray;
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
            <foreignObject
              x={node.x + contentPadding}
              y={node.y + contentPadding}
              width={node.width - contentPadding * 2}
              height={node.height - contentPadding * 2}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  textAlign: 'center',
                  height: '100%',
                  color: fontColor,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: `${headerLineHeight}px`,
                    marginBottom: centerLines.length > 0 ? lineGap : 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {node.title}
                </div>
                {centerLines.map((line, index) => (
                  <div
                    key={`${node.id}-line-${index}`}
                    style={{
                      fontSize: 13,
                      lineHeight: `${bodyLineHeight}px`,
                      marginTop: index === 0 ? 0 : 4,
                      color: fontColor === '#0f172a' ? '#1f2937' : fontColor,
                      wordBreak: 'break-word',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </foreignObject>
          </g>
        );
      })}
      {links.map((link) => {
        const fromNode = nodeMap.get(link.from);
        const toNode = nodeMap.get(link.to);
        if (!fromNode || !toNode) return null;
        const fromCenter = computeCenter(fromNode);
        const toCenter = computeCenter(toNode);
        const fromEdge = computeEdgePoint(fromNode, toCenter);
        const toEdge = computeEdgePoint(toNode, fromCenter);
        const baseDx = toEdge.x - fromEdge.x;
        const baseDy = toEdge.y - fromEdge.y;
        const baseLength = Math.hypot(baseDx, baseDy);
        const startPadding = clampPadding(baseLength, 12);
        const endPadding = clampPadding(baseLength, 18);
        const start = adjustPointAlongLine(fromEdge, toEdge, startPadding);
        const end = adjustPointAlongLine(toEdge, fromEdge, endPadding);
        const lineDx = end.x - start.x;
        const lineDy = end.y - start.y;
        const lineLength = Math.hypot(lineDx, lineDy) || 1;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const labelDistance = Math.min(18, lineLength / 3);
        let normalX = -lineDy / lineLength;
        let normalY = lineDx / lineLength;
        if (normalY > 0) {
          normalX *= -1;
          normalY *= -1;
        }
        const labelX = midX + normalX * labelDistance;
        const labelY = midY + normalY * labelDistance;
        return (
          <g key={`${link.from}-${link.to}-${link.label ?? 'plain'}`}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#0f172a"
              strokeWidth={1.6}
              strokeDasharray={link.dashed ? '6 4' : undefined}
              markerEnd="url(#diagram-arrowhead)"
            />
            {link.label && (
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
                fill="#0f172a"
              >
                {link.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
