import React from 'react';

export type ReactPdfModule = typeof import('react-pdf');

let reactPdfModulePromise: Promise<ReactPdfModule> | null = null;
let isModuleResolved = false;

const resolveWorkerSource = async (module: ReactPdfModule) => {
  const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  const workerSrc = typeof workerModule === 'string' ? workerModule : workerModule?.default;
  if (!workerSrc) {
    throw new Error('Failed to resolve PDF.js worker source.');
  }
  module.pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
};

export const loadReactPdfModule = async (): Promise<ReactPdfModule> => {
  if (!reactPdfModulePromise) {
    reactPdfModulePromise = (async () => {
      const module = await import('react-pdf');
      await resolveWorkerSource(module);
      isModuleResolved = true;
      return module;
    })().catch((error) => {
      isModuleResolved = false;
      reactPdfModulePromise = null;
      throw error;
    });
  }
  return reactPdfModulePromise;
};

export const hasLoadedReactPdfModule = () => isModuleResolved;

export const preloadReactPdfModule = () => {
  void loadReactPdfModule();
};

export const PdfDocument = React.lazy(() =>
  loadReactPdfModule().then((module) => ({ default: module.Document }))
);

export const PdfPage = React.lazy(() =>
  loadReactPdfModule().then((module) => ({ default: module.Page }))
);
