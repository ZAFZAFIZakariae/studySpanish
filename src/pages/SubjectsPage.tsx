import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subjectCatalog, computeCatalogInsights } from '../data/subjectCatalog';
import { CourseItem, ResourceLink } from '../types/subject';
import { describeDueDate } from '../lib/plannerUtils';
import { subjectResourceLibrary } from '../data/subjectResources';
import styles from './SubjectsPage.module.css';
import { LessonFigure } from '../components/lessonFigures';
import InlineMarkdown from '../components/InlineMarkdown';
import NotebookPreview from '../components/notebooks/NotebookPreview';
import PdfPageViewer from '../components/PdfPageViewer';

type OrderedListStyle = 'decimal' | 'upper-roman' | 'lower-roman' | 'upper-alpha' | 'lower-alpha';

const itemKindIcon: Record<CourseItem['kind'], string> = {
  lesson: '📘',
  reading: '📖',
  assignment: '📝',
  lab: '🧪',
  project: '🎯',
};

const statusCopy: Record<NonNullable<CourseItem['status']>, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  submitted: 'Submitted',
  graded: 'Graded',
  blocked: 'Blocked',
  scheduled: 'Scheduled',
};

const translationStatusLabel: Record<string, string> = {
  complete: 'English ready',
  partial: 'English in progress',
  machine: 'Machine translated',
  planned: 'Translation planned',
};

const resourceTypeIcon: Record<NonNullable<ResourceLink['type']>, string> = {
  pdf: '📄',
  slides: '🖥️',
  worksheet: '📝',
};

type ResourceTreeNode =
  | { kind: 'group'; label: string; key: string; children: ResourceTreeNode[] }
  | { kind: 'resource'; label: string; key: string; resource: ResourceLink };

const resourceTreeCollator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

type PdfPageLocation = {
  href: string;
  label: string;
  pageNumber: number;
};

type PdfResourceIndex = {
  href: string;
  label: string;
  pages: Array<{ pageNumber: number; normalizedText: string }>;
};

const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const toPlainText = (value: string): string =>
  value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~([^~]+)~/g, '$1')
    .replace(/\[(.+?)]\(.+?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const createHeadingCandidates = (heading: string): string[] => {
  const plain = toPlainText(heading);
  if (!plain) {
    return [];
  }

  const variants = new Set<string>();
  const normalized = normalizeSearchText(plain);
  if (normalized.length > 2) {
    variants.add(normalized);
  }

  const withoutParentheses = plain.replace(/\([^)]*\)/g, ' ');
  const normalizedWithoutParentheses = normalizeSearchText(withoutParentheses);
  if (normalizedWithoutParentheses.length > 2) {
    variants.add(normalizedWithoutParentheses);
  }

  plain.split(/[·:]/).forEach((fragment) => {
    const candidate = normalizeSearchText(fragment);
    if (candidate.length > 2) {
      variants.add(candidate);
    }
  });

  return Array.from(variants);
};

const buildPdfResourceIndex = (resource: ResourceLink): PdfResourceIndex | null => {
  if (!resource.extract?.text) {
    return null;
  }

  const lines = resource.extract.text.split('\n');
  const pages: PdfResourceIndex['pages'] = [];
  let currentPage: number | null = null;
  let buffer: string[] = [];

  const flushPage = () => {
    if (currentPage === null) {
      return;
    }
    const rawText = buffer.join(' ').trim();
    if (!rawText) {
      buffer = [];
      return;
    }
    pages.push({ pageNumber: currentPage, normalizedText: normalizeSearchText(rawText) });
    buffer = [];
  };

  lines.forEach((line) => {
    const match = line.match(/^###\s+Page\s+(\d+)/i);
    if (match) {
      flushPage();
      currentPage = Number.parseInt(match[1] ?? '', 10);
      buffer = [];
      return;
    }
    buffer.push(line);
  });

  flushPage();

  if (pages.length === 0) {
    return null;
  }

  return {
    href: resource.href,
    label: resource.label,
    pages,
  };
};

const splitResourceLabel = (label: string): string[] =>
  label
    .split('›')
    .map((segment) => segment.replace(/›/g, '').trim())
    .filter((segment) => segment.length > 0);

const countTreeResources = (nodes: ResourceTreeNode[]): number =>
  nodes.reduce(
    (total, node) => total + (node.kind === 'resource' ? 1 : countTreeResources(node.children)),
    0
  );

const buildResourceTree = (links: ResourceLink[]): ResourceTreeNode[] => {
  const root: ResourceTreeNode[] = [];

  links.forEach((resource) => {
    const segments = splitResourceLabel(resource.label);
    const effectiveSegments = segments.length > 0 ? segments : [resource.label.trim() || 'Resource'];

    let currentLevel = root;
    const pathSegments: string[] = [];

    effectiveSegments.forEach((segment, index) => {
      const isLeaf = index === effectiveSegments.length - 1;
      const pathKey = [...pathSegments, segment].join(' / ');

      if (isLeaf) {
        currentLevel.push({
          kind: 'resource',
          label: segment,
          key: `${pathKey}::${resource.href}`,
          resource,
        });
        return;
      }

      let groupNode = currentLevel.find(
        (node): node is Extract<ResourceTreeNode, { kind: 'group' }> => node.kind === 'group' && node.label === segment
      );

      if (!groupNode) {
        groupNode = { kind: 'group', label: segment, key: pathKey, children: [] };
        currentLevel.push(groupNode);
      }

      pathSegments.push(segment);
      currentLevel = groupNode.children;
    });
  });

  const sortTree = (nodes: ResourceTreeNode[]) => {
    nodes.sort((a, b) => resourceTreeCollator.compare(a.label, b.label));
    nodes.forEach((node) => {
      if (node.kind === 'group') {
        sortTree(node.children);
      }
    });
  };

  sortTree(root);
  return root;
};

const translationPlaceholderPatterns = [
  /resumen en inglés/i,
  /english summary/i,
  /pendiente de traducir/i,
  /coming soon/i,
];

const isPlaceholderSummary = (text?: string) => {
  if (!text) {
    return true;
  }
  return translationPlaceholderPatterns.some((pattern) => pattern.test(text));
};

const fetchEnglishSummary = async (text: string): Promise<string | null> => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const response = await fetch('/api/gemini/summaries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: trimmed }),
    });

    if (!response.ok) {
      console.warn('Failed to fetch Gemini English summary', response.status, response.statusText);
      return null;
    }

    const payload = (await response.json()) as { summary?: string | null };
    const summary = payload.summary?.trim();

    // TODO: Cache the summary in IndexedDB (Dexie) or persist it on the item so we only fetch once.
    return summary && summary.length > 0 ? summary : null;
  } catch (error) {
    console.error('Gemini English summary request failed', error);
    return null;
  }
};

