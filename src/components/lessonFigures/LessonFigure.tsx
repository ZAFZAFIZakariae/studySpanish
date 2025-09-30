import React from 'react';
import { lessonFigureRegistry } from '.';
import { resolveFigureAsset } from './assetMap';

interface LessonFigureProps {
  figureId?: string;
  alt: string;
  caption?: React.ReactNode;
  className?: string;
  mediaClassName?: string;
  captionClassName?: string;
  fallbackClassName?: string;
}

const LessonFigure: React.FC<LessonFigureProps> = ({
  figureId,
  alt,
  caption,
  className,
  mediaClassName,
  captionClassName,
  fallbackClassName,
}) => {
  const renderer = figureId ? lessonFigureRegistry[figureId] : undefined;
  const assetUrl = figureId ? resolveFigureAsset(figureId) : undefined;

  let content: React.ReactNode = null;

  if (renderer) {
    content = renderer(alt);
  } else if (assetUrl) {
    content = <img src={assetUrl} alt={alt} loading="lazy" decoding="async" />;
  }

  if (!content) {
    content = (
      <div role="img" aria-label={`${alt} — diagram unavailable`} className={fallbackClassName}>
        <span aria-hidden="true">🖼️</span>
        <p>Diagram unavailable. Download the PDF to view this figure.</p>
      </div>
    );
  }

  return (
    <figure className={className}>
      <div className={mediaClassName}>{content}</div>
      {caption ? <figcaption className={captionClassName}>{caption}</figcaption> : null}
    </figure>
  );
};

export default LessonFigure;
