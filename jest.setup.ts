import '@testing-library/jest-dom';

jest.mock('katex', () => ({
  __esModule: true,
  default: {
    renderToString: jest.fn(() => '<span class="katex-mock" />'),
  },
}));

export {};
