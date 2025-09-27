import { LessonSummaryContent } from '../../types/subject';
import { admeavSlideT0Summary } from './admeav-slide-t0';
import { admeavSlideT1Summary } from './admeav-slide-t1';
import { admeavSlideT2Summary } from './admeav-slide-t2';
import { dbdPresentacionSummary } from './dbd-presentacion';
import { dbdTema1Summary } from './dbd-tema-1';
import { dbdTema2Summary } from './dbd-tema-2';
import { ggoTema1Summary } from './ggo-tema-1';
import { ggoTema2Summary } from './ggo-tema-2';
import { ggoTema3Summary } from './ggo-tema-3';
import { sadSession0Summary } from './sad-session-0';
import { sadSession1Summary } from './sad-session-1';
import { sadSession2Summary } from './sad-session-2';
import { sadSession3Summary } from './sad-session-3';
import { snlpChapter1Summary } from './snlp-chapter-1';
import { snlpChapter2Summary } from './snlp-chapter-2';
import { snlpChapter3Summary } from './snlp-chapter-3';
import { snlpChapter4Summary } from './snlp-chapter-4';
import { snlpChapter5Summary } from './snlp-chapter-5';
import { snlpChapter6Summary } from './snlp-chapter-6';

const lessons: Record<string, LessonSummaryContent> = {
  'sad-session-0': sadSession0Summary,
  'sad-session-1': sadSession1Summary,
  'sad-session-2': sadSession2Summary,
  'sad-session-3': sadSession3Summary,
  'ggo-tema-1': ggoTema1Summary,
  'ggo-tema-2': ggoTema2Summary,
  'ggo-tema-3': ggoTema3Summary,
  'dbd-presentacion': dbdPresentacionSummary,
  'dbd-tema-1': dbdTema1Summary,
  'dbd-tema-2': dbdTema2Summary,
  'snlp-chapter-1': snlpChapter1Summary,
  'snlp-chapter-2': snlpChapter2Summary,
  'snlp-chapter-3': snlpChapter3Summary,
  'snlp-chapter-4': snlpChapter4Summary,
  'snlp-chapter-5': snlpChapter5Summary,
  'snlp-chapter-6': snlpChapter6Summary,
  'admeav-slide-t0': admeavSlideT0Summary,
  'admeav-slide-t1': admeavSlideT1Summary,
  'admeav-slide-t2': admeavSlideT2Summary,
};

export const lessonSummaries = lessons;

export const getLessonSummary = (id: string): LessonSummaryContent => {
  const summary = lessons[id];

  if (!summary) {
    throw new Error(`Missing lesson summary for id: ${id}`);
  }

  return summary;
};
