import { admeavFigures } from './admeavFigures';
import { dbdFigures } from './dbdFigures';
import { dbdTema1Figures } from './dbdTema1';
import { ggoFigures } from './ggoFigures';
import { sadFigures } from './sadFigures';
import { snlpFigures } from './snlpFigures';

import type { FigureRenderer } from './shared';

export const subjectFigureRegistry: Record<string, Record<string, FigureRenderer>> = {
  admeav: admeavFigures,
  dbd: { ...dbdFigures, ...dbdTema1Figures },
  ggo: ggoFigures,
  sad: sadFigures,
  snlp: snlpFigures,
};

export const lessonFigureRegistry: Record<string, FigureRenderer> = Object.values(subjectFigureRegistry).reduce(
  (acc, figures) => ({ ...acc, ...figures }),
  {}
);

export { default as LessonFigure } from './LessonFigure';
export type { FigureRenderer };
