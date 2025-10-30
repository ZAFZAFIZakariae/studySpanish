import { pickFallbackResource } from '../../lib/fallbackResource';
import { CourseItem, ResourceLink } from '../../types/subject';

describe('pickFallbackResource', () => {
  const baseItem: CourseItem = {
    id: 'ggo-tema-2',
    kind: 'lesson',
    title: 'Tema 2 · Valor de TI',
    language: 'es',
    summary: { original: '' },
    tags: [],
  };

  const makeResource = (overrides: Partial<ResourceLink> & { label: string; href: string }): ResourceLink => {
    const { extract, filePath, ...rest } = overrides;

    return {
      type: 'worksheet',
      label: overrides.label,
      href: overrides.href,
      ...(filePath ? { filePath } : {}),
      ...rest,
      extract: {
        source: extract?.source ?? filePath ?? overrides.href,
        text: extract?.text ?? 'Contenido de muestra',
        ...(extract?.notes ? { notes: extract.notes } : {}),
      },
    };
  };

  it('prefers subject resources whose metadata matches the active lesson', () => {
    const lectureResource = makeResource({
      label: 'Lecture transcription › 08 09 (TXT)',
      href: '#lecture',
      filePath: 'subjects/Ggo/Lecture transcription/08_09.txt',
      extract: {
        source: 'subjects/Ggo/Lecture transcription/08_09.txt',
        text: 'Lecture extract text',
      },
    });

    const temaResource = makeResource({
      label: 'T2. Valor de TI › Tema 2 (TXT)',
      href: '#tema-2',
      filePath: 'subjects/Ggo/T2. Valor de TI/Tema 2.txt',
      extract: {
        source: 'subjects/Ggo/T2. Valor de TI/Tema 2.txt',
        text: 'Tema 2 extract text',
      },
    });

    const fallback = pickFallbackResource(baseItem, [], [lectureResource, temaResource]);
    expect(fallback).not.toBeNull();
    expect(fallback?.label).toBe('T2. Valor de TI › Tema 2 (TXT)');
    expect(fallback?.text).toBe('Tema 2 extract text');
  });

  it('still falls back to the first resource when nothing matches', () => {
    const genericResource = makeResource({
      label: 'General reference (TXT)',
      href: '#generic',
      filePath: 'subjects/Ggo/General/reference.txt',
    });

    const fallback = pickFallbackResource(baseItem, [], [genericResource]);
    expect(fallback).not.toBeNull();
    expect(fallback?.label).toBe('General reference (TXT)');
  });

  it('prioritises lesson-specific resources ahead of subject-level ones', () => {
    const lessonResource = makeResource({
      label: 'Tema 2 resumen (TXT)',
      href: '#lesson',
      filePath: 'subjects/Ggo/T2. Valor de TI/tema-2-resumen.txt',
    });

    const subjectResource = makeResource({
      label: 'Lecture transcription › 08 09 (TXT)',
      href: '#lecture',
      filePath: 'subjects/Ggo/Lecture transcription/08_09.txt',
    });

    const fallback = pickFallbackResource(baseItem, [lessonResource], [subjectResource]);
    expect(fallback).not.toBeNull();
    expect(fallback?.label).toBe('Tema 2 resumen (TXT)');
  });
});
