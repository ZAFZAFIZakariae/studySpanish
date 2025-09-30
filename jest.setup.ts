import '@testing-library/jest-dom';

jest.mock('@/utils/loadKatex', () => {
  const renderToString = jest.fn(() => '<span class="katex-mock" />');
  return {
    loadKatex: jest.fn(() => Promise.resolve({ renderToString })),
  };
});

export {};