const romanMap: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

const romanToNumber = (value: string) => {
  const chars = value.toUpperCase().split('');
  let total = 0;
  let previous = 0;
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    const current = romanMap[chars[i]] ?? 0;
    if (current < previous) {
      total -= current;
    } else {
      total += current;
      previous = current;
    }
  }
  return total || 1;
};

const decodeOrderedMarker = (marker: string): { style: OrderedListStyle; value: number } => {
  if (/^\d+$/.test(marker)) {
    return { style: 'decimal', value: parseInt(marker, 10) };
  }
  if (/^[IVXLCDM]+$/.test(marker)) {
    return { style: 'upper-roman', value: romanToNumber(marker) };
  }
  if (/^[ivxlcdm]+$/.test(marker)) {
    return { style: 'lower-roman', value: romanToNumber(marker) };
  }
  if (/^[A-Z]$/.test(marker)) {
    return { style: 'upper-alpha', value: marker.charCodeAt(0) - 64 };
  }
  if (/^[a-z]$/.test(marker)) {
    return { style: 'lower-alpha', value: marker.charCodeAt(0) - 96 };
  }
  return { style: 'decimal', value: parseInt(marker, 10) || 1 };
};

const normalizeCalloutIntent = (intent: string): 'note' | 'info' | 'warning' | 'tip' => {
  const upper = intent.toUpperCase();
  if (upper === 'WARNING' || upper === 'CAUTION' || upper === 'DANGER') {
    return 'warning';
  }
  if (upper === 'TIP' || upper === 'SUCCESS') {
    return 'tip';
  }
  if (upper === 'INFO' || upper === 'IMPORTANT') {
    return 'info';
  }
  return 'note';
};

const formatMilestoneDate = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatMinutes = (minutes?: number) => {
  if (!minutes) return 'Flexible time';
  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!remaining) {
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  return `${hours} hr${hours === 1 ? '' : 's'} ${remaining} min`;
};

const formatLanguage = (language: CourseItem['language']) => (language === 'es' ? 'Spanish' : 'English');

