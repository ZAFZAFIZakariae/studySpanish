import { subjectResourceLibrary } from '../subjectResources';

describe('subjectResourceLibrary', () => {
  it('attaches extracted text for distributed applications session 1 deck', () => {
    const sadResources = subjectResourceLibrary['sad'];
    expect(sadResources).toBeDefined();

    const introDeck = sadResources?.find(
      (resource) => resource.label === 'Session 1 Introduction Deck Bullets Notes (PDF)'
    );

    expect(introDeck).toBeDefined();
    expect(introDeck?.extract?.text).toContain('Introduction: from Monoliths to Distributed Systems');
  });
});
