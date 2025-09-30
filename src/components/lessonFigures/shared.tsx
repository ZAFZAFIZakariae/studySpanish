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
  via?: { x: number; y: number }[];
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
const approximateCharWidth = 5.2;
const minimumNodeWidth = 160;

const estimateWrappedLineCount = (text: string, approxCharsPerLine: number) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  const effectiveChars = Math.max(1, Math.floor(approxCharsPerLine));
  let lineCount = 1;
  let currentLineUsage = 0;

  for (const char of trimmed) {
    if (char === '\n') {
      lineCount += 1;
      currentLineUsage = 0;
      continue;
    }

    const charWidth = char === '\t' ? 4 : 1;

    if (currentLineUsage === 0) {
      currentLineUsage = Math.min(charWidth, effectiveChars);
      continue;
    }

    if (currentLineUsage + charWidth > effectiveChars) {
      lineCount += 1;
      currentLineUsage = Math.min(charWidth, effectiveChars);
      continue;
    }

    currentLineUsage += charWidth;
  }

  return lineCount;
};

const collectSegments = (title: string, lines: string[]) => {
  const segments: string[] = [];
  const pushSegments = (value: string) => {
    value
      .split(/\r?\n/)
      .map((segment) => segment.trim())
      .forEach((segment) => {
        if (segment) {
          segments.push(segment);
        }
      });
  };

  pushSegments(title);
  lines.forEach(pushSegments);

  return segments;
};

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

const sanitizePoints = (points: { x: number; y: number }[]) =>
  points.map((point) => ({ x: Number(point.x) || 0, y: Number(point.y) || 0 }));

const applySegmentPadding = (points: Point[]) => {
  if (points.length < 2) {
    return points;
  }

  const [first, second] = points;
  const lastIndex = points.length - 1;
  const last = points[lastIndex];
  const penultimate = points[lastIndex - 1];

  const firstSegmentLength = Math.hypot(second.x - first.x, second.y - first.y);
  const lastSegmentLength = Math.hypot(last.x - penultimate.x, last.y - penultimate.y);

  const startPadding = clampPadding(firstSegmentLength, 16);
  const endPadding = clampPadding(lastSegmentLength, 24);

  const start =
    startPadding > 0 ? adjustPointAlongLine(first, second, startPadding) : { ...first };
  const end = endPadding > 0 ? adjustPointAlongLine(last, penultimate, endPadding) : { ...last };

  if (points.length === 2) {
    return [start, end];
  }

  return [start, ...points.slice(1, -1), end];
};

export const createDiagram = (
  altText: string,
  config: { nodes: DiagramNode[]; links?: DiagramLink[]; options?: DiagramOptions }
) => {
  const { nodes, links = [], options } = config;
  const background = options?.background ?? '#f8fafc';

  let autoWidth = 0;
  let autoHeight = 0;

  const nodeMap = new Map(
    nodes.map((node) => {
      const linesArray = toArray(node.lines);
      const textSegments = collectSegments(node.title, linesArray);
      const longestSegment = textSegments.reduce((max, segment) => Math.max(max, segment.length), 0);
      const baseWidth = node.width ?? minimumNodeWidth;
      const estimatedContentWidth =
        longestSegment > 0 ? longestSegment * approximateCharWidth + approximateCharWidth * 2 : 0;
      const width = Math.max(
        minimumNodeWidth,
        Math.ceil(Math.max(baseWidth, contentPadding * 2 + estimatedContentWidth))
      );
      const usableWidth = Math.max(40, width - contentPadding * 2);
      const approxCharsPerLine = Math.max(10, Math.floor(usableWidth / approximateCharWidth));
      const titleLineCount = Math.max(1, estimateWrappedLineCount(node.title, approxCharsPerLine));
      const estimatedBodyLines = linesArray.reduce((count, line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return count + 1;
        }
        return count + Math.max(1, estimateWrappedLineCount(trimmed, approxCharsPerLine));
      }, 0);
      const contentHeight =
        titleLineCount * headerLineHeight +
        (estimatedBodyLines > 0 ? lineGap + estimatedBodyLines * bodyLineHeight : 0);
      const minimumHeight = Math.max(110, contentPadding * 2 + contentHeight + bodyLineHeight);
      const height = Math.max(node.height ?? 0, minimumHeight);

      autoWidth = Math.max(autoWidth, node.x + width);
      autoHeight = Math.max(autoHeight, node.y + height);

      return [
        node.id,
        {
          ...node,
          width,
          height,
          linesArray,
          titleLineCount,
          bodyLineCount: estimatedBodyLines,
        },
      ];
    })
  );

  const width = Math.max(options?.width ?? defaultWidth, Math.ceil(autoWidth + contentPadding));
  const height = Math.max(options?.height ?? defaultHeight, Math.ceil(autoHeight + contentPadding));

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
                  whiteSpace: 'pre-line',
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: `${headerLineHeight}px`,
                    marginBottom: node.bodyLineCount > 0 ? lineGap : 0,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
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
                      whiteSpace: 'pre-line',
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
        const viaPoints = sanitizePoints(link.via ?? []);
        const toCenter = computeCenter(toNode);
        const fromCenter = computeCenter(fromNode);

        const firstTarget = viaPoints[0] ?? toCenter;
        const lastTarget = viaPoints.length > 0 ? viaPoints[viaPoints.length - 1] : fromCenter;

        const fromEdge = computeEdgePoint(fromNode, firstTarget);
        const toEdge = computeEdgePoint(toNode, lastTarget);

        const rawPoints: Point[] = [fromEdge, ...viaPoints, toEdge];
        const paddedPoints = applySegmentPadding(rawPoints);

        const pathD = paddedPoints
          .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
          .join(' ');

        type Segment = { start: Point; end: Point; dx: number; dy: number; length: number };
        const segments: Segment[] = [];

        for (let index = 1; index < paddedPoints.length; index += 1) {
          const startPoint = paddedPoints[index - 1];
          const endPoint = paddedPoints[index];
          const dx = endPoint.x - startPoint.x;
          const dy = endPoint.y - startPoint.y;
          const length = Math.hypot(dx, dy);
          segments.push({ start: startPoint, end: endPoint, dx, dy, length });
        }

        const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);

        let labelX = 0;
        let labelY = 0;
        let normalX = 0;
        let normalY = -1;

        if (totalLength > 0) {
          const target = totalLength / 2;
          let travelled = 0;

          for (const segment of segments) {
            if (travelled + segment.length >= target) {
              const remaining = target - travelled;
              const ratio = segment.length > 0 ? remaining / segment.length : 0;
              labelX = segment.start.x + segment.dx * ratio;
              labelY = segment.start.y + segment.dy * ratio;
              const scale = segment.length > 0 ? segment.length : 1;
              normalX = -segment.dy / scale;
              normalY = segment.dx / scale;
              break;
            }
            travelled += segment.length;
          }

          if (normalY > 0) {
            normalX *= -1;
            normalY *= -1;
          }
        }

        const labelDistance = Math.min(18, totalLength > 0 ? totalLength / 3 : 0);
        const offsetLabelX = labelX + normalX * labelDistance;
        const offsetLabelY = labelY + normalY * labelDistance;
        return (
          <g key={`${link.from}-${link.to}-${link.label ?? 'plain'}`}>
            <path
              d={pathD}
              fill="none"
              stroke="#0f172a"
              strokeWidth={1.6}
              strokeDasharray={link.dashed ? '6 4' : undefined}
              markerEnd="url(#diagram-arrowhead)"
            />
            {link.label && totalLength > 0 && (
              <text
                x={offsetLabelX}
                y={offsetLabelY}
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