const SubjectsPage: React.FC = () => {
  const { metrics: catalogMetrics, totals } = useMemo(() => computeCatalogInsights(subjectCatalog), []);
  const metricsMap = useMemo(
    () => new Map(catalogMetrics.map((entry) => [entry.subject.id, entry])),
    [catalogMetrics]
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const slugToId = useMemo(
    () =>
      subjectCatalog.reduce<Record<string, string>>((acc, subject) => {
        acc[subject.slug] = subject.id;
        return acc;
      }, {}),
    []
  );

  const initialSubjectId = useMemo(() => {
    const focusSlug = searchParams.get('focus');
    if (focusSlug && slugToId[focusSlug]) {
      return slugToId[focusSlug];
    }
    return catalogMetrics[0]?.subject.id ?? '';
  }, [catalogMetrics, searchParams, slugToId]);

  const [activeSubjectId, setActiveSubjectId] = useState(initialSubjectId);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    setActiveSubjectId(initialSubjectId);
  }, [initialSubjectId]);

  useEffect(() => {
    const activeSubject = subjectCatalog.find((subject) => subject.id === activeSubjectId);
    const currentSlug = searchParams.get('focus');

    if (!activeSubject) {
      if (currentSlug) {
        const next = new URLSearchParams(searchParams);
        next.delete('focus');
        setSearchParams(next, { replace: true });
      }
      return;
    }

    if (currentSlug === activeSubject.slug) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set('focus', activeSubject.slug);
    setSearchParams(next, { replace: true });
  }, [activeSubjectId, searchParams, setSearchParams]);

  const activeSubject = useMemo(
    () => subjectCatalog.find((subject) => subject.id === activeSubjectId),
    [activeSubjectId]
  );

  const activeCourse = useMemo(
    () => (activeSubject ? activeSubject.courses.find((course) => course.id === activeCourseId) ?? null : null),
    [activeCourseId, activeSubject]
  );
  const activeItem = useMemo(
    () => (activeCourse ? activeCourse.items.find((item) => item.id === activeItemId) ?? null : null),
    [activeCourse, activeItemId]
  );
  const resources = activeSubject ? subjectResourceLibrary[activeSubject.id] ?? [] : [];
  const itemResources = activeItem?.resources ?? [];
  const resourcesWithExtract = useMemo(
    () =>
      resources.filter((resource) => {
        const extractText = resource.extract?.text;
        return Boolean(extractText && extractText.trim().length > 0);
      }),
    [resources]
  );
  const translationDetails = useMemo(() => {
    if (!activeItem?.translation) {
      return null;
    }
    const summary = !isPlaceholderSummary(activeItem.translation.summary)
      ? activeItem.translation.summary?.trim()
      : undefined;
    const notes = activeItem.translation.notes?.trim();
    const glossary = (activeItem.translation.glossary ?? [])
      .map((term) => term.trim())
      .filter((term) => term.length > 0);
    const vocabulary = (activeItem.translation.vocabulary ?? []).filter(
      (entry) => entry.term && entry.translation
    );
    const milestones = activeItem.translation.milestones ?? [];
    const hasDetails = Boolean(summary || notes || glossary.length || vocabulary.length || milestones.length);
    if (!hasDetails) {
      return null;
    }
    return {
      status: activeItem.translation.status,
      summary,
      notes,
      glossary,
      vocabulary,
      milestones,
    };
  }, [activeItem]);
  const summaryInfo = useMemo(() => {
    if (!activeItem) {
      return {
        original: '',
        english: undefined as string | undefined,
        showEnglish: false,
        placeholder: true,
      };
    }

    const original = activeItem.summary.original?.trim() ?? '';
    const englishRaw = activeItem.summary.english?.trim();
    const englishFromItem = !isPlaceholderSummary(englishRaw) ? englishRaw : undefined;
    const translationFallback = activeItem.translation?.summary?.trim();
    const englishFallback = !isPlaceholderSummary(translationFallback) ? translationFallback : undefined;
    const english = englishFromItem ?? englishFallback;
    const showEnglish = Boolean(english && english !== original);
    const placeholder = !englishFromItem;

    return { original, english, showEnglish, placeholder };
  }, [activeItem]);
  const [pdfPreview, setPdfPreview] = useState<PdfPageLocation | null>(null);

  const pdfResourceIndexes = useMemo(() => {
    if (!activeItem?.resources) {
      return [] as PdfResourceIndex[];
    }

    return activeItem.resources
      .filter((resource) => resource.type === 'pdf')
      .map((resource) => buildPdfResourceIndex(resource))
      .filter((index): index is PdfResourceIndex => Boolean(index));
  }, [activeItem?.resources]);

  const headingToPdfCache = useMemo(() => new Map<string, PdfPageLocation | null>(), [pdfResourceIndexes]);

  const resolveHeadingToPdf = useCallback(
    (heading: string): PdfPageLocation | null => {
      if (pdfResourceIndexes.length === 0) {
        return null;
      }

      if (headingToPdfCache.has(heading)) {
        return headingToPdfCache.get(heading) ?? null;
      }

      const candidates = createHeadingCandidates(heading);
      if (candidates.length === 0) {
        headingToPdfCache.set(heading, null);
        return null;
      }

      for (const candidate of candidates) {
        for (const resource of pdfResourceIndexes) {
          const match = resource.pages.find((page) => page.normalizedText.includes(candidate));
          if (match) {
            const location: PdfPageLocation = {
              href: resource.href,
              label: resource.label,
              pageNumber: match.pageNumber,
            };
            headingToPdfCache.set(heading, location);
            return location;
          }
        }
      }

      headingToPdfCache.set(heading, null);
      return null;
    },
    [headingToPdfCache, pdfResourceIndexes]
  );

  const handlePdfRequest = useCallback((location: PdfPageLocation) => {
    setPdfPreview(location);
  }, []);

  type ContentBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'heading'; level: 1 | 2 | 3; text: string }
    | { type: 'list'; heading?: string; items: string[] }
    | { type: 'ordered-list'; heading?: string; items: string[]; style: OrderedListStyle; start: number }
    | { type: 'figure'; alt: string; caption?: string; src?: string; figureId?: string }
    | { type: 'callout'; intent: 'note' | 'info' | 'warning' | 'tip'; title: string; lines: string[] };

  const createContentBlocks = (text: string): ContentBlock[] => {
    const lines = text.split('\n');
    const blocks: ContentBlock[] = [];
    let paragraphBuffer: string[] = [];
    let listBuffer: string[] | null = null;
    let listHeading: string | undefined;
    let orderedListBuffer: string[] | null = null;
    let orderedListHeading: string | undefined;
    let orderedListStyle: OrderedListStyle = 'decimal';
    let orderedListStart = 1;
    let pendingListHeading: string | null = null;
    let calloutBuffer: { intent: 'note' | 'info' | 'warning' | 'tip'; title: string; lines: string[] } | null = null;

    const flushParagraph = () => {
      if (paragraphBuffer.length > 0) {
        const paragraphText = paragraphBuffer.join(' ').trim();
        if (paragraphText) {
          blocks.push({ type: 'paragraph', text: paragraphText });
        }
        paragraphBuffer = [];
      }
    };

    const flushList = () => {
      if (listBuffer && listBuffer.length > 0) {
        blocks.push({ type: 'list', heading: listHeading, items: listBuffer });
      }
      listBuffer = null;
      listHeading = undefined;
    };

    const flushOrderedList = () => {
      if (orderedListBuffer && orderedListBuffer.length > 0) {
        blocks.push({
          type: 'ordered-list',
          heading: orderedListHeading,
          items: orderedListBuffer,
          style: orderedListStyle,
          start: orderedListStart,
        });
      }
      orderedListBuffer = null;
      orderedListHeading = undefined;
      orderedListStyle = 'decimal';
      orderedListStart = 1;
    };

    const flushCallout = () => {
      if (calloutBuffer) {
        const linesCopy = calloutBuffer.lines.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        blocks.push({
          type: 'callout',
          intent: calloutBuffer.intent,
          title: calloutBuffer.title,
          lines: linesCopy,
        });
        calloutBuffer = null;
      }
    };

    const getNextNonEmptyLine = (startIndex: number) => {
      for (let i = startIndex; i < lines.length; i += 1) {
        const next = lines[i].trim();
        if (next) {
          return next;
        }
      }
      return null;
    };

    for (let i = 0; i < lines.length; i += 1) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        flushList();
        flushOrderedList();
        flushCallout();
        pendingListHeading = null;
        continue;
      }

      if (calloutBuffer && !line.startsWith('>')) {
        flushCallout();
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        flushOrderedList();
        flushCallout();
        pendingListHeading = null;
        const level = headingMatch[1].length as 1 | 2 | 3;
        blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
        continue;
      }

      const imageMatch = line.match(/^!\[(.*?)]\((.*?)\)$/);
      if (imageMatch) {
        flushParagraph();
        flushList();
        flushOrderedList();
        flushCallout();
        pendingListHeading = null;
        let caption: string | undefined;
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && /^Caption:/i.test(nextLine)) {
          caption = nextLine.replace(/^Caption:\s*/i, '').trim();
          i += 1;
        }
        const source = imageMatch[2].trim();
        const isInlineFigure = source.startsWith('figure:');
        blocks.push({
          type: 'figure',
          alt: imageMatch[1].trim(),
          ...(isInlineFigure ? { figureId: source.replace(/^figure:/, '') } : { src: source }),
          ...(caption ? { caption } : {}),
        });
        continue;
      }

      if (line.startsWith('>')) {
        const calloutMatch = line.match(/^>\s*\[!([A-Z]+)]\s*(.*)$/i);
        if (calloutMatch) {
          flushParagraph();
          flushList();
          flushOrderedList();
          const [, intentRaw, titleText] = calloutMatch;
          const intent = normalizeCalloutIntent(intentRaw);
          const title = titleText?.trim() ? titleText.trim() : intentRaw.toUpperCase();
          calloutBuffer = { intent, title, lines: [] };
          pendingListHeading = null;
          continue;
        }

        if (calloutBuffer) {
          calloutBuffer.lines.push(line.replace(/^>\s?/, ''));
          continue;
        }

        const quoted = line.replace(/^>\s?/, '').trim();
        paragraphBuffer.push(quoted);
        continue;
      }

      const orderedMatch = line.match(/^((?:\d+)|(?:[IVXLCDM]+)|(?:[ivxlcdm]+)|(?:[A-Z])|(?:[a-z]))[.)]\s+(.*)$/);
      if (orderedMatch) {
        flushParagraph();
        flushList();
        const marker = orderedMatch[1];
        const { style, value } = decodeOrderedMarker(marker);
        if (!orderedListBuffer) {
          orderedListBuffer = [];
          orderedListHeading = pendingListHeading ?? undefined;
          orderedListStyle = style;
          orderedListStart = value;
        } else if (style !== orderedListStyle) {
          flushOrderedList();
          orderedListBuffer = [];
          orderedListHeading = pendingListHeading ?? undefined;
          orderedListStyle = style;
          orderedListStart = value;
        }
        orderedListBuffer.push(orderedMatch[2].trim());
        pendingListHeading = null;
        continue;
      }

      const normalizedListMatch = line.match(/^(?:•|-|\*)\s+(.*)$/);
      if (normalizedListMatch) {
        flushParagraph();
        flushOrderedList();
        if (!listBuffer) {
          listBuffer = [];
          listHeading = pendingListHeading ?? undefined;
        }
        listBuffer.push(normalizedListMatch[1].trim());
        pendingListHeading = null;
        continue;
      }

      if (line.endsWith(':')) {
        const nextNonEmpty = getNextNonEmptyLine(i + 1);
        if (nextNonEmpty && (/^(?:•|-|\*)\s+/.test(nextNonEmpty) || /^((?:\d+)|(?:[IVXLCDM]+)|(?:[ivxlcdm]+)|(?:[A-Z])|(?:[a-z]))[.)]/.test(nextNonEmpty))) {
          flushParagraph();
          flushList();
          flushOrderedList();
          pendingListHeading = line.replace(/:$/, '').trim();
          continue;
        }
      }

      flushList();
      flushOrderedList();
      pendingListHeading = null;
      paragraphBuffer.push(line);
    }

    flushParagraph();
    flushList();
    flushOrderedList();
    flushCallout();

    return blocks;
  };

  const renderContentBlocks = (
    text: string,
    variant: 'english' | 'original',
    options?: {
      resolvePdf?: (heading: string) => PdfPageLocation | null;
      onRequestPdf?: (location: PdfPageLocation) => void;
    }
  ) => {
    const blocks = createContentBlocks(text);

    return (
      <div
        className={`${styles.contentText} ${variant === 'english' ? styles.contentEnglish : styles.contentOriginal}`}
      >
        {blocks.map((block, index) => {
          if (block.type === 'paragraph') {
            return (
              <p key={index} className={styles.contentParagraph}>
                <InlineMarkdown text={block.text} />
              </p>
            );
          }

          if (block.type === 'heading') {
            const HeadingTag = block.level === 1 ? 'h4' : block.level === 2 ? 'h5' : 'h6';
            const headingClass =
              block.level === 1
                ? styles.contentHeadingLevel1
                : block.level === 2
                ? styles.contentHeadingLevel2
                : styles.contentHeadingLevel3;
            const pdfLocation = options?.resolvePdf ? options.resolvePdf(block.text) : null;
            return (
              <div key={index} className={styles.contentHeadingGroup}>
                <HeadingTag className={`${styles.contentHeading} ${headingClass}`}>
                  <InlineMarkdown text={block.text} />
                </HeadingTag>
                {pdfLocation ? (
                  <button
                    type="button"
                    className={styles.contentHeadingPdfButton}
                    onClick={() => options?.onRequestPdf?.(pdfLocation)}
                  >
                    View PDF page {pdfLocation.pageNumber}
                  </button>
                ) : null}
              </div>
            );
          }

          if (block.type === 'ordered-list') {
            return (
              <div key={index} className={styles.contentListBlock}>
                {block.heading && (
                  <p className={styles.contentListHeading}>
                    <InlineMarkdown text={block.heading} />
                  </p>
                )}
                <ol
                  className={styles.contentOrderedList}
                  style={{ listStyleType: block.style }}
                  start={block.start}
                >
                  {block.items.map((itemText, itemIndex) => (
                    <li key={itemIndex}>
                      <InlineMarkdown text={itemText} />
                    </li>
                  ))}
                </ol>
              </div>
            );
          }

          if (block.type === 'figure') {
            return (
              <LessonFigure
                key={index}
                figureId={block.figureId}
                alt={block.alt}
                caption={block.caption ? <InlineMarkdown text={block.caption} /> : undefined}
                className={styles.contentFigure}
                mediaClassName={styles.contentFigureMedia}
                captionClassName={styles.contentFigureCaption}
                fallbackClassName={styles.contentFigureFallback}
              />
            );
          }

          if (block.type === 'callout') {
            const intentClass =
              block.intent === 'warning'
                ? styles.contentCalloutWarning
                : block.intent === 'tip'
                ? styles.contentCalloutTip
                : block.intent === 'info'
                ? styles.contentCalloutInfo
                : styles.contentCalloutNote;
            return (
              <div key={index} className={`${styles.contentCallout} ${intentClass}`}>
                <p className={styles.contentCalloutTitle}>{block.title}</p>
                {block.lines.map((line, lineIndex) => (
                  <p key={lineIndex} className={styles.contentCalloutBody}>
                    <InlineMarkdown text={line} />
                  </p>
                ))}
              </div>
            );
          }

          if (block.type === 'list') {
            return (
              <div key={index} className={styles.contentListBlock}>
                {block.heading && (
                  <p className={styles.contentListHeading}>
                    <InlineMarkdown text={block.heading} />
                  </p>
                )}
                <ul className={styles.contentList}>
                  {block.items.map((itemText, itemIndex) => (
                    <li key={itemIndex}>
                      <InlineMarkdown text={itemText} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  const formatFileCount = (count: number) => (count === 1 ? '1 file' : `${count} files`);

  const renderResourceNodes = (nodes: ResourceTreeNode[], depth = 0): React.ReactNode => {
    if (nodes.length === 0) {
      return null;
    }

    const listClassNames = [depth === 0 ? styles.resourceList : styles.resourceSubList];
    if (depth > 1) {
      listClassNames.push(styles.resourceSubListNested);
    }

    return (
      <ul className={listClassNames.join(' ')}>
        {nodes.map((node) => {
          if (node.kind === 'group') {
            const resourceCount = countTreeResources(node.children);
            return (
              <li key={node.key} className={styles.resourceItem}>
                <details className={styles.resourceGroupDetails} open={depth < 3}>
                  <summary className={styles.resourceGroupSummary}>
                    <span className={styles.resourceGroupSummaryText}>{node.label}</span>
                    <span className={styles.resourceGroupCount}>{formatFileCount(resourceCount)}</span>
                  </summary>
                  {renderResourceNodes(node.children, depth + 1)}
                </details>
              </li>
            );
          }

          const { resource, label } = node;
          const fallbackIcon = resource.type ? resourceTypeIcon[resource.type] : '📄';
          const showTitle = resource.label && resource.label !== label;

          return (
            <li key={node.key} className={styles.resourceItem}>
              <a className={styles.resourceLink} href={resource.href} target="_blank" rel="noopener noreferrer">
                <span className={styles.resourceIcon} aria-hidden="true">
                  {fallbackIcon}
                </span>
                <span>
                  <span
                    className={styles.resourceLabel}
                    {...(showTitle ? { title: resource.label } : {})}
                  >
                    {label}
                  </span>
                  {resource.description && <br />}
                  {resource.description && <span className={styles.meta}>{resource.description}</span>}
                </span>
              </a>
              {resource.extract && (
                <details className={styles.resourceExtract}>
                  <summary>View extracted text</summary>
                  <div className={styles.resourceExtractBody}>
                    {renderContentBlocks(resource.extract.text, 'original')}
                    {resource.extract.notes && resource.extract.notes.length > 0 && (
                      <div className={styles.resourceExtractNotes}>
                        <h4>Extraction notes</h4>
                        <ul>
                          {resource.extract.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderResourceLinks = (links: ResourceLink[]) => renderResourceNodes(buildResourceTree(links));

  const renderContentSection = (item: CourseItem | null) => {
    if (!item?.content) {
      return null;
    }

    const englishContent = item.content.english ?? (item.language === 'en' ? item.content.original : undefined);
    const showOriginalContent =
      !!item.content.original &&
      (item.language === 'es' || !englishContent || englishContent !== item.content.original);

    return (
      <section className={styles.contentBlock} aria-label="Lesson content">
        <h3>Content</h3>
        {englishContent && renderContentBlocks(englishContent, 'english')}
        {showOriginalContent &&
          (item.language === 'es' && englishContent ? (
            <details className={styles.contentOriginalDetails}>
              <summary>Ver contenido original en español</summary>
              {renderContentBlocks(item.content.original, 'original', {
                resolvePdf: resolveHeadingToPdf,
                onRequestPdf: handlePdfRequest,
              })}
            </details>
          ) : (
            renderContentBlocks(item.content.original, 'original', {
              resolvePdf: resolveHeadingToPdf,
              onRequestPdf: handlePdfRequest,
            })
          ))}
      </section>
    );
  };

  useEffect(() => {
    if (!activeSubject) {
      setActiveCourseId(null);
      setActiveItemId(null);
      return;
    }

    const firstCourse = activeSubject.courses[0];
    if (!firstCourse) {
      setActiveCourseId(null);
      setActiveItemId(null);
      return;
    }

    setActiveCourseId(firstCourse.id);
    const firstItem = firstCourse.items[0];
    setActiveItemId(firstItem ? firstItem.id : null);
  }, [activeSubject, activeSubjectId]);

  useEffect(() => {
    if (!activeCourse) {
      setActiveItemId(null);
      return;
    }

    const firstItem = activeCourse.items[0];
    setActiveItemId(firstItem ? firstItem.id : null);
  }, [activeCourse, activeCourseId]);

  return (
    <>
      <div className={styles.page} aria-labelledby="subjects-heading">
        <header className={styles.header}>
          <h1 id="subjects-heading" className={styles.title}>
            Subjects
          </h1>
        <p className={styles.intro}>
          Navigate subjects like a study tree: pick a course, choose a lesson or lab, then dive into summaries, cheat sheets, and original PDFs.
        </p>
        <p className={styles.meta}>
          {totals.subjects} subjects · {totals.items} lessons and resources
        </p>
      </header>

      <div className={styles.workspace}>
        <nav className={styles.tree} aria-label="Study subjects">
          <ul className={styles.treeList}>
            {subjectCatalog.map((subject) => {
              const isActiveSubject = subject.id === activeSubjectId;
              const subjectCoverage = metricsMap.get(subject.id);
              return (
                <li key={subject.id}>
                  <button
                    type="button"
                    className={`${styles.treeSubject} ${isActiveSubject ? styles.treeSubjectActive : ''}`}
                    onClick={() => setActiveSubjectId(subject.id)}
                  >
                    <span>
                      <strong>{subject.name}</strong>
                      <span className={styles.treeMeta}>{subject.tagline}</span>
                    </span>
                    {subjectCoverage && (
                      <span className={styles.treeBadge}>{`${Math.round(subjectCoverage.translationCoverage * 100)}% EN`}</span>
                    )}
                  </button>
                  {isActiveSubject && (
                    <ul className={styles.treeCourseList}>
                      {subject.courses.map((course) => {
                        const isActiveCourse = activeCourseId === course.id;
                        const groups: Array<{ label: string; items: CourseItem[] }> = [
                          { label: 'Lessons', items: [] },
                          { label: 'Complementary Notes', items: [] },
                          { label: 'Practicals', items: [] },
                          { label: 'Exams', items: [] },
                          { label: 'Answers', items: [] },
                        ];

                        course.items.forEach((item) => {
                          const hasSolutionResource = item.resources?.some((resource) => {
                            const normalizedLabel = resource.label.toLowerCase();
                            return normalizedLabel.includes('solution') || normalizedLabel.includes('sol');
                          });

                          if (hasSolutionResource) {
                            groups[4].items.push(item);
                            return;
                          }

                          switch (item.kind) {
                            case 'lesson':
                              groups[0].items.push(item);
                              break;
                            case 'reading':
                              groups[1].items.push(item);
                              break;
                            case 'lab':
                              groups[2].items.push(item);
                              break;
                            case 'assignment':
                            case 'project':
                              groups[3].items.push(item);
                              break;
                            default:
                              break;
                          }
                        });

                        const renderCourseItem = (item: CourseItem) => {
                          const isActiveItem = activeItemId === item.id;
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                className={`${styles.treeItem} ${isActiveItem ? styles.treeItemActive : ''}`}
                                onClick={() => {
                                  setActiveCourseId(course.id);
                                  setActiveItemId(item.id);
                                }}
                              >
                                <span className={styles.treeItemIcon} aria-hidden="true">
                                  {itemKindIcon[item.kind]}
                                </span>
                                <span className={styles.treeItemLabel}>{item.title}</span>
                                <span className={styles.treeItemKind}>{item.kind}</span>
                              </button>
                            </li>
                          );
                        };

                        return (
                          <li key={course.id}>
                            <button
                              type="button"
                              className={`${styles.treeCourse} ${isActiveCourse ? styles.treeCourseActive : ''}`}
                              onClick={() =>
                                setActiveCourseId((current) => (current === course.id ? null : course.id))
                              }
                            >
                              <div className={styles.treeCourseHead}>
                                <strong>{course.title}</strong>
                                <span className={styles.treeMeta}>{course.modality.toUpperCase()}</span>
                              </div>
                              <span className={styles.treeMeta}>{course.description}</span>
                            </button>
                            {isActiveCourse && (
                              <ul className={styles.treeItemList}>
                                {groups.map((group) =>
                                  group.items.length > 0 ? (
                                    <React.Fragment key={group.label}>
                                      <li className={styles.categoryLabel}>{group.label}</li>
                                      {group.items.map((item) => renderCourseItem(item))}
                                    </React.Fragment>
                                  ) : null
                                )}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <section className={styles.detail} aria-live="polite">
          {!activeSubject ? (
            <p className={styles.emptyState}>Select a subject to explore its lessons and labs.</p>
          ) : !activeCourse ? (
            <div className={styles.detailPlaceholder}>
              <h2>{activeSubject.name}</h2>
              <p>{activeSubject.description.en}</p>
              <p className={styles.meta}>Pick a course on the left to reveal its lessons and labs.</p>
            </div>
          ) : !activeItem ? (
            <div className={styles.detailPlaceholder}>
              <h2>{activeCourse.title}</h2>
              <p>{activeCourse.description}</p>
              <p className={styles.meta}>Choose a lesson or lab from the tree to load the full study kit.</p>
            </div>
          ) : (
            <article className={styles.itemDetail}>
              <header className={styles.detailHeader}>
                <p className={styles.breadcrumb}>
                  <span>{activeSubject.name}</span>
                  <span aria-hidden="true">›</span>
                  <span>{activeCourse.title}</span>
                </p>
                <h2>
                  <span className={styles.detailIcon} aria-hidden="true">
                    {itemKindIcon[activeItem.kind]}
                  </span>
                  {activeItem.title}
                </h2>
                <div className={styles.detailMetaRow}>
                  <span>{formatLanguage(activeItem.language)}</span>
                  {activeItem.dueDate && <span>{describeDueDate(activeItem.dueDate).label}</span>}
                  {activeItem.estimatedMinutes && <span>{formatMinutes(activeItem.estimatedMinutes)}</span>}
                  {activeItem.status && <span>{statusCopy[activeItem.status]}</span>}
                </div>
              </header>

              <section className={styles.summaryBlock} aria-label="Lesson summary">
                <h3>Summary</h3>
                <div className={styles.summaryStack}>
                  {summaryInfo.original && (
                    <p className={styles.summaryOriginal} lang={activeItem.language}>
                      <span className={styles.summaryChip} aria-hidden="true">
                        {(activeItem.language ?? 'es').toUpperCase()}
                      </span>
                      <span>{summaryInfo.original}</span>
                    </p>
                  )}
                  {summaryInfo.showEnglish && summaryInfo.english && (
                    <p className={styles.summaryEnglish} lang="en">
                      <span className={styles.summaryChip} aria-hidden="true">EN</span>
                      <span>{summaryInfo.english}</span>
                    </p>
                  )}
                  {summaryInfo.placeholder && (
                    <p className={styles.summaryPlaceholder}>
                      <span className={styles.summaryChip} aria-hidden="true">EN</span>
                      <span>English recap coming soon.</span>
                    </p>
                  )}
                </div>
              </section>

              {renderContentSection(activeItem)}

              {activeItem.notebook && (
                <NotebookPreview
                  notebookId={activeItem.notebook.id}
                  path={activeItem.notebook.path}
                  colabUrl={activeItem.notebook.colabUrl}
                />
              )}

              {translationDetails && (
                <section className={styles.translationBlock} aria-label="Translation notes">
                  <h3>Translation support</h3>
                  <p className={styles.translationStatus}>
                    {translationStatusLabel[translationDetails.status] ?? 'Translation status'}
                  </p>
                  {translationDetails.summary && <p>{translationDetails.summary}</p>}
                  {translationDetails.glossary.length > 0 && (
                    <ul className={styles.glossaryList}>
                      {translationDetails.glossary.map((term) => (
                        <li key={term}>{term}</li>
                      ))}
                    </ul>
                  )}
                  {translationDetails.vocabulary.length > 0 && (
                    <div className={styles.translationVocabulary}>
                      <h4>Key vocabulary</h4>
                      <ul>
                        {translationDetails.vocabulary.map((entry) => (
                          <li key={entry.term}>
                            <strong>{entry.term}</strong>
                            <span> — {entry.translation}</span>
                            {entry.note && <span className={styles.meta}> · {entry.note}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {translationDetails.milestones.length > 0 && (
                    <div className={styles.translationMilestones}>
                      <h4>Upcoming milestones</h4>
                      <ul>
                        {translationDetails.milestones.map((milestone) => (
                          <li key={`${milestone.label}-${milestone.date}`}>
                            <span className={styles.milestoneDate}>{formatMilestoneDate(milestone.date)}</span>
                            <span>{milestone.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {translationDetails.notes && <p className={styles.meta}>{translationDetails.notes}</p>}
                </section>
              )}

              {activeItem.tags.length > 0 && (
                <section className={styles.tagBlock} aria-label="Key themes">
                  <h3>Key themes</h3>
                  <div className={styles.tagPillRow}>
                    {activeItem.tags.map((tag) => (
                      <span key={tag} className={styles.tagPill}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {activeItem.kind === 'lab' && activeItem.lab && (
                <section className={styles.labBlock} aria-label="Lab checklist">
                  <h3>Lab workspace</h3>
                  <p className={styles.meta}>{activeItem.lab.environment}</p>
                  <ul className={styles.checklist}>
                    {activeItem.lab.checklists.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                  {activeItem.lab.deliverable && <p>Deliverable: {activeItem.lab.deliverable}</p>}
                </section>
              )}

              {(activeCourse.cheatPapers?.length ?? 0) > 0 && (
                <section className={styles.cheatBlock} aria-label="Cheat sheets">
                  <h3>Cheat sheets & planners</h3>
                  <ul className={styles.cheatList}>
                    {activeCourse.cheatPapers!.map((cheat) => (
                      <li key={cheat.id} className={styles.cheatCard}>
                        <h4>{cheat.title}</h4>
                        <p className={styles.meta}>{cheat.description}</p>
                        <p>{cheat.englishSummary}</p>
                        {cheat.sections && (
                          <details>
                            <summary>Included sections</summary>
                            <ul>
                              {cheat.sections.map((section) => (
                                <li key={section.title}>
                                  <strong>{section.title}</strong>
                                  <ul>
                                    {section.bullets.map((bullet) => (
                                      <li key={bullet}>{bullet}</li>
                                    ))}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                        {cheat.studyTips && (
                          <details>
                            <summary>Study tips</summary>
                            <ul>
                              {cheat.studyTips.map((tip) => (
                                <li key={tip}>{tip}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                        {cheat.downloadHint && <p className={styles.meta}>{cheat.downloadHint}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {itemResources.length > 0 && (
                <section className={styles.resources} aria-label="Lesson downloads">
                  <h3>Lesson downloads</h3>
                  {renderResourceLinks(itemResources)}
                </section>
              )}

              {resources.length > 0 && (
                <section className={styles.resources} aria-label="Original materials">
                  <h3>Original PDFs & slide decks</h3>
                  {renderResourceLinks(resources)}
                </section>
              )}

              {resourcesWithExtract.length > 0 && (
                <details className={styles.rawContent}>
                  <summary>Original PDF Extract</summary>
                  {resourcesWithExtract.map((resource) =>
                    resource.extract?.text ? (
                      <section key={resource.href || resource.label}>
                        <h3>{resource.label}</h3>
                        <InlineMarkdown text={resource.extract.text} />
                      </section>
                    ) : null
                  )}
                </details>
              )}
            </article>
          )}
        </section>
      </div>
      </div>
      {pdfPreview ? (
        <PdfPageViewer
          file={pdfPreview.href}
          pageNumber={pdfPreview.pageNumber}
          title={pdfPreview.label}
          onClose={() => setPdfPreview(null)}
        />
      ) : null}
    </>
  );
};

export default SubjectsPage;
