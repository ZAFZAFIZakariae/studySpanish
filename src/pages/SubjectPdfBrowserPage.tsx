import React, { useCallback, useMemo, useState } from 'react';
import { subjectCatalog } from '../data/subjectCatalog';
import { subjectResourceLibrary } from '../data/subjectResources';
import type { ResourceLink } from '../types/subject';
import styles from './SubjectPdfBrowserPage.module.css';

type ExtractionState = 'idle' | 'loading' | 'success' | 'error';

type ExtractionStatus = {
  state: ExtractionState;
  message?: string;
};

type ExtractedImage = {
  path: string;
  page: number;
  index: number;
  width?: number | null;
  height?: number | null;
  color_space?: string | null;
};

type ExtractionResult = {
  text: string;
  images: ExtractedImage[];
};

type ImageSelection = {
  selected: boolean;
  caption: string;
};

type SubjectWithPdfResources = {
  id: string;
  name: string;
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
          return { id: subject.id, name: subject.name, pdfResources } satisfies SubjectWithPdfResources;
        })
        .filter((entry) => entry.pdfResources.length > 0),
    []
  );

  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjectsWithPdfs[0]?.id ?? '');
  const [statuses, setStatuses] = useState<Record<string, ExtractionStatus>>({});
  const [results, setResults] = useState<Record<string, ExtractionResult>>({});
  const [imageSelections, setImageSelections] = useState<
    Record<string, Record<string, ImageSelection>>
  >({});

  const activeSubject = useMemo(
    () => subjectsWithPdfs.find((subject) => subject.id === activeSubjectId) ?? subjectsWithPdfs[0] ?? null,
    [activeSubjectId, subjectsWithPdfs]
  );

  const handleRunExtraction = useCallback(
    async (resource: ResourceLink) => {
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

        const data = (await response.json()) as Partial<ExtractionResult>;
        const text = typeof data.text === 'string' ? data.text : '';
        const images = Array.isArray(data.images) ? (data.images as ExtractedImage[]) : [];

        setStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'success',
            message: 'Extraction completed successfully.',
          },
        }));
        setResults((prev) => ({
          ...prev,
          [key]: { text, images },
        }));
        setImageSelections((prev) => {
          const currentSelections = prev[key] ?? {};
          const nextSelections: Record<string, ImageSelection> = {};
          images.forEach((image) => {
            const imageKey = image.path;
            nextSelections[imageKey] = currentSelections[imageKey] ?? { selected: false, caption: '' };
          });
          return {
            ...prev,
            [key]: nextSelections,
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error while extracting PDF.';
        setStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'error',
            message,
          },
        }));
        setResults((prev) => {
          if (!(key in prev)) {
            return prev;
          }
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    []
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
            const result = results[key];
            const selections = imageSelections[key] ?? {};

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
                    onClick={() => handleRunExtraction(resource)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Running extraction…' : 'Run Extraction'}
                  </button>
                  <span className={`${styles.status} ${statusClassName[status]}`}>
                    {message ?? (status === 'idle' ? 'Ready to extract.' : '')}
                  </span>
                </div>
                {result && (
                  <div className={styles.previewLayout}>
                    <section className={styles.textPreview}>
                      <header className={styles.previewHeader}>
                        <h3 className={styles.previewTitle}>Extracted text</h3>
                      </header>
                      <div className={styles.previewContent}>
                        {result.text ? result.text : 'No text content extracted.'}
                      </div>
                    </section>
                    <section className={styles.imagePreview}>
                      <header className={styles.previewHeader}>
                        <h3 className={styles.previewTitle}>Extracted images</h3>
                      </header>
                      {result.images.length === 0 ? (
                        <p className={styles.emptyImages}>No images extracted.</p>
                      ) : (
                        <ul className={styles.imageList}>
                          {result.images.map((image) => {
                            const imageKey = image.path;
                            const selection = selections[imageKey] ?? { selected: false, caption: '' };
                            return (
                              <li key={imageKey} className={styles.imageListItem}>
                                <label className={styles.imageSelection}>
                                  <input
                                    type="checkbox"
                                    checked={selection.selected}
                                    onChange={(event) => {
                                      const { checked } = event.target;
                                      setImageSelections((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...(prev[key] ?? {}),
                                          [imageKey]: {
                                            ...(prev[key]?.[imageKey] ?? { caption: '' }),
                                            selected: checked,
                                          },
                                        },
                                      }));
                                    }}
                                  />
                                  <span className={styles.imageMeta}>Page {image.page}</span>
                                </label>
                                <img
                                  className={styles.imageThumbnail}
                                  src={`/${image.path}`}
                                  alt={`Extracted figure from page ${image.page}`}
                                />
                                <input
                                  className={styles.captionInput}
                                  type="text"
                                  placeholder="Add a caption"
                                  value={selection.caption}
                                  onChange={(event) => {
                                    const { value } = event.target;
                                    setImageSelections((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...(prev[key] ?? {}),
                                        [imageKey]: {
                                          ...(prev[key]?.[imageKey] ?? { selected: false }),
                                          caption: value,
                                        },
                                      },
                                    }));
                                  }}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectPdfBrowserPage;
