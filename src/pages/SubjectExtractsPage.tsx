import React, { useEffect, useMemo, useState, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from '@/lib/remarkGfm';
import { subjectExtracts, type ExtractedSubjectText } from '@/data/subjectExtracts';
import { subjectCatalog } from '@/data/subjectCatalog';
import { resolveSubjectAssetPath } from '@/components/LessonViewer';
import styles from './SubjectExtractsPage.module.css';

type ExtractListItem = {
  id: string;
  label: string;
  description: string;
  meta: string;
  extract: ExtractedSubjectText;
  searchText: string;
};

const subjectNameById = new Map(subjectCatalog.map((subject) => [subject.id.toLowerCase(), subject.name]));

const stripExtension = (value: string): string => value.replace(/\.[^/.]+$/, '');

const prettifySegment = (segment: string): string => {
  const stripped = stripExtension(segment);
  const spaced = stripped.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!spaced) {
    return stripped || segment;
  }
  return spaced.replace(/(^|\s)(\p{L})/gu, (match, boundary: string, letter: string) => `${boundary}${letter.toUpperCase()}`);
};

const deriveDescriptionFromSegments = (segments: string[]): string => {
  if (segments.length >= 2) {
    const focus = prettifySegment(segments[segments.length - 2]);
    if (focus) {
      return `Resource from ${focus}.`;
    }
  }
  if (segments.length >= 1) {
    const focus = prettifySegment(segments[0]);
    if (focus) {
      return `Resource from ${focus}.`;
    }
  }
  return 'Preview extracted study material.';
};

