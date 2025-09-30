import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { lessonFigureRegistry } from '..';
import { lessonSummaryText } from '../../../data/lessonContents/text';

describe('lesson figures', () => {
  afterEach(() => {
    cleanup();
  });

  it('has a renderer for every figure referenced in lesson content', () => {
    const figureRegex = /!\[[^\]]*\]\(figure:([^\)\s]+)\)/g;
    const referenced = new Set<string>();

    for (const text of Object.values(lessonSummaryText)) {
      for (const match of text.matchAll(figureRegex)) {
        const figureId = match[1]?.trim();
        if (figureId) {
          referenced.add(figureId);
        }
      }
    }

    const missing = Array.from(referenced).filter((id) => !lessonFigureRegistry[id]);

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
});
