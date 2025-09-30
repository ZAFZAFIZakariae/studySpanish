import { dbdTema1Figures } from './dbdTema1';
import { generalFigures } from './general';

import type { FigureRenderer } from './shared';

export const lessonFigureRegistry: Record<string, FigureRenderer> = {
  ...generalFigures,
  ...dbdTema1Figures,
};

export { default as LessonFigure } from './LessonFigure';
export type { FigureRenderer };
