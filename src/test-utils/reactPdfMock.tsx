import React from 'react';

type DocumentProps = {
  children?: React.ReactNode;
};

type PageProps = {
  pageNumber?: number;
  width?: number;
};

export const Document: React.FC<DocumentProps> = ({ children }) => (
  <div data-react-pdf-document>{children}</div>
);

export const Page: React.FC<PageProps> = ({ pageNumber }) => (
  <div data-react-pdf-page={pageNumber ?? 1} />
);

export const pdfjs = {
  GlobalWorkerOptions: {
    workerSrc: '',
  },
};

const ReactPdf = {
  Document,
  Page,
  pdfjs,
};

export default ReactPdf;
