import { resolveFigureAsset } from '../assetMap';

jest.mock('../assetModules', () => ({
  __esModule: true,
  default: {
    '../../subjects/Sad/Session_1_Introduction_Deck_Bullets_Notes-images/Session_1_Introduction_Deck_Bullets_Notes_page_001.png':
      '/assets/sad/page-001.png',
    '../subjects/Ggo/Tema/Figura 02.JPG': '/assets/ggo/figure-02.jpg',
  },
}));

describe('resolveFigureAsset', () => {
  it('matches figure identifiers against known assets', () => {
    expect(resolveFigureAsset('Session_1_Introduction_Deck_Bullets_Notes_page_001')).toBe('/assets/sad/page-001.png');
  });

  it('resolves subject paths with various prefixes', () => {
    expect(
      resolveFigureAsset(
        'subjects/Sad/Session_1_Introduction_Deck_Bullets_Notes-images/Session_1_Introduction_Deck_Bullets_Notes_page_001.png',
      ),
    ).toBe('/assets/sad/page-001.png');

    expect(
      resolveFigureAsset(
        '../subjects/Sad/Session_1_Introduction_Deck_Bullets_Notes-images/Session_1_Introduction_Deck_Bullets_Notes_page_001.png',
      ),
    ).toBe('/assets/sad/page-001.png');

    expect(
      resolveFigureAsset('subjects\\Sad\\Session_1_Introduction_Deck_Bullets_Notes-images\\Session_1_Introduction_Deck_Bullets_Notes_page_001.png'),
    ).toBe('/assets/sad/page-001.png');
  });

  it('normalizes underscores and extensions when matching', () => {
    expect(resolveFigureAsset('Ggo/Tema/Figura 02')).toBe('/assets/ggo/figure-02.jpg');
  });

  it('returns undefined when there is no matching asset', () => {
    expect(resolveFigureAsset('missing-figure')).toBeUndefined();
  });
});
