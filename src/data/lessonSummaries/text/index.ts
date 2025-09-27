import admeavSlideT0 from './admeav-slide-t0.txt?raw';
import admeavSlideT1 from './admeav-slide-t1.txt?raw';
import admeavSlideT2 from './admeav-slide-t2.txt?raw';
import dbdPresentacion from './dbd-presentacion.txt?raw';
import dbdTema1 from './dbd-tema-1.txt?raw';
import dbdTema2 from './dbd-tema-2.txt?raw';
import ggoTema1 from './ggo-tema-1.txt?raw';
import ggoTema2 from './ggo-tema-2.txt?raw';
import ggoTema3 from './ggo-tema-3.txt?raw';
import sadSession0 from './sad-session-0.txt?raw';
import sadSession1 from './sad-session-1.txt?raw';
import sadSession2 from './sad-session-2.txt?raw';
import sadSession3 from './sad-session-3.txt?raw';
import snlpChapter1 from './snlp-chapter-1.txt?raw';
import snlpChapter2 from './snlp-chapter-2.txt?raw';
import snlpChapter3 from './snlp-chapter-3.txt?raw';
import snlpChapter4 from './snlp-chapter-4.txt?raw';
import snlpChapter5 from './snlp-chapter-5.txt?raw';
import snlpChapter6 from './snlp-chapter-6.txt?raw';

export const lessonSummaryText: Record<string, string> = {
  'admeav-slide-t0': admeavSlideT0,
  'admeav-slide-t1': admeavSlideT1,
  'admeav-slide-t2': admeavSlideT2,
  'dbd-presentacion': dbdPresentacion,
  'dbd-tema-1': dbdTema1,
  'dbd-tema-2': dbdTema2,
  'ggo-tema-1': ggoTema1,
  'ggo-tema-2': ggoTema2,
  'ggo-tema-3': ggoTema3,
  'sad-session-0': sadSession0,
  'sad-session-1': sadSession1,
  'sad-session-2': sadSession2,
  'sad-session-3': sadSession3,
  'snlp-chapter-1': snlpChapter1,
  'snlp-chapter-2': snlpChapter2,
  'snlp-chapter-3': snlpChapter3,
  'snlp-chapter-4': snlpChapter4,
  'snlp-chapter-5': snlpChapter5,
  'snlp-chapter-6': snlpChapter6,
};

export const englishLessonIds = new Set<string>([
  'admeav-slide-t0',
  'admeav-slide-t1',
  'admeav-slide-t2',
  'snlp-chapter-1',
  'snlp-chapter-2',
  'snlp-chapter-3',
  'snlp-chapter-4',
  'snlp-chapter-5',
  'snlp-chapter-6',
]);