const buildExtractDataset = (): ExtractListItem[] => {
  const dataset: ExtractListItem[] = [];
  const seen = new Set<string>();

  subjectExtracts.forEach((extract) => {
    const source = extract.source.trim();
    if (!source) {
      return;
    }

    const id = source.toLowerCase();
    if (seen.has(id)) {
      return;
    }
    seen.add(id);

    const normalizedSource = source.replace(/^subjects\//i, '');
    const segments = normalizedSource.split('/').filter(Boolean);
    const fileSegment = segments[segments.length - 1] ?? source;
    const subjectSegment = segments[0];

    const subjectName = subjectSegment ? subjectNameById.get(subjectSegment.toLowerCase()) : undefined;
    const fileLabel = prettifySegment(fileSegment);
    const label = subjectName ? `${subjectName} · ${fileLabel}` : fileLabel;
    const description = deriveDescriptionFromSegments(segments);
    const meta = normalizedSource || source;
    const searchText = `${label} ${description} ${meta}`.toLowerCase();

    dataset.push({
      id,
      label,
      description,
      meta,
      extract,
      searchText,
    });
  });

  dataset.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base', numeric: true }));
  return dataset;
};

const extractDataset = buildExtractDataset();

const isExternalHref = (href: string | undefined): boolean => {
  if (!href) {
    return false;
  }
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
};

const markdownComponents: Components = {
  img: ({ src, alt, ...props }) => {
    const resolved = src ? resolveSubjectAssetPath(src) : src;
    return <img {...props} src={resolved || src} alt={alt ?? ''} />;
  },
  a: ({ href, children, ...props }) => {
    const external = isExternalHref(href);
    return (
      <a
        {...props}
        href={href}
        target={external ? '_blank' : props.target}
        rel={external ? 'noreferrer' : props.rel}
      >
        {children}
      </a>
    );
  },
};

const SubjectExtractsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(() => extractDataset[0]?.id ?? '');
  const searchId = useId();

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return extractDataset;
    }
    return extractDataset.filter((item) => item.searchText.includes(normalizedQuery));
  }, [normalizedQuery]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      return;
    }
    if (!filteredItems.some((item) => item.id === activeId)) {
      setActiveId(filteredItems[0].id);
    }
  }, [filteredItems, activeId]);

  const activeItem = useMemo(() => {
    if (!activeId) {
      return filteredItems[0] ?? extractDataset[0] ?? null;
    }
    return extractDataset.find((item) => item.id === activeId) ?? filteredItems[0] ?? extractDataset[0] ?? null;
  }, [activeId, filteredItems]);

  const totalCount = extractDataset.length;
  const resultsLabel = filteredItems.length === 1 ? '1 resource' : `${filteredItems.length} resources`;
  const badgeLabel = filteredItems.length === 0 ? 'No matches' : resultsLabel;

  const statusMessage = useMemo(() => {
    if (totalCount === 0) {
      return 'No subject extracts were found in this build.';
    }
    if (filteredItems.length === 0) {
      return trimmedQuery ? `No matches for "${trimmedQuery}".` : 'No subject extracts match your filters.';
    }
    if (trimmedQuery) {
      return `Showing ${resultsLabel} for "${trimmedQuery}".`;
    }
    return 'Browse available study extracts.';
  }, [filteredItems.length, trimmedQuery, resultsLabel, totalCount]);

  const sourceHref = useMemo(() => {
    if (!activeItem) {
      return undefined;
    }
    const rawSource = activeItem.extract.source;
    if (!rawSource) {
      return undefined;
    }
    const resolved = resolveSubjectAssetPath(rawSource);
    if (!resolved || resolved === '/subject-assets/' || resolved === '/subject-assets') {
      return rawSource.startsWith('/') ? rawSource : `/${rawSource}`;
    }
    return resolved;
  }, [activeItem]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Subject extracts</p>
        <h1 className={styles.title}>Explore extracted study resources</h1>
        <p className={styles.subtitle}>
          Preview every piece of extracted subject material without launching the standalone preview server.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <span className={styles.statusLabel}>Current view</span>
            <span className={styles.statusBadge} aria-live="polite">
              {badgeLabel}
            </span>
          </div>
          <p className={styles.statusMessage}>{statusMessage}</p>
        </div>
        <div className={styles.searchControl}>
          <label className={styles.searchLabel} htmlFor={searchId}>
            Search extracts
          </label>
          <div className={styles.searchInputWrapper}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={styles.searchIcon}
              focusable="false"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 4a6.5 6.5 0 1 1-4.596 11.096L3 18l3-2.904A6.5 6.5 0 0 1 10.5 4z"
              />
            </svg>
            <input
              id={searchId}
              type="search"
              className={styles.searchInput}
              placeholder="Search label, subject, or path…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        <section aria-label="Subject extract list">
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              {trimmedQuery
                ? `No extracts match "${trimmedQuery}". Try a different search term.`
                : 'No subject extracts are available yet.'}
            </div>
          ) : (
            <ul className={styles.cardList} role="list">
              {filteredItems.map((item) => {
                const isActive = activeItem?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${styles.cardButton} ${isActive ? styles.cardActive : ''}`}
                      onClick={() => setActiveId(item.id)}
                      aria-pressed={isActive}
                    >
                      <span className={styles.cardIcon} aria-hidden="true">
                        📄
                      </span>
                      <span className={styles.cardBody}>
                        <span className={styles.cardLabel}>{item.label}</span>
                        <span className={styles.cardDescription}>{item.description}</span>
                        <span className={styles.cardMeta}>{item.meta}</span>
                      </span>
                      <span className={styles.cardAction}>
                        View
                        <span aria-hidden="true">→</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className={styles.detailPanel} aria-live="polite">
          {!activeItem ? (
            <p className={styles.emptyState}>Select an extract to preview its contents.</p>
          ) : (
            <>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>{activeItem.label}</h2>
                <p className={styles.detailSubtitle}>{activeItem.description}</p>
                <p className={styles.detailSource}>Source file: {activeItem.extract.source}</p>
              </div>
              <div className={styles.detailActions}>
                {sourceHref ? (
                  <a className={styles.openButton} href={sourceHref} target="_blank" rel="noreferrer">
                    Open source file
                  </a>
                ) : null}
              </div>
              {activeItem.extract.notes && activeItem.extract.notes.length > 0 ? (
                <section className={styles.notesSection} aria-labelledby="extract-notes-heading">
                  <h3 id="extract-notes-heading" className={styles.notesHeading}>
                    Extraction notes
                  </h3>
                  <ul className={styles.notesList}>
                    {activeItem.extract.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <ReactMarkdown
                className={styles.markdown}
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {activeItem.extract.text}
              </ReactMarkdown>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SubjectExtractsPage;
