import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectCatalog } from '../data/subjectCatalog';
import { subjectResourceLibrary } from '../data/subjectResources';
import type { ResourceLink } from '../types/subject';
import styles from './SubjectPdfBrowserPage.module.css';

type ExtractionState = 'idle' | 'loading' | 'success' | 'error';

type ExtractionStatus = {
  state: ExtractionState;
  message?: string;
};

type SubjectWithPdfResources = {
  id: string;
  name: string;
  slug: string;
  pdfResources: ResourceLink[];
};

const statusClassName: Record<ExtractionState, string> = {
  idle: styles.statusIdle,
  loading: styles.statusLoading,
  success: styles.statusSuccess,
  error: styles.statusError,
};

const isPdfResource = (resource: ResourceLink): boolean => {
  const filePath = resource.filePath ?? resource.extract?.source ?? '';
  if (filePath) {
    return filePath.toLowerCase().endsWith('.pdf');
  }

  if (resource.type) {
    return resource.type === 'pdf';
  }

  const normalizedLabel = resource.label.trim().toLowerCase();
  return normalizedLabel.endsWith('(pdf)') || normalizedLabel.endsWith('.pdf');
};

const getResourceKey = (resource: ResourceLink): string => resource.filePath ?? resource.href;

const SubjectPdfBrowserPage: React.FC = () => {
  const subjectsWithPdfs = useMemo<SubjectWithPdfResources[]>(
    () =>
      subjectCatalog
        .map((subject) => {
          const pdfResources = (subjectResourceLibrary[subject.id] ?? []).filter(isPdfResource);
          return { id: subject.id, name: subject.name, slug: subject.slug, pdfResources } satisfies SubjectWithPdfResources;
        })
        .filter((entry) => entry.pdfResources.length > 0),
    []
  );

  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjectsWithPdfs[0]?.id ?? '');
  const [statuses, setStatuses] = useState<Record<string, ExtractionStatus>>({});
  const navigate = useNavigate();

  const activeSubject = useMemo(
    () => subjectsWithPdfs.find((subject) => subject.id === activeSubjectId) ?? subjectsWithPdfs[0] ?? null,
    [activeSubjectId, subjectsWithPdfs]
  );

  const handleRunExtraction = useCallback(
    async (resource: ResourceLink, subject: SubjectWithPdfResources | null) => {
      const key = getResourceKey(resource);
      const filePath = resource.filePath ?? resource.extract?.source;

      if (!filePath) {
        setStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'error',
            message: 'This PDF does not expose a file path for extraction.',
          },
        }));
        return;
      }

      setStatuses((prev) => ({ ...prev, [key]: { state: 'loading', message: 'Requesting extraction…' } }));

      try {
        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        });

        if (!response.ok) {
          const details = await response.text();
          throw new Error(details || 'Request failed');
        }

        setStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'success',
            message: 'Extraction completed successfully.',
          },
        }));

        if (subject) {
          const runNavigation = () => {
            const searchParams = new URLSearchParams();
            searchParams.set('focus', subject.slug);
            searchParams.set('refresh', Date.now().toString());
            navigate(`/subjects?${searchParams.toString()}`);
          };

          if (typeof window !== 'undefined') {
            window.setTimeout(runNavigation, 1200);
          } else {
            runNavigation();
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error while extracting PDF.';
        setStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'error',
            message,
          },
        }));
      }
    },
    [navigate]
  );

  if (subjectsWithPdfs.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Subject PDF browser</h1>
          <p className={styles.lead}>
            No PDF resources were detected in the subject catalog. Add PDF files to the <code>subjects/</code> directory to get
            started.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Subject PDF browser</h1>
        <p className={styles.lead}>
          Browse every PDF discovered in the subject catalog and trigger the extraction worker without leaving the dashboard.
        </p>
        <div className={styles.controls}>
          <label className={styles.selectLabel} htmlFor="subject-select">
            Subject
          </label>
          <select
            id="subject-select"
            className={styles.subjectSelect}
            value={activeSubject?.id ?? ''}
            onChange={(event) => setActiveSubjectId(event.target.value)}
          >
            {subjectsWithPdfs.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {!activeSubject ? (
        <p className={styles.emptyState}>Select a subject to view its PDF resources.</p>
      ) : activeSubject.pdfResources.length === 0 ? (
        <p className={styles.emptyState}>No PDF resources were found for this subject.</p>
      ) : (
        <div className={styles.resourceList}>
          {activeSubject.pdfResources.map((resource) => {
            const key = getResourceKey(resource);
            const status = statuses[key]?.state ?? 'idle';
            const message = statuses[key]?.message;
            const isLoading = status === 'loading';

            return (
              <article key={key} className={styles.resourceCard}>
                <div className={styles.resourceHeader}>
                  <h2 className={styles.resourceTitle}>{resource.label}</h2>
                  {resource.filePath && <span className={styles.resourceMeta}>{resource.filePath}</span>}
                </div>
                <div className={styles.resourceActions}>
                  {resource.href && (
                    <a className={styles.resourceLink} href={resource.href} target="_blank" rel="noreferrer">
                      Open PDF
                    </a>
                  )}
                  <button
                    type="button"
                    className={styles.runButton}
                    onClick={() => handleRunExtraction(resource, activeSubject)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Running extraction…' : 'Run Extraction'}
                  </button>
                  <span className={`${styles.status} ${statusClassName[status]}`}>
                    {message ?? (status === 'idle' ? 'Ready to extract.' : '')}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectPdfBrowserPage;
