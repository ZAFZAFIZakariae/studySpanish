import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import LessonFigure from '../LessonFigure';
import { lessonFigureRegistry } from '..';
import { resolveFigureAsset } from '../assetMap';
import { lessonSummaryText } from '../../../data/lessonContents/text';

const figureRegex = /!\[[^\]]*\]\(figure:([^\)\s]+)\)/g;

const collectReferencedFigureIds = (): string[] => {
  const referenced = new Set<string>();

  for (const text of Object.values(lessonSummaryText)) {
    for (const match of text.matchAll(figureRegex)) {
      const figureId = match[1]?.trim();
      if (figureId) {
        referenced.add(figureId);
      }
    }
  }

  return Array.from(referenced);
};

const referencedFigureIds = collectReferencedFigureIds();
const assetOnlyFigureIds = referencedFigureIds.filter(
  (id) => !lessonFigureRegistry[id] && Boolean(resolveFigureAsset(id))
);

describe('lesson figures', () => {
  afterEach(() => {
    cleanup();
  });

  it('has a renderer for every figure referenced in lesson content', () => {
    const missing = referencedFigureIds.filter(
      (id) => !lessonFigureRegistry[id] && !resolveFigureAsset(id)
    );

    expect(missing).toEqual([]);
  });

  it.each(Object.entries(lessonFigureRegistry))('renders figure %s without errors', (figureId, renderer) => {
    const altText = `Test diagram for ${figureId}`;
    expect(() => {
      render(<>{renderer(altText)}</>);
    }).not.toThrow();

    const figure = screen.getByRole('img', { name: altText });
    expect(figure).toBeInTheDocument();
  });

  if (assetOnlyFigureIds.length > 0) {
    it.each(assetOnlyFigureIds)('renders figure %s from static assets', (figureId) => {
      const altText = `Test diagram for ${figureId}`;

      expect(() => {
        render(<LessonFigure figureId={figureId} alt={altText} />);
      }).not.toThrow();

      const figure = screen.getByRole('img', { name: altText });
      expect(figure).toBeInTheDocument();
    });
  } else {
    it('does not rely on static asset fallbacks for referenced figures', () => {
      expect(assetOnlyFigureIds).toEqual([]);
    });
  }
});
