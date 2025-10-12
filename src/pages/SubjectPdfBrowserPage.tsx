import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

type EditorState = {
  text: string;
  imageOrder: string[];
};

type SaveState = 'idle' | 'saving' | 'success' | 'error';

type SaveStatus = {
  state: SaveState;
  message?: string;
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

const saveStatusClassName: Record<SaveState, string> = {
  idle: styles.statusIdle,
  saving: styles.statusLoading,
  success: styles.statusSuccess,
  error: styles.statusError,
};

type ToastTone = 'success' | 'error';

type ToastState = {
  tone: ToastTone;
  message: string;
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

const normaliseSlashes = (value: string): string => value.replace(/\\/g, '/');

const findSubjectRelativePath = (value: string): string => {
  const normalised = normaliseSlashes(value.trim());
  const lowered = normalised.toLowerCase();
  const marker = 'subjects/';
  const index = lowered.lastIndexOf(marker);
  if (index === -1) {
    return normalised.replace(/^\//, '');
  }
  return normalised.slice(index + marker.length);
};

const resolvePathMetadata = (filePath: string) => {
  const subjectRelativePath = findSubjectRelativePath(filePath);
  const segments = subjectRelativePath.split('/').filter((segment) => segment.length > 0);
  const fileName = segments.pop() ?? '';
  const baseName = fileName.replace(/\.[^.]+$/, '') || fileName;
  const directory = segments.join('/');
  const assetBaseSegments = ['subject-assets', ...segments, baseName];
  const assetBasePath = assetBaseSegments.filter((segment) => segment.length > 0).join('/');
  const sourceLinePath = subjectRelativePath ? `subjects/${subjectRelativePath}` : normaliseSlashes(filePath);
  const outputRelativePath = `src/data/subjectExtracts/subjects/${
    directory ? `${directory}/` : ''
  }${baseName}.txt`;
  return { subjectRelativePath, baseName, directory, assetBasePath, sourceLinePath, outputRelativePath };
};

const getEditorElementId = (key: string): string => `extract-editor-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

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
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({});
  const [toast, setToast] = useState<ToastState | null>(null);
  const [editorStates, setEditorStates] = useState<Record<string, EditorState>>({});

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

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
        setEditorStates((prev) => ({
          ...prev,
          [key]: { text, imageOrder: images.map((image) => image.path) },
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
        setEditorStates((prev) => {
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

  const handleSaveExtract = useCallback(
    async (resource: ResourceLink) => {
      const key = getResourceKey(resource);
      const result = results[key];
      const filePath = resource.filePath ?? resource.extract?.source ?? '';

      if (!filePath) {
        setSaveStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'error',
            message: 'Unable to determine the PDF path for saving.',
          },
        }));
        setToast({ tone: 'error', message: 'Unable to determine the PDF path for saving.' });
        return;
      }

      if (!result) {
        setSaveStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'error',
            message: 'Run an extraction before saving.',
          },
        }));
        setToast({ tone: 'error', message: 'Run an extraction before saving.' });
        return;
      }

      const editorState = editorStates[key];
      const { assetBasePath, sourceLinePath, outputRelativePath } = resolvePathMetadata(filePath);

      const selections = imageSelections[key] ?? {};
      const orderedImages = (editorState?.imageOrder?.length
        ? editorState.imageOrder
        : result.images.map((image) => image.path))
        .map((imageKey) => result.images.find((image) => image.path === imageKey))
        .filter((image): image is ExtractedImage => Boolean(image));
      const selectedImages = orderedImages.filter((image) => selections[image.path]?.selected);

      const imageEntries = selectedImages.map((image) => {
        const selection = selections[image.path];
        const caption = selection?.caption?.trim() || `Figure from page ${image.page}`;
        const fileSegments = normaliseSlashes(image.path).split('/');
        const fileSegment = fileSegments[fileSegments.length - 1];
        const targetPath = `${assetBasePath}/${fileSegment}`.replace(/\/+/g, '/');
        return { image, caption, targetPath };
      });

      const textContent = (editorState?.text ?? result.text).trim();
      const imageMarkdownLines = imageEntries.map(
        ({ caption, targetPath }) => `![${caption}](/${targetPath.replace(/^\/+/, '')})`
      );
      const markdownSections: string[] = [];
      if (textContent) {
        markdownSections.push(textContent);
      }
      if (imageMarkdownLines.length > 0) {
        markdownSections.push(imageMarkdownLines.join('\n'));
      }

      const markdownBody = markdownSections.join('\n\n');
      const finalMarkdown = [`# Extracted content`, `Source: ${sourceLinePath}`]
        .concat(markdownBody ? ['', markdownBody] : [])
        .join('\n')
        .concat('\n');

      setSaveStatuses((prev) => ({
        ...prev,
        [key]: { state: 'saving', message: 'Saving extract…' },
      }));

      try {
        const response = await fetch('/api/save-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath,
            markdown: finalMarkdown,
            assets: imageEntries.map(({ image, targetPath }) => ({
              originalPath: image.path,
              targetPath,
            })),
          }),
        });

        if (!response.ok) {
          const details = await response.text();
          throw new Error(details || 'Failed to save extract');
        }

        setSaveStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'success',
            message: `Saved extract to ${outputRelativePath}`,
          },
        }));
        setToast({
          tone: 'success',
          message: `Saved extract to ${outputRelativePath}`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unexpected error while saving extract.';
        setSaveStatuses((prev) => ({
          ...prev,
          [key]: {
            state: 'error',
            message,
          },
        }));
        setToast({ tone: 'error', message });
      }
    },
    [editorStates, imageSelections, results]
  );

  const handleReorderImage = useCallback(
    (resourceKey: string, imageKey: string, direction: 'up' | 'down') => {
      setEditorStates((prev) => {
        const current = prev[resourceKey];
        if (!current) {
          return prev;
        }
        const order = [...current.imageOrder];
        const currentIndex = order.indexOf(imageKey);
        if (currentIndex === -1) {
          return prev;
        }
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= order.length) {
          return prev;
        }
        [order[currentIndex], order[targetIndex]] = [order[targetIndex], order[currentIndex]];
        return {
          ...prev,
          [resourceKey]: { ...current, imageOrder: order },
        };
      });
    },
    []
  );

  const insertSnippet = useCallback((resourceKey: string, snippet: string) => {
    const textareaId = getEditorElementId(resourceKey);
    let selectionStart: number | null = null;
    let selectionEnd: number | null = null;
    if (typeof window !== 'undefined') {
      const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
      if (textarea) {
        selectionStart = textarea.selectionStart;
        selectionEnd = textarea.selectionEnd;
      }
    }

    let nextCursor = 0;

    setEditorStates((prev) => {
      const current = prev[resourceKey];
      if (!current) {
        return prev;
      }
      const start = selectionStart ?? current.text.length;
      const end = selectionEnd ?? start;
      const nextText = current.text.slice(0, start) + snippet + current.text.slice(end);
      nextCursor = start + snippet.length;
      return {
        ...prev,
        [resourceKey]: { ...current, text: nextText },
      };
    });

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(nextCursor, nextCursor);
        }
      }, 0);
    }
  }, []);

  const handleInsertPageBreak = useCallback(
    (resourceKey: string) => {
      insertSnippet(resourceKey, '\n\n---\n\n');
    },
    [insertSnippet]
  );

  const handleInsertHeading = useCallback(
    (resourceKey: string) => {
      const heading = typeof window !== 'undefined' ? window.prompt('Heading text') : '';
      if (!heading) {
        return;
      }
      insertSnippet(resourceKey, `\n\n## ${heading.trim()}\n\n`);
    },
    [insertSnippet]
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
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.tone === 'success' ? styles.toastSuccess : styles.toastError
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}
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
            const saveStatus = saveStatuses[key]?.state ?? 'idle';
            const saveMessage = saveStatuses[key]?.message;
            const isSaving = saveStatus === 'saving';
            const editorState = editorStates[key];
            const orderedImages = result
              ? (editorState?.imageOrder?.length
                  ? editorState.imageOrder
                  : result.images.map((image) => image.path))
                  .map((imageKey) => result.images.find((image) => image.path === imageKey))
                  .filter((image): image is ExtractedImage => Boolean(image))
              : [];
            const pathMetadata = resource.filePath
              ? resolvePathMetadata(resource.filePath ?? resource.extract?.source ?? '')
              : null;

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
                  {resource.filePath && (
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={() => handleSaveExtract(resource)}
                      disabled={!result || isSaving}
                    >
                      {isSaving ? 'Saving…' : 'Save Extract'}
                    </button>
                  )}
                  <span className={`${styles.status} ${statusClassName[status]}`}>
                    {message ?? (status === 'idle' ? 'Ready to extract.' : '')}
                  </span>
                  {result && (saveStatus !== 'idle' || (saveMessage && saveMessage.length > 0)) && (
                    <span className={`${styles.status} ${saveStatusClassName[saveStatus]}`}>
                      {saveMessage ?? ''}
                    </span>
                  )}
                </div>
                {result && (
                  <div className={styles.previewLayout}>
                    <section className={styles.textPreview}>
                      <header className={styles.previewHeader}>
                        <h3 className={styles.previewTitle}>Extracted text</h3>
                        <div className={styles.editorActions}>
                          <button
                            type="button"
                            className={styles.editorActionButton}
                            onClick={() => handleInsertHeading(key)}
                          >
                            Add heading
                          </button>
                          <button
                            type="button"
                            className={styles.editorActionButton}
                            onClick={() => handleInsertPageBreak(key)}
                          >
                            Insert page break
                          </button>
                        </div>
                      </header>
                      <textarea
                        id={getEditorElementId(key)}
                        className={styles.editorTextarea}
                        value={editorState?.text ?? result.text}
                        onChange={(event) => {
                          const { value } = event.target;
                          setEditorStates((prev) => ({
                            ...prev,
                            [key]: {
                              ...(prev[key] ?? {
                                text: result.text,
                                imageOrder: result.images.map((image) => image.path),
                              }),
                              text: value,
                            },
                          }));
                        }}
                        placeholder="No text content extracted."
                      />
                    </section>
                    <section className={styles.imagePreview}>
                      <header className={styles.previewHeader}>
                        <h3 className={styles.previewTitle}>Extracted images</h3>
                      </header>
                      {orderedImages.length === 0 ? (
                        <p className={styles.emptyImages}>No images extracted.</p>
                      ) : (
                        <ul className={styles.imageList}>
                          {orderedImages.map((image, index) => {
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
                                <div className={styles.reorderButtons}>
                                  <button
                                    type="button"
                                    className={styles.reorderButton}
                                    onClick={() => handleReorderImage(key, imageKey, 'up')}
                                    disabled={index === 0}
                                    aria-label="Move image up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.reorderButton}
                                    onClick={() => handleReorderImage(key, imageKey, 'down')}
                                    disabled={index === orderedImages.length - 1}
                                    aria-label="Move image down"
                                  >
                                    ↓
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                    <section className={styles.markdownPreview}>
                      <header className={styles.previewHeader}>
                        <h3 className={styles.previewTitle}>Markdown preview</h3>
                      </header>
                      <pre className={styles.markdownContent}>
                        {(() => {
                          const selectionsForKey = imageSelections[key] ?? {};
                          const selectedImages = orderedImages.filter(
                            (image) => selectionsForKey[image.path]?.selected
                          );
                          const markdownSections: string[] = [];
                          const textContent = (editorState?.text ?? result.text).trim();
                          if (textContent) {
                            markdownSections.push(textContent);
                          }
                          if (selectedImages.length > 0) {
                            const imageMarkdownLines = selectedImages.map((image) => {
                              const selection = selectionsForKey[image.path];
                              const caption = selection?.caption?.trim() || `Figure from page ${image.page}`;
                              const fileSegments = normaliseSlashes(image.path).split('/');
                              const fileSegment = fileSegments[fileSegments.length - 1];
                              const targetPath = pathMetadata
                                ? `${pathMetadata.assetBasePath}/${fileSegment}`.replace(/\/+/g, '/')
                                : normaliseSlashes(image.path);
                              return `![${caption}](/${targetPath.replace(/^\/+/, '')})`;
                            });
                            markdownSections.push(imageMarkdownLines.join('\n'));
                          }
                          const markdownBody = markdownSections.join('\n\n');
                          const headerLines = ['# Extracted content'];
                          if (pathMetadata) {
                            headerLines.push(`Source: ${pathMetadata.sourceLinePath}`);
                          } else {
                            const fallbackSource =
                              resource.filePath ?? resource.extract?.source ?? resource.href ?? resource.label;
                            if (fallbackSource) {
                              headerLines.push(`Source: ${fallbackSource}`);
                            }
                          }
                          return headerLines
                            .concat(markdownBody ? ['', markdownBody] : [])
                            .join('\n');
                        })()}
                      </pre>
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
