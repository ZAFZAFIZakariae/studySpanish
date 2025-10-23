import '@testing-library/jest-dom';

jest.mock('@/utils/loadKatex', () => {
  const renderToString = jest.fn(() => '<span class="katex-mock" />');
  return {
    loadKatex: jest.fn(() => Promise.resolve({ renderToString })),
  };
});

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}

export {};
