import type { ComponentType } from 'react';

declare module 'react-pdf/dist/index.js' {
  export const Document: ComponentType<Record<string, unknown>>;
  export const Page: ComponentType<Record<string, unknown>>;
  export const pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: unknown;
    };
  };
}
