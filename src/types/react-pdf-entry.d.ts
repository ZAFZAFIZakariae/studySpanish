import type { ComponentType } from 'react';

type ReactPdfDocument = ComponentType<Record<string, unknown>>;
type ReactPdfPage = ComponentType<Record<string, unknown>>;
type ReactPdfModule = {
  Document: ReactPdfDocument;
  Page: ReactPdfPage;
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: unknown;
    };
  };
};

declare module 'react-pdf' {
  export const Document: ReactPdfModule['Document'];
  export const Page: ReactPdfModule['Page'];
  export const pdfjs: ReactPdfModule['pdfjs'];
}

declare module 'react-pdf/dist/index.js' {
  export const Document: ReactPdfModule['Document'];
  export const Page: ReactPdfModule['Page'];
  export const pdfjs: ReactPdfModule['pdfjs'];
}

declare module 'react-pdf/dist/esm/entry.vite' {
  export const Document: ReactPdfModule['Document'];
  export const Page: ReactPdfModule['Page'];
  export const pdfjs: ReactPdfModule['pdfjs'];
}
