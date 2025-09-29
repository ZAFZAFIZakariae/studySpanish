import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subjectCatalog, computeCatalogInsights } from '../data/subjectCatalog';
import { CourseItem } from '../types/subject';
import { describeDueDate } from '../lib/plannerUtils';
import { subjectResourceLibrary, ResourceLink } from '../data/subjectResources';
import styles from './SubjectsPage.module.css';
import { lessonFigureRegistry } from '../components/lessonFigures';

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

  const resources = activeSubject ? subjectResourceLibrary[activeSubject.id] ?? [] : [];
  const activeCourse = useMemo(
    () => (activeSubject ? activeSubject.courses.find((course) => course.id === activeCourseId) ?? null : null),
    [activeCourseId, activeSubject]
  );
  const activeItem = useMemo(
    () => (activeCourse ? activeCourse.items.find((item) => item.id === activeItemId) ?? null : null),
    [activeCourse, activeItemId]
  );

  type ContentBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'heading'; level: 1 | 2 | 3; text: string }
    | { type: 'list'; heading?: string; items: string[] }
    | { type: 'figure'; alt: string; caption?: string; src?: string; figureId?: string };

  const createContentBlocks = (text: string): ContentBlock[] => {
    const lines = text.split('\n');
    const blocks: ContentBlock[] = [];
    let paragraphBuffer: string[] = [];
    let listBuffer: string[] | null = null;
    let listHeading: string | undefined;
    let pendingListHeading: string | null = null;

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
        pendingListHeading = null;
        continue;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        pendingListHeading = null;
        const level = headingMatch[1].length as 1 | 2 | 3;
        blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
        continue;
      }

      const imageMatch = line.match(/^!\[(.*?)]\((.*?)\)$/);
      if (imageMatch) {
        flushParagraph();
        flushList();
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

      const normalizedListMatch = line.match(/^(?:•|-|\*)\s+(.*)$/);
      if (normalizedListMatch) {
        flushParagraph();
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
        if (nextNonEmpty && /^(?:•|-|\*)\s+/.test(nextNonEmpty)) {
          flushParagraph();
          flushList();
          pendingListHeading = line.replace(/:$/, '').trim();
          continue;
        }
      }

      flushList();
      pendingListHeading = null;
      paragraphBuffer.push(line);
    }

    flushParagraph();
    flushList();

    return blocks;
  };

  const renderContentBlocks = (text: string, variant: 'english' | 'original') => {
    const blocks = createContentBlocks(text);

    return (
      <div
        className={`${styles.contentText} ${variant === 'english' ? styles.contentEnglish : styles.contentOriginal}`}
      >
        {blocks.map((block, index) => {
          if (block.type === 'paragraph') {
            return (
              <p key={index} className={styles.contentParagraph}>
                {block.text}
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
            return (
              <HeadingTag key={index} className={`${styles.contentHeading} ${headingClass}`}>
                {block.text}
              </HeadingTag>
            );
          }

          if (block.type === 'figure') {
            const renderer = block.figureId ? lessonFigureRegistry[block.figureId] : undefined;
            const figureContent = renderer
              ? renderer(block.alt)
              : block.src
              ? (
                  <img src={block.src} alt={block.alt} />
                )
              : null;

            if (!figureContent) {
              return null;
            }

            return (
              <figure key={index} className={styles.contentFigure}>
                {figureContent}
                {block.caption && <figcaption className={styles.contentFigureCaption}>{block.caption}</figcaption>}
              </figure>
            );
          }

          return (
            <div key={index} className={styles.contentListBlock}>
              {block.heading && <p className={styles.contentListHeading}>{block.heading}</p>}
              <ul className={styles.contentList}>
                {block.items.map((itemText, itemIndex) => (
                  <li key={itemIndex}>{itemText}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

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
              {renderContentBlocks(item.content.original, 'original')}
            </details>
          ) : (
            renderContentBlocks(item.content.original, 'original')
          ))}
      </section>
    );
  };

  useEffect(() => {
    setActiveCourseId(null);
    setActiveItemId(null);
  }, [activeSubjectId]);

  useEffect(() => {
    setActiveItemId(null);
  }, [activeCourseId]);

  return (
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
                                {course.items.map((item) => {
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
                                })}
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
                <p className={styles.summaryEnglish}>
                  {activeItem.summary.english ?? activeItem.translation?.summary ?? activeItem.summary.original}
                </p>
                {activeItem.summary.original && activeItem.language === 'es' && (
                  <p className={styles.summaryOriginal}>{activeItem.summary.original}</p>
                )}
              </section>

              {renderContentSection(activeItem)}

              {activeItem.translation && (
                <section className={styles.translationBlock} aria-label="Translation notes">
                  <h3>Translation support</h3>
                  <p className={styles.meta}>{translationStatusLabel[activeItem.translation.status] ?? 'Translation status'}</p>
                  {activeItem.translation.summary && <p>{activeItem.translation.summary}</p>}
                  {activeItem.translation.glossary && (
                    <ul className={styles.glossaryList}>
                      {activeItem.translation.glossary.map((term) => (
                        <li key={term}>{term}</li>
                      ))}
                    </ul>
                  )}
                  {activeItem.translation.notes && <p className={styles.meta}>{activeItem.translation.notes}</p>}
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

              {resources.length > 0 && (
                <section className={styles.resources} aria-label="Original materials">
                  <h3>Original PDFs & slide decks</h3>
                  <ul className={styles.resourceList}>
                    {resources.map((resource) => (
                      <li key={resource.href}>
                        <a
                          className={styles.resourceLink}
                          href={resource.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className={styles.resourceIcon} aria-hidden="true">
                            {resource.type ? resourceTypeIcon[resource.type] : '📄'}
                          </span>
                          <span>
                            <span className={styles.resourceLabel}>{resource.label}</span>
                            {resource.description && <br />}
                            {resource.description && <span className={styles.meta}>{resource.description}</span>}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
          )}
        </section>
      </div>
    </div>
  );
};

export default SubjectsPage;
