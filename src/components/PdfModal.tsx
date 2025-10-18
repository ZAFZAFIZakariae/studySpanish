import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

let workerReady = false;
let workerPromise: Promise<void> | null = null;

const ensurePdfWorker = async () => {
  if (workerReady) {
    return;
  }

  if (!workerPromise) {
    workerPromise = import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      .then((module) => {
        const workerSrc = typeof module === 'string' ? module : module?.default;
        if (!workerSrc) {
          throw new Error('Failed to resolve PDF.js worker source.');
        }
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        workerReady = true;
      })
      .catch((error) => {
        workerPromise = null;
        throw error;
      });
  }

  await workerPromise;
};

type PdfModalProps = {
  isOpen: boolean;
  source: string;
  pageNumber: number;
  onClose: () => void;
  title?: string;
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  width: 'min(960px, 100%)',
  maxHeight: '90vh',
  borderRadius: '1rem',
  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.65)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.5rem',
  borderBottom: '1px solid rgba(148, 163, 184, 0.24)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  margin: 0,
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(148, 163, 184, 0.4)',
  borderRadius: '9999px',
  color: '#e2e8f0',
  cursor: 'pointer',
  fontSize: '0.875rem',
  padding: '0.375rem 0.75rem',
};

const contentStyle: React.CSSProperties = {
  padding: '1rem 1.5rem 1.5rem',
  overflow: 'auto',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const statusStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.95rem',
  lineHeight: 1.5,
};

const pdfContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
};

export const PdfModal: React.FC<PdfModalProps> = ({ isOpen, source, pageNumber, onClose, title }) => {
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isWorkerLoaded, setIsWorkerLoaded] = useState<boolean>(() => workerReady);
  const [pageWidth, setPageWidth] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return 720;
    }
    return Math.min(900, window.innerWidth - 120);
  });

  useEffect(() => {
    if (!isOpen || isWorkerLoaded || workerError) {
      return;
    }

    let cancelled = false;
    ensurePdfWorker()
      .then(() => {
        if (!cancelled) {
          setIsWorkerLoaded(true);
        }
      })
      .catch((error) => {
        console.error('[PdfModal] Failed to load PDF worker', error);
        if (!cancelled) {
          setWorkerError('Unable to initialise the PDF renderer.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isWorkerLoaded, workerError]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return;
    }

    const updateWidth = () => {
      setPageWidth(Math.min(900, window.innerWidth - 120));
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setDocumentError(null);
    }
  }, [isOpen, pageNumber, source]);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const resolvedTitle = useMemo(() => title ?? 'Original PDF page', [title]);

  if (!isOpen) {
    return null;
  }

  return (
    <div style={overlayStyle} role="presentation" onClick={handleOverlayClick}>
      <div role="dialog" aria-modal="true" aria-label={resolvedTitle} style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{resolvedTitle}</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Close
          </button>
        </div>
        <div style={contentStyle}>
          {workerError ? (
            <p style={statusStyle}>{workerError}</p>
          ) : !isWorkerLoaded ? (
            <p style={statusStyle}>Preparing the PDF viewer…</p>
          ) : (
            <div style={pdfContainerStyle}>
              <Document
                file={source}
                loading={<p style={statusStyle}>Loading original PDF…</p>}
                onLoadError={(error: Error) => {
                  console.error('[PdfModal] Failed to load PDF document', error);
                  setDocumentError('Unable to load the original PDF.');
                }}
                onLoadSuccess={() => {
                  setDocumentError(null);
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  loading={<p style={statusStyle}>Rendering page…</p>}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </Document>
            </div>
          )}
          {documentError ? <p style={statusStyle}>{documentError}</p> : null}
        </div>
      </div>
    </div>
  );
};

export default PdfModal;
