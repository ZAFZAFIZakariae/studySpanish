import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subjectCatalog, computeCatalogInsights } from '../data/subjectCatalog';
import { CourseItem, SubjectMetrics, SubjectSummary } from '../types/subject';
import { describeDueDate } from '../lib/plannerUtils';
import styles from './SubjectsPage.module.css';

type LanguageFilter = 'all' | 'spanish' | 'english-ready' | 'needs-translation';
type UrgencyFilter = 'all' | 'due-soon' | 'overdue';

type SubjectMetricsMap = Record<string, SubjectMetrics>;

const languageFilterCopy: Record<LanguageFilter, string> = {
  all: 'All languages',
  spanish: 'Spanish-first',
  'english-ready': 'English-ready',
  'needs-translation': 'Needs English help',
};

const urgencyFilterCopy: Record<UrgencyFilter, string> = {
  all: 'All timelines',
  'due-soon': 'Due soon',
  overdue: 'Overdue',
};

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

const languageBadge: Record<CourseItem['language'], string> = {
  es: 'Spanish source',
  en: 'English source',
};

const cheatCoverageLabel: Record<'full-course' | 'unit' | 'labs', string> = {
  'full-course': 'Full course coverage',
  unit: 'Unit bundle',
  labs: 'Lab workflows',
};

