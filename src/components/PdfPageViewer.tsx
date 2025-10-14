import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import styles from './PdfPageViewer.module.css';

type PdfPageViewerProps = {
  file: string;
  pageNumber: number;
  title?: string;
  onClose: () => void;
};

type ReactPdfModule = Pick<
  typeof import('react-pdf'),
  'Document' | 'Page' | 'pdfjs'
>;

let reactPdfModulePromise: Promise<ReactPdfModule> | null = null;

const loadReactPdfModule = async (): Promise<ReactPdfModule> => {
  if (!reactPdfModulePromise) {
    reactPdfModulePromise = import('react-pdf/dist/index.js').then(async (module) => {
      const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      const workerSrc = typeof workerModule === 'string' ? workerModule : workerModule.default;
      if (workerSrc) {
        module.pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      }
      return module as unknown as ReactPdfModule;
    }) as Promise<ReactPdfModule>;
  }
  return reactPdfModulePromise!;
};

const LazyDocument = React.lazy(() => loadReactPdfModule().then((module) => ({ default: module.Document })));
const LazyPage = React.lazy(() => loadReactPdfModule().then((module) => ({ default: module.Page })));

const normalizeDialogLabel = (title: string | undefined, pageNumber: number) => {
  if (title && title.trim()) {
    return `${title.trim()} – page ${pageNumber}`;
  }
  return `PDF page ${pageNumber}`;
};

const PdfPageViewer: React.FC<PdfPageViewerProps> = ({ file, pageNumber, title, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const nextWidth = Math.min(entry.contentRect.width, 960);
      setContainerWidth(nextWidth);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const dialogLabel = useMemo(() => normalizeDialogLabel(title, pageNumber), [title, pageNumber]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={handleBackdropClick}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={dialogLabel}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.title}>{title ?? 'Original PDF'}</p>
            <p className={styles.subtitle}>Page {pageNumber}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <div className={styles.body} ref={containerRef}>
          <Suspense
            fallback={
              <div className={styles.loading} role="status">
                Loading PDF…
              </div>
            }
          >
            {loadError ? (
              <div role="alert" className={styles.error}>
                Failed to load the PDF. {loadError}
              </div>
            ) : (
              <LazyDocument file={file} loading="">
                <LazyPage
                  pageNumber={pageNumber}
                  width={containerWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer
                  onRenderError={(error: Error | undefined) =>
                    setLoadError(error?.message ?? 'Unknown error')
                  }
                />
              </LazyDocument>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default PdfPageViewer;
