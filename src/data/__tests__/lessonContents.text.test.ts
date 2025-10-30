import { lessonContents } from '../../data/lessonContents';

describe('lessonContents text ingestion', () => {
  it('provides English content for bilingual governance lessons', () => {
    const valorLesson = lessonContents['ggo-tema-2'];
    expect(valorLesson).toBeDefined();
    expect(valorLesson.content?.english).toContain('Topic 2');
  });

  it('retains English content for bilingual database theory lessons', () => {
    const dbdLesson = lessonContents['dbd-tema-1'];
    expect(dbdLesson).toBeDefined();
    expect(dbdLesson.content?.english).toContain('Database Management Systems');
  });

  it('exposes English study guides for distributed applications sessions', () => {
    const sadLesson = lessonContents['sad-session-1'];
    expect(sadLesson).toBeDefined();
    expect(sadLesson.content?.english).toContain('From Monoliths to Distributed Systems');
  });
});
