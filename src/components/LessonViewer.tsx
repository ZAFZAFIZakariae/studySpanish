import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from '@/lib/remarkGfm';
import { lessonSummaryText, lessonTextIndexBySubject } from '@/data/lessonContents/text';
import { subjectCatalog } from '@/data/subjectCatalog';
import { LessonFigure } from './lessonFigures';
import styles from './LessonViewer.module.css';

type LessonViewerProps = {
  markdown: string;
  lessonId?: string;
  allLessons?: Array<{ id: string; slug: string; title: string }>;
};

type HeadingNode = {
  id: string;
  title: string;
  depth: number;
  children: HeadingNode[];
};

type HeadingParseResult = {
  headings: HeadingNode[];
  slugAssignments: Map<string, string[]>;
};

const subjectNameMap = new Map(subjectCatalog.map((subject) => [subject.id, subject.name]));

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseHeadingStructure = (markdown: string): HeadingParseResult => {
  const lines = markdown.split(/\r?\n/);
  const stack: HeadingNode[] = [];
  const roots: HeadingNode[] = [];
  const slugSequences = new Map<string, number>();
  const slugAssignments = new Map<string, string[]>();

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (!match) continue;
    const depth = match[1].length;
    const title = match[2].trim();
    const baseSlug = slugify(title);
    const sequence = slugSequences.get(baseSlug) ?? 0;
    const id = sequence === 0 ? baseSlug : `${baseSlug}-${sequence}`;
    slugSequences.set(baseSlug, sequence + 1);
    const assigned = slugAssignments.get(baseSlug) ?? [];
    assigned.push(id);
    slugAssignments.set(baseSlug, assigned);

    const node: HeadingNode = { id, title, depth, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return { headings: roots, slugAssignments };
};

const formatLessonId = (lessonId: string): string =>
  lessonId
    .split('-')
    .map((segment, index) => (index === 0 ? segment.toUpperCase() : segment.charAt(0).toUpperCase() + segment.slice(1)))
    .join(' ');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createSnippet = (text: string, query: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  const index = lower.indexOf(query);
  if (index === -1) {
    return normalized.slice(0, 160) + (normalized.length > 160 ? '…' : '');
  }
  const radius = 80;
  const start = Math.max(0, index - radius);
  const end = Math.min(normalized.length, index + query.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < normalized.length ? '…' : '';
  return `${prefix}${normalized.slice(start, end).trim()}${suffix}`;
};

const SUBJECT_ASSET_PREFIX = '/subject-assets/';
const SUBJECTS_BASE_URL = new URL('subjects/', 'https://lesson-viewer.local/');

const isExternalAsset = (value: string) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value) || value.startsWith('data:') || value.startsWith('blob:');

const resolveLessonImageSource = (rawSrc: string): string => {
  const trimmed = rawSrc.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('figure:') || trimmed.startsWith('/subject-assets/')) {
    return trimmed;
  }

  if (isExternalAsset(trimmed)) {
    return trimmed;
  }

  let normalized = trimmed.replace(/\\/g, '/');
  if (normalized.startsWith('/')) {
    if (/^\/subjects\//i.test(normalized)) {
      normalized = normalized.replace(/^\/subjects\//i, '');
    } else {
      return normalized;
    }
  } else {
    normalized = normalized.replace(/^\.\/+/, '').replace(/^subjects\//i, '');
  }

  try {
    const resolved = new URL(normalized, SUBJECTS_BASE_URL);
    let pathname = resolved.pathname.replace(/^\/+/, '');
    if (/^subjects\//i.test(pathname)) {
      pathname = pathname.replace(/^subjects\//i, '');
    }

    if (!pathname) {
      return trimmed;
    }

    return `${SUBJECT_ASSET_PREFIX}${pathname}${resolved.search}${resolved.hash}`;
  } catch (error) {
    const fallback = normalized.replace(/^\/+/, '');
    if (!fallback) {
      return trimmed;
    }
    return `${SUBJECT_ASSET_PREFIX}${fallback}`;
  }
};

const topAnchorId = 'lesson-viewer-top';

export const LessonViewer: React.FC<LessonViewerProps> = ({ markdown, lessonId, allLessons = [] }) => {
  const { slugAssignments } = useMemo(() => parseHeadingStructure(markdown), [markdown]);

  const allLessonsMap = useMemo(() => new Map(allLessons.map((lesson) => [lesson.id, lesson])), [allLessons]);

  const subjectId = useMemo(() => (lessonId ? lessonId.split('-')[0] : 'general'), [lessonId]);

  const subjectLessons = useMemo(() => {
    if (!lessonId) {
      return [] as Array<{
        id: string;
        slug?: string;
        title: string;
        headings: HeadingNode[];
      }>;
    }

    const ids = lessonTextIndexBySubject.get(subjectId) ?? [];
    const uniqueIds = Array.from(new Set([lessonId, ...ids]));

    return uniqueIds.map((id) => {
      const sourceMarkdown = id === lessonId ? markdown : lessonSummaryText[id] ?? '';
      const { headings } = parseHeadingStructure(sourceMarkdown);
      const lesson = allLessonsMap.get(id);
      const title = headings[0]?.title ?? lesson?.title ?? formatLessonId(id);
      return {
        id,
        slug: lesson?.slug,
        title,
        headings,
      };
    });
  }, [allLessonsMap, lessonId, markdown, subjectId]);

  const subjectName = subjectNameMap.get(subjectId) ?? subjectId.toUpperCase();

  const searchableLessons = useMemo(() => {
    const dataset: Array<{
      id: string;
      slug?: string;
      title: string;
      subjectId: string;
      subjectName: string;
      text: string;
    }> = [];
    const seen = new Set<string>();

    const addLesson = (id: string, text: string) => {
      if (!text.trim() || seen.has(id)) return;
      const { headings } = parseHeadingStructure(text);
      const lesson = allLessonsMap.get(id);
      const subject = id.split('-')[0];
      dataset.push({
        id,
        slug: lesson?.slug,
        title: headings[0]?.title ?? lesson?.title ?? formatLessonId(id),
        subjectId: subject,
        subjectName: subjectNameMap.get(subject) ?? subject.toUpperCase(),
        text,
      });
      seen.add(id);
    };

    for (const [id, text] of Object.entries(lessonSummaryText)) {
      addLesson(id, text);
    }

    if (lessonId) {
      addLesson(lessonId, markdown);
    }

    return dataset;
  }, [allLessonsMap, lessonId, markdown]);

  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [] as Array<{
      id: string;
      slug?: string;
      title: string;
      subjectId: string;
      subjectName: string;
      snippet: string;
    }>;

    return searchableLessons
      .filter((lesson) => lesson.text.toLowerCase().includes(query))
      .slice(0, 8)
      .map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        subjectId: lesson.subjectId,
        subjectName: lesson.subjectName,
        snippet: createSnippet(lesson.text, query),
      }));
  }, [searchQuery, searchableLessons]);

  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set(lessonId ? [lessonId] : [])
  );

  useEffect(() => {
    if (!lessonId) return;
    setExpandedLessons((prev) => {
      if (prev.has(lessonId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(lessonId);
      return next;
    });
  }, [lessonId]);

  const toggleLesson = (id: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderHeadingNodes = (nodes: HeadingNode[], isActiveLesson: boolean): React.ReactNode => (
    <ul className={styles.treeHeadingList} role="list">
      {nodes.map((node) => (
        <li key={node.id} className={styles.treeHeadingItem}>
          {isActiveLesson ? (
            <a href={`#${node.id}`} className={styles.treeHeadingLink}>
              {node.title}
            </a>
          ) : (
            <span className={styles.treeHeadingLabel}>{node.title}</span>
          )}
          {node.children.length > 0 ? renderHeadingNodes(node.children, isActiveLesson) : null}
        </li>
      ))}
    </ul>
  );

  const headingUsage = useMemo(() => new Map<string, number>(), [markdown]);

  const headingComponents = useMemo(() => {
    const getHeadingId = (node: any) => {
      const rawText = String(
        (node.children ?? [])
          .map((child: any) => {
            if (typeof child.value === 'string') return child.value;
            if (Array.isArray(child.children)) {
              return child.children.map((nested: any) => nested.value ?? '').join('');
            }
            return '';
          })
          .join('')
      );
      const base = slugify(rawText);
      const assigned = slugAssignments.get(base) ?? [base];
      const count = headingUsage.get(base) ?? 0;
      headingUsage.set(base, count + 1);
      return assigned[Math.min(count, assigned.length - 1)] ?? base;
    };

    const createHeadingRenderer = (level: 1 | 2 | 3) =>
      ({ node, children, ...props }: any) => {
        const id = getHeadingId(node);
        return React.createElement(
          `h${level}`,
          { ...props, id, className: styles[`heading${level}` as const] },
          children
        );
      };

    return {
      h1: createHeadingRenderer(1),
      h2: createHeadingRenderer(2),
      h3: createHeadingRenderer(3),
      img: ({ src, alt, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => {
        if (typeof src === 'string' && src.startsWith('figure:')) {
          const figureId = src.replace(/^figure:/, '');
          return (
            <LessonFigure
              figureId={figureId}
              alt={alt ?? ''}
              className={styles.figure}
              mediaClassName={styles.figureMedia}
              captionClassName={styles.figureCaption}
              fallbackClassName={styles.figureFallback}
            />
          );
        }

        if (typeof src === 'string') {
          const resolvedSrc = resolveLessonImageSource(src);
          const { className, ...imageProps } = rest;
          const mergedClassName = [styles.markdownImage, className].filter(Boolean).join(' ');
          return (
            <img
              src={resolvedSrc}
              alt={alt ?? ''}
              className={mergedClassName}
              loading="lazy"
              {...imageProps}
            />
          );
        }

        return <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} {...rest} />;
      },
    };
  }, [headingUsage, slugAssignments]);

  const currentSubjectLessons = subjectLessons.map((lesson) => {
    const isExpanded = expandedLessons.has(lesson.id);
    const isActive = lesson.id === lessonId;
    return (
      <li key={lesson.id} className={styles.treeLesson}>
        <div className={styles.treeLessonHeader}>
          <button
            type="button"
            className={styles.treeToggle}
            onClick={() => toggleLesson(lesson.id)}
            aria-expanded={isExpanded}
            aria-controls={`lesson-tree-${lesson.id}`}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
          {lesson.slug ? (
            <Link
              to={`/lessons/${lesson.slug}`}
              className={`${styles.treeLessonLink} ${isActive ? styles.treeLessonLinkActive : ''}`}
            >
              {lesson.title}
            </Link>
          ) : (
            <span className={`${styles.treeLessonLink} ${isActive ? styles.treeLessonLinkActive : ''}`}>
              {lesson.title}
            </span>
          )}
        </div>
        {isExpanded && lesson.headings.length > 0 ? (
          <div id={`lesson-tree-${lesson.id}`} className={styles.treeLessonBody}>
            {renderHeadingNodes(lesson.headings, isActive)}
          </div>
        ) : null}
      </li>
    );
  });

  const renderSearchResultSnippet = (snippet: string, query: string) => {
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'ig');
    return snippet.split(regex).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={`${part}-${index}`}>{part}</mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    );
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidePanel} aria-label="Lesson navigation panel">
        <section className={styles.panelSection} aria-label="Search lessons">
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Search lessons</h3>
            <p className={styles.panelSubtitle}>
              Find topics across every slide and lab.
            </p>
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={styles.searchInput}
            placeholder="Search theory and labs…"
            aria-label="Search lesson notes"
          />
          {searchQuery.trim() ? (
            <ul className={styles.searchResults} role="list">
              {searchResults.length === 0 ? (
                <li className={styles.searchEmpty}>No matches found.</li>
              ) : (
                searchResults.map((result) => {
                  const isCurrent = result.id === lessonId;
                  const content = (
                    <>
                      <div className={styles.resultMeta}>
                        <span>{subjectNameMap.get(result.subjectId) ?? result.subjectName}</span>
                        <span aria-hidden="true">›</span>
                        <span>{result.title}</span>
                      </div>
                      <p className={styles.resultSnippet}>
                        {renderSearchResultSnippet(result.snippet, searchQuery.trim())}
                      </p>
                    </>
                  );

                  if (isCurrent) {
                    return (
                      <li key={result.id}>
                        <a href={`#${topAnchorId}`} className={styles.resultLink}>
                          {content}
                        </a>
                      </li>
                    );
                  }

                  if (result.slug) {
                    return (
                      <li key={result.id}>
                        <Link to={`/lessons/${result.slug}`} className={styles.resultLink}>
                          {content}
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={result.id}>
                      <span className={`${styles.resultLink} ${styles.resultLinkDisabled}`} aria-disabled="true">
                        {content}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          ) : null}
        </section>
        <section className={styles.panelSection} aria-label="Subject outline">
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{subjectName}</h3>
            <p className={styles.panelSubtitle}>Browse slides, labs, and sections.</p>
          </div>
          <nav className={styles.tree} aria-label={`${subjectName} lesson outline`}>
            <ul className={styles.treeList} role="list">
              {currentSubjectLessons}
            </ul>
          </nav>
        </section>
      </aside>
      <div className={styles.content} id={topAnchorId}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={headingComponents}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default LessonViewer;