const formatMinutes = (minutes?: number) => {
  if (!minutes) return 'Flexible';
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

const translationStatusLabel: Record<string, string> = {
  complete: 'English ready',
  partial: 'English in progress',
  machine: 'Machine translated',
  planned: 'Translation planned',
};

const buildMetricsMap = (catalogMetrics: SubjectMetrics[]): SubjectMetricsMap =>
  catalogMetrics.reduce<SubjectMetricsMap>((acc, entry) => {
    acc[entry.subject.id] = entry;
    return acc;
  }, {});

const filterMetrics = (
  metrics: SubjectMetrics[],
  language: LanguageFilter,
  urgency: UrgencyFilter
): SubjectMetrics[] => {
  return metrics.filter((entry) => {
    if (language === 'spanish' && entry.subject.languageProfile.primary !== 'es') {
      return false;
    }
    if (language === 'english-ready' && entry.translationCoverage < 0.75) {
      return false;
    }
    if (language === 'needs-translation' && entry.spanishOnly === 0) {
      return false;
    }

    if (urgency === 'due-soon' && entry.upcoming.length === 0) {
      return false;
    }
    if (urgency === 'overdue' && entry.overdue.length === 0) {
      return false;
    }

    return true;
  });
};

const buildTranslationCoverageLabel = (value: number) => {
  const percent = Math.round(value * 100);
  if (percent >= 90) return 'Fully bilingual';
  if (percent >= 70) return 'Almost ready in English';
  if (percent >= 40) return 'Half bilingual';
  if (percent > 0) return 'English scaffolding started';
  return 'Spanish-only right now';
};

const renderTagList = (tags: string[]) =>
  tags.map((tag) => (
    <span key={tag} className={styles.tag}>
      {tag}
    </span>
  ));

const SubjectsPage: React.FC = () => {
  const { metrics: catalogMetrics, totals } = useMemo(() => computeCatalogInsights(subjectCatalog), []);
  const slugToId = useMemo(
    () =>
      subjectCatalog.reduce<Record<string, string>>((acc, subject) => {
        acc[subject.slug] = subject.id;
        return acc;
      }, {}),
    []
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubjectId = useMemo(() => {
    const focusSlug = searchParams.get('focus');
    if (focusSlug && slugToId[focusSlug]) {
      return slugToId[focusSlug];
    }
    return catalogMetrics[0]?.subject.id ?? '';
  }, [catalogMetrics, searchParams, slugToId]);
  const metricsMap = useMemo(() => buildMetricsMap(catalogMetrics), [catalogMetrics]);
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [activeSubjectId, setActiveSubjectId] = useState<string>(initialSubjectId);
  const [translationExpanded, setTranslationExpanded] = useState<Record<string, boolean>>({});

  const filteredMetrics = useMemo(
    () => filterMetrics(catalogMetrics, languageFilter, urgencyFilter),
    [catalogMetrics, languageFilter, urgencyFilter]
  );

  useEffect(() => {
    if (!filteredMetrics.length) {
      setActiveSubjectId('');
      return;
    }

    const stillVisible = filteredMetrics.some((entry) => entry.subject.id === activeSubjectId);
    if (!stillVisible) {
      setActiveSubjectId(filteredMetrics[0].subject.id);
    }
  }, [filteredMetrics, activeSubjectId]);

  const activeMetrics = activeSubjectId ? metricsMap[activeSubjectId] : undefined;
  const activeSubject = activeMetrics?.subject;

  const handleSelectSubject = (subject: SubjectSummary) => {
    setActiveSubjectId(subject.id);
  };

  useEffect(() => {
    const current = searchParams.get('focus');
    if (!activeSubject) {
      if (current) {
        const next = new URLSearchParams(searchParams);
        next.delete('focus');
        setSearchParams(next, { replace: true });
      }
      return;
    }

    if (current === activeSubject.slug) return;
    const next = new URLSearchParams(searchParams);
    next.set('focus', activeSubject.slug);
    setSearchParams(next, { replace: true });
  }, [activeSubject, searchParams, setSearchParams]);

  const toggleTranslation = (itemId: string) => {
    setTranslationExpanded((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const subjectCountCopy = filteredMetrics.length === catalogMetrics.length ? 'All subjects' : `${filteredMetrics.length} subject${filteredMetrics.length === 1 ? '' : 's'}`;

  return (
    <div className={styles.page} aria-labelledby="subjects-heading">
      <header className={styles.header}>
        <div>
          <h1 id="subjects-heading" className={styles.title}>
            Subjects hub
          </h1>
          <p className={styles.subtitle}>
            Plan every subject in English-first detail while keeping Spanish materials intact. Filter by language support, find due labs, and open bilingual guides in one spot.
          </p>
        </div>
        <div className={styles.headerStat}>
          <span className={styles.headerStatLabel}>Bilingual coverage</span>
          <span className={styles.headerStatValue}>{Math.round(totals.translationCoverage * 100)}%</span>
        </div>
      </header>

      <section className={styles.summaryGrid} aria-label="Workspace summary">
        <article className={styles.summaryCard}>
          <h2>{totals.subjects} subjects</h2>
          <p>
            {totals.items} tracked resources · {totals.assignments} assignments · {totals.labs} labs.
          </p>
        </article>
        <article className={styles.summaryCard}>
          <h2>{totals.englishReady} English-ready</h2>
          <p>{totals.spanishOnly} items still need English scaffolding.</p>
        </article>
        <article className={styles.summaryCard}>
          <h2>{totals.upcoming} upcoming</h2>
          <p>{totals.overdue} overdue items waiting for wrap-up.</p>
        </article>
      </section>

      <section className={styles.filters} aria-label="Subject filters">
        <div className={styles.filterGroup} role="group" aria-label="Language filter">
          {Object.entries(languageFilterCopy).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterButton} ${languageFilter === value ? styles.filterButtonActive : ''}`}
              onClick={() => setLanguageFilter(value as LanguageFilter)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup} role="group" aria-label="Timeline filter">
          {Object.entries(urgencyFilterCopy).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterButton} ${urgencyFilter === value ? styles.filterButtonActive : ''}`}
              onClick={() => setUrgencyFilter(value as UrgencyFilter)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={styles.filterSummary}>{subjectCountCopy}</p>
      </section>

      <section className={styles.layout}>
        <nav className={styles.subjectList} aria-label="Subjects list">
          {filteredMetrics.length === 0 ? (
            <p className={styles.emptyState}>
              No subjects match the selected filters yet. Adjust filters to continue planning.
            </p>
          ) : (
            filteredMetrics.map((entry) => {
              const coverage = Math.round(entry.translationCoverage * 100);
              return (
                <button
                  key={entry.subject.id}
                  type="button"
                  className={`${styles.subjectListItem} ${activeSubjectId === entry.subject.id ? styles.subjectListItemActive : ''}`}
                  onClick={() => handleSelectSubject(entry.subject)}
                >
                  <span className={styles.subjectListTitle}>{entry.subject.name}</span>
                  <span className={styles.subjectListSubtitle}>{entry.subject.tagline}</span>
                  <div className={styles.subjectListMeta}>
                    <span className={styles.chip}>{coverage}% EN ready</span>
                    {entry.upcoming.length > 0 && <span className={`${styles.chip} ${styles.chipUrgent}`}>{entry.upcoming.length} due soon</span>}
                    {entry.overdue.length > 0 && <span className={`${styles.chip} ${styles.chipOverdue}`}>{entry.overdue.length} overdue</span>}
                  </div>
                </button>
              );
            })
          )}
        </nav>

        <section className={styles.subjectDetail} aria-live="polite">
          {!activeSubject || !activeMetrics ? (
            <div className={styles.emptyState}>
              Select a subject to inspect bilingual resources, labs, and translation notes.
            </div>
          ) : (
            <article>
              <header className={styles.detailHeader}>
                <div>
                  <h2 className={styles.detailTitle}>{activeSubject.name}</h2>
                  <p className={styles.detailTagline}>{activeSubject.tagline}</p>
                </div>
                <div className={styles.detailBadge} style={{ borderColor: activeSubject.color }}>
                  {buildTranslationCoverageLabel(activeMetrics.translationCoverage)}
                </div>
              </header>

              <div className={styles.detailMeta}>
                <span className={styles.metaPill}>
                  Primary language: <strong>{activeSubject.languageProfile.primary === 'es' ? 'Spanish' : 'English'}</strong>
                </span>
                <span className={styles.metaPill}>
                  English support: <strong>{activeSubject.languageProfile.supportLevel}</strong>
                </span>
                <span className={styles.metaPill}>
                  Credits: <strong>{activeSubject.credits}</strong>
                </span>
              </div>

              <p className={styles.detailDescription}>{activeSubject.description.en}</p>
              {activeSubject.description.es && (
                <p className={styles.detailDescriptionSecondary}>{activeSubject.description.es}</p>
              )}

              <div className={styles.skillRow}>
                {renderTagList(activeSubject.skills)}
                {renderTagList(activeSubject.focusAreas)}
              </div>

              <div className={styles.translationBar}>
                <div className={styles.translationProgress}>
                  <div
                    className={styles.translationProgressFill}
                    style={{ width: `${Math.min(100, Math.round(activeMetrics.translationCoverage * 100))}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p className={styles.translationSummary}>
                  {activeMetrics.englishReady} items ready in English · {activeMetrics.spanishOnly} still Spanish-only.
                </p>
              </div>

              {activeSubject.languageProfile.notes && (
                <p className={styles.languageNotes}>{activeSubject.languageProfile.notes}</p>
              )}

              <div className={styles.courses}>
                {activeSubject.courses.map((course) => (
                  <section key={course.id} className={styles.courseCard} aria-labelledby={`course-${course.id}`}>
                    <header className={styles.courseHeader}>
                      <div>
                        <h3 id={`course-${course.id}`} className={styles.courseTitle}>
                          {course.title}
                        </h3>
                        <p className={styles.courseSubtitle}>{course.description}</p>
                      </div>
                      <div className={styles.courseMeta}>
                        <span className={styles.metaChip}>{course.modality}</span>
                        <span className={styles.metaChip}>{course.schedule}</span>
                        <span className={styles.metaChip}>{course.languageMix.join(' · ')}</span>
                      </div>
                    </header>

                    {course.focusAreas.length > 0 && (
                      <div className={styles.focusAreaRow}>{renderTagList(course.focusAreas)}</div>
                    )}

                    <ul className={styles.itemList}>
                      {course.items.map((item) => {
                        const dueDescriptor = describeDueDate(item.dueDate);
                        const expanded = translationExpanded[item.id] ?? false;
                        const hasTranslation = Boolean(item.translation);
                        return (
                          <li key={item.id} className={`${styles.item} ${styles[`tone-${dueDescriptor.tone}`]}`}>
                            <div className={styles.itemHeader}>
                              <span className={styles.itemIcon} aria-hidden="true">
                                {itemKindIcon[item.kind]}
                              </span>
                              <div className={styles.itemBody}>
                                <div className={styles.itemTitleRow}>
                                  <h4 className={styles.itemTitle}>{item.title}</h4>
                                  {item.status && (
                                    <span className={`${styles.statusBadge} ${styles[`status-${item.status}`]}`}>
                                      {statusCopy[item.status]}
                                    </span>
                                  )}
                                </div>
                                <p className={styles.itemSummary}>{item.summary.original}</p>
                                {expanded && hasTranslation && (
                                  <div className={styles.translationNotes}>
                                    <p>
                                      <strong>English guidance:</strong> {item.translation?.summary}
                                    </p>
                                    {item.translation?.glossary && item.translation.glossary.length > 0 && (
                                      <div className={styles.glossaryRow}>
                                        <strong>Glossary:</strong>
                                        <div className={styles.glossaryChips}>
                                          {item.translation.glossary.map((term) => (
                                            <span key={term} className={styles.chipSoft}>
                                              {term}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {item.translation?.notes && <p className={styles.translationNote}>{item.translation.notes}</p>}
                                  </div>
                                )}
                                {item.tags.length > 0 && <div className={styles.tagRow}>{renderTagList(item.tags)}</div>}
                              </div>
                            </div>

                            <div className={styles.itemMeta}>
                              <span className={`${styles.metaBadge} ${styles[`tone-${dueDescriptor.tone}`]}`}>
                                {dueDescriptor.label}
                              </span>
                              <span className={styles.metaChip}>{languageBadge[item.language]}</span>
                              <span className={styles.metaChip}>{formatMinutes(item.estimatedMinutes)}</span>
                              {hasTranslation ? (
                                <button
                                  type="button"
                                  className={`${styles.metaButton} ${expanded ? styles.metaButtonActive : ''}`}
                                  onClick={() => toggleTranslation(item.id)}
                                >
                                  {expanded ? 'Hide English notes' : 'Show English notes'}
                                </button>
                              ) : (
                                <span className={`${styles.metaBadge} ${styles.badgeSoft}`}>
                                  Needs English outline
                                </span>
                              )}
                              {item.translation && (
                                <span className={`${styles.metaChip} ${styles.metaTranslationStatus}`}>
                                  {translationStatusLabel[item.translation.status] ?? 'Translation'}
                                </span>
                              )}
                            </div>

                            {item.lab && (
                              <details className={styles.labDetails}>
                                <summary>Lab checklist</summary>
                                <p className={styles.labEnvironment}>
                                  <strong>Environment:</strong> {item.lab.environment}
                                </p>
                                <ul>
                                  {item.lab.checklists.map((step, index) => (
                                    <li key={`${item.id}-step-${index}`}>{step}</li>
                                  ))}
                                </ul>
                                {item.lab.deliverable && (
                                  <p className={styles.labDeliverable}>
                                    <strong>Deliverable:</strong> {item.lab.deliverable}
                                  </p>
                                )}
                              </details>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {course.cheatPapers && course.cheatPapers.length > 0 && (
                      <div className={styles.cheatSection} aria-label="Cheat papers">
                        <h4 className={styles.cheatHeading}>Cheat papers</h4>
                        <div className={styles.cheatGrid}>
                          {course.cheatPapers.map((paper) => (
                            <article key={paper.id} className={styles.cheatCard}>
                              <header className={styles.cheatCardHeader}>
                                <div>
                                  <h5 className={styles.cheatTitle}>{paper.title}</h5>
                                  <p className={styles.cheatDescription}>{paper.description}</p>
                                </div>
                                <div className={styles.cheatBadges}>
                                  <span className={styles.metaChip}>{cheatCoverageLabel[paper.coverage]}</span>
                                  <span className={styles.metaChip}>{languageBadge[paper.language]}</span>
                                </div>
                              </header>
                              <div className={styles.cheatSummaries}>
                                <p className={styles.cheatSummary}>{paper.englishSummary}</p>
                                {paper.spanishSummary && (
                                  <p className={styles.cheatSummarySecondary}>{paper.spanishSummary}</p>
                                )}
                              </div>
                              <div className={styles.cheatOutline}>
                                {paper.sections.map((section) => (
                                  <details key={`${paper.id}-${section.title}`} className={styles.cheatSectionDetails}>
                                    <summary>{section.title}</summary>
                                    <ul>
                                      {section.bullets.map((bullet, index) => (
                                        <li key={`${paper.id}-${section.title}-${index}`}>{bullet}</li>
                                      ))}
                                    </ul>
                                  </details>
                                ))}
                              </div>
                              {paper.studyTips.length > 0 && (
                                <div className={styles.cheatTips}>
                                  <p className={styles.cheatTipsHeading}>Study tips</p>
                                  <ul>
                                    {paper.studyTips.map((tip, index) => (
                                      <li key={`${paper.id}-tip-${index}`}>{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {paper.downloadHint && (
                                <p className={styles.cheatDownload}>{paper.downloadHint}</p>
                              )}
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                ))}
              </div>

              {activeSubject.reflectionPrompts.length > 0 && (
                <aside className={styles.reflectionBox} aria-label="Reflection prompts">
                  <h3>Reflection prompts</h3>
                  <ul>
                    {activeSubject.reflectionPrompts.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>
                </aside>
              )}
            </article>
          )}
        </section>
      </section>
    </div>
  );
};

export default SubjectsPage;
