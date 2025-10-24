import { resolveSubjectAssetPath } from '@/lib/subjectAssets';

describe('resolveSubjectAssetPath', () => {
  it('normalizes paths that reference public subject assets', () => {
    expect(
      resolveSubjectAssetPath(
        '../../public/subject-assets/Admeav/Teoria/slides/T2_CNN based feature extraction _1_/T2_page_001_img1.png',
      ),
    ).toBe(
      '/subject-assets/Admeav/Teoria/slides/T2_CNN%20based%20feature%20extraction%20_1_/T2_page_001_img1.png',
    );
  });

  it('normalizes Valor de TI assets referenced by the Gobierno de TI extracts', () => {
    expect(
      resolveSubjectAssetPath(
        '../../public/subject-assets/Ggo/T2. Valor de TI/23 Valor TI/23 Valor TI_page_001_img_001.jpeg',
      ),
    ).toBe(
      '/subject-assets/Ggo/T2.%20Valor%20de%20TI/23%20Valor%20TI/23%20Valor%20TI_page_001_img_001.jpeg',
    );
  });

  it('strips redundant public and subject-assets prefixes', () => {
    expect(
      resolveSubjectAssetPath(
        'public/subject-assets/Admeav/Teoria/slides/T2_CNN based feature extraction _1_/T2_page_001_img1.png',
      ),
    ).toBe(
      '/subject-assets/Admeav/Teoria/slides/T2_CNN%20based%20feature%20extraction%20_1_/T2_page_001_img1.png',
    );

    expect(
      resolveSubjectAssetPath(
        'subject-assets/Admeav/Teoria/slides/T2_CNN based feature extraction _1_/T2_page_001_img1.png',
      ),
    ).toBe(
      '/subject-assets/Admeav/Teoria/slides/T2_CNN%20based%20feature%20extraction%20_1_/T2_page_001_img1.png',
    );
  });

  it('normalizes absolute subject-asset paths without altering the host prefix', () => {
    expect(
      resolveSubjectAssetPath(
        '/subject-assets/Admeav/Teoria/slides/T2_CNN based feature extraction _1_/T2_page_001_img1.png',
      ),
    ).toBe('/subject-assets/Admeav/Teoria/slides/T2_CNN%20based%20feature%20extraction%20_1_/T2_page_001_img1.png');
  });
});
