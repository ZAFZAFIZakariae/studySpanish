(function () {
  const { useState, useMemo, useEffect, useRef } = React;
  const e = React.createElement;

  const subjectLabels = {
    Admeav: 'Administración de Empresas',
    Dbd: 'Bases de Datos',
    Ggo: 'Gobierno de TI',
    Sad: 'Servicios Distribuidos',
    snlp: 'Spanish NLP Research',
  };

  const rawLessons = Array.isArray(window.LESSON_DATA) ? window.LESSON_DATA : [];
  const LESSONS = rawLessons.map((entry, index) => {
    const text = typeof entry.text === 'string'
      ? entry.text
      : Array.isArray(entry.textLines)
      ? entry.textLines.join('\n')
      : '';
    const notes = Array.isArray(entry.notes) ? entry.notes.filter(Boolean) : [];
    return {
      ...entry,
      id: entry.id || `lesson-${index + 1}`,
      subject: entry.subject || 'General',
      title: entry.title || `Lesson ${index + 1}`,
      source: entry.source || '',
      text,
      notes,
    };
  });

  function formatSubject(subject) {
    if (!subject) return 'General';
    if (subjectLabels[subject]) {
      return subjectLabels[subject];
    }
    return subject
      .toString()
      .replace(/(^|[\s_/.-])(\w)/g, function (_, prefix, char) {
        return prefix + char.toUpperCase();
      });
  }

  function summariseText(text) {
    const cleaned = (text || '')
      .replace(/^#.+$/gm, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length <= 180) {
      return cleaned;
    }
    return cleaned.slice(0, 180) + '…';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeHtmlAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function applyInlineFormatting(text) {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>');
  }

  function formatInline(text) {
    if (!text) {
      return '';
    }
    const parts = [];
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;
    while ((match = linkPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'link', label: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', value: text.slice(lastIndex) });
    }
    if (parts.length === 0) {
      return applyInlineFormatting(text);
    }
    return parts
      .map(function (part) {
        if (part.type === 'link') {
          return (
            '<a href="' +
            escapeHtmlAttr(part.url) +
            '" target="_blank" rel="noopener">' +
            applyInlineFormatting(part.label) +
            '</a>'
          );
        }
        return applyInlineFormatting(part.value);
      })
      .join('');
  }

  function convertMarkdown(source) {
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let paragraph = [];
    let blockquote = [];
    let inList = false;
    let inCodeBlock = false;
    let codeBuffer = [];

    function flushParagraph() {
      if (paragraph.length > 0) {
        html.push('<p>' + formatInline(paragraph.join(' ')) + '</p>');
        paragraph = [];
      }
    }

    function flushBlockquote() {
      if (blockquote.length > 0) {
        html.push('<blockquote>' + formatInline(blockquote.join(' ')) + '</blockquote>');
        blockquote = [];
      }
    }

    function closeList() {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
    }

    function flushCodeBlock() {
      if (inCodeBlock) {
        html.push('<pre><code>' + escapeHtml(codeBuffer.join('\n')) + '</code></pre>');
        inCodeBlock = false;
        codeBuffer = [];
      }
    }

    lines.forEach(function (rawLine) {
      const line = rawLine;
      const trimmed = line.trim();

      if (/^```/.test(trimmed)) {
        flushParagraph();
        flushBlockquote();
        closeList();
        if (inCodeBlock) {
          flushCodeBlock();
        } else {
          inCodeBlock = true;
          codeBuffer = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (!trimmed) {
        flushParagraph();
        flushBlockquote();
        closeList();
        return;
      }

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushBlockquote();
        closeList();
        const level = Math.min(6, headingMatch[1].length);
        html.push('<h' + level + '>' + formatInline(headingMatch[2]) + '</h' + level + '>');
        return;
      }

      if (/^>\s?/.test(trimmed)) {
        flushParagraph();
        closeList();
        blockquote.push(trimmed.replace(/^>\s?/, ''));
        return;
      }

      if (/^[-*+]\s+/.test(trimmed)) {
        flushParagraph();
        flushBlockquote();
        if (!inList) {
          html.push('<ul>');
          inList = true;
        }
        const itemContent = trimmed.replace(/^[-*+]\s+/, '');
        html.push('<li>' + formatInline(itemContent) + '</li>');
        return;
      }

      flushBlockquote();
      closeList();
      paragraph.push(trimmed);
    });

    flushParagraph();
    flushBlockquote();
    closeList();
    flushCodeBlock();

    return html.join('');
  }

  function renderMarkdown(text) {
    const cleaned = (text || '').replace(/^[\t ]*[•·–]\s?/gm, '- ');
    return convertMarkdown(cleaned);
  }

  function filterLessons(lessons, subject, query, sort) {
    const normalizedQuery = query.trim().toLowerCase();
    let filtered = subject === 'all'
      ? lessons
      : lessons.filter(function (lesson) {
          return lesson.subject.toLowerCase() === subject.toLowerCase();
        });

    if (normalizedQuery.length > 0) {
      filtered = filtered.filter(function (lesson) {
        const haystack = (
          lesson.title +
          ' ' +
          lesson.text +
          ' ' +
          lesson.notes.join(' ')
        ).toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }

    const sorted = filtered.slice();
    sorted.sort(function (a, b) {
      if (sort === 'subject') {
        const subjectCompare = formatSubject(a.subject).localeCompare(
          formatSubject(b.subject)
        );
        if (subjectCompare !== 0) {
          return subjectCompare;
        }
        return a.title.localeCompare(b.title);
      }

      if (sort === 'notes') {
        const notesA = a.notes.length;
        const notesB = b.notes.length;
        if (notesA === notesB) {
          return a.title.localeCompare(b.title);
        }
        return notesB - notesA;
      }

      return a.title.localeCompare(b.title);
    });

    return sorted;
  }

  function getUniqueSubjects(lessons) {
    const seen = new Set();
    lessons.forEach(function (lesson) {
      if (lesson.subject) {
        seen.add(lesson.subject);
      }
    });
    return Array.from(seen).sort(function (a, b) {
      return formatSubject(a).localeCompare(formatSubject(b));
    });
  }

  function computeMetrics(lessons) {
    const totalLessons = lessons.length;
    const totalNotes = lessons.reduce(function (acc, lesson) {
      return acc + lesson.notes.length;
    }, 0);
    const streak = 7 + Math.max(3, Math.floor(totalLessons / 14));
    const subjectCount = getUniqueSubjects(lessons).length;
    return { totalLessons, totalNotes, streak, subjectCount };
  }

  function sourceLabel(source) {
    if (!source) {
      return 'Source';
    }
    const parts = source.split('/');
    return parts[parts.length - 1] || source;
  }

  function Sidebar(props) {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'lessons', label: 'Lessons', icon: '📚' },
      { id: 'planner', label: 'Planner', icon: '🗓️' },
      { id: 'library', label: 'Library', icon: '📁' },
    ];

    return e(
      'aside',
      { className: 'sidebar' },
      e(
        'div',
        { className: 'sidebar__header' },
        e('div', { className: 'sidebar__logo', 'aria-hidden': 'true' }, 'SC'),
        e(
          'div',
          { className: 'sidebar__title' },
          'Study',
          e('strong', null, 'Compass')
        )
      ),
      e(
        'nav',
        { className: 'sidebar__nav' },
        navItems.map(function (item) {
          const isActive = props.activeNav === item.id;
          return e(
            'a',
            {
              key: item.id,
              href: '#',
              className:
                'nav-item' + (isActive ? ' nav-item--active' : ''),
              onClick: function (event) {
                event.preventDefault();
                props.onSelectNav(item.id);
              },
            },
            e(
              'span',
              { className: 'nav-item__icon', 'aria-hidden': 'true' },
              item.icon
            ),
            item.label
          );
        })
      ),
      e(
        'div',
        { className: 'sidebar__footer' },
        e(
          'div',
          { className: 'focus-card' },
          e('p', { className: 'focus-card__eyebrow' }, 'This week'),
          e(
            'p',
            { className: 'focus-card__title' },
            'Complete your ',
            props.metrics.streak,
            '-day streak challenge.'
          ),
          e(
            'button',
            { type: 'button', className: 'focus-card__cta' },
            'Plan session'
          )
        )
      )
    );
  }

  function Topbar(props) {
    return e(
      'header',
      { className: 'topbar' },
      e(
        'button',
        {
          type: 'button',
          className: 'hamburger',
          'aria-label': props.navOpen ? 'Close navigation' : 'Open navigation',
          'aria-expanded': props.navOpen ? 'true' : 'false',
          onClick: props.onToggleNav,
        },
        e('span', null),
        e('span', null),
        e('span', null)
      ),
      e(
        'div',
        { className: 'search' },
        e('span', { className: 'search__icon', 'aria-hidden': 'true' }, '🔍'),
        e('input', {
          id: 'global-search',
          type: 'search',
          placeholder: 'Search lessons, notes, tags…',
          value: props.query,
          onChange: function (event) {
            props.onQueryChange(event.target.value);
          },
        })
      ),
      e(
        'div',
        { className: 'topbar__actions' },
        e(
          'button',
          { type: 'button', className: 'pill-button' },
          'New note'
        ),
        e(
          'div',
          { className: 'profile', title: 'Keep the streak alive' },
          e('span', { className: 'profile__initials' }, 'SC'),
          e('span', { className: 'profile__status', 'aria-hidden': 'true' })
        )
      )
    );
  }

  function Insights(props) {
    const cards = [
      {
        id: 'lessons',
        iconClass: 'insight__icon insight__icon--accent',
        icon: '📚',
        label: 'Lessons reviewed',
        value: props.metrics.totalLessons,
        caption: 'Curated lesson extracts',
        valueId: 'lesson-count',
      },
      {
        id: 'notes',
        iconClass: 'insight__icon insight__icon--purple',
        icon: '📝',
        label: 'Notes logged',
        value: props.metrics.totalNotes,
        caption: 'Annotations attached',
        valueId: 'notes-count',
      },
      {
        id: 'streak',
        iconClass: 'insight__icon insight__icon--teal',
        icon: '🔥',
        label: 'Review streak',
        value: props.metrics.streak + ' days',
        caption: 'Keep the momentum going',
        valueId: 'streak-value',
      },
      {
        id: 'subjects',
        iconClass: 'insight__icon insight__icon--blue',
        icon: '🗂️',
        label: 'Active subjects',
        value: props.metrics.subjectCount,
        caption: 'Domains in your library',
      },
    ];

    return e(
      'section',
      { className: 'insights', role: 'region', 'aria-label': 'Study metrics' },
      cards.map(function (card) {
        return e(
          'article',
          { key: card.id, className: 'card insight' },
          e(
            'div',
            { className: card.iconClass },
            e('span', { 'aria-hidden': 'true' }, card.icon)
          ),
          e(
            'div',
            null,
            e('p', { className: 'insight__label' }, card.label),
            e(
              'p',
              {
                className: 'insight__value',
                id: card.valueId,
              },
              card.value
            ),
            e('p', null, card.caption)
          )
        );
      })
    );
  }

  function LessonBrowser(props) {
    const subjectButtons = ['all'].concat(props.subjects);

    return e(
      'section',
      { className: 'lesson-browser card' },
      e(
        'div',
        { className: 'card__header' },
        e(
          'div',
          null,
          e('h2', null, 'Lesson library'),
          e(
            'p',
            null,
            'Filter by subject, search for key phrases, and jump straight into a lesson.'
          )
        ),
        e(
          'div',
          { className: 'sort-control' },
          e('label', { htmlFor: 'sort-select' }, 'Sort by'),
          e(
            'select',
            {
              id: 'sort-select',
              value: props.sort,
              onChange: function (event) {
                props.onSortChange(event.target.value);
              },
            },
            e('option', { value: 'title' }, 'Title (A–Z)'),
            e('option', { value: 'subject' }, 'Subject'),
            e('option', { value: 'notes' }, 'Most notes')
          )
        )
      ),
      e(
        'div',
        { className: 'filters' },
        e(
          'div',
          {
            className: 'filter-group',
            id: 'subject-filter',
            role: 'group',
            'aria-label': 'Filter by subject',
          },
          subjectButtons.map(function (id) {
            const isActive = props.subject === id;
            return e(
              'button',
              {
                key: id,
                type: 'button',
                className: 'filter-chip' + (isActive ? ' is-active' : ''),
                'data-subject': id,
                onClick: function () {
                  props.onSubjectChange(id);
                },
              },
              id === 'all' ? 'All subjects' : formatSubject(id)
            );
          })
        )
      ),
      e(
        'div',
        { className: 'lesson-list', id: 'lesson-list', role: 'list' },
        props.lessons.length === 0
          ? e(
              'p',
              { className: 'empty-state' },
              'No lessons match the current filters. Try another subject or search keyword.'
            )
          : props.lessons.map(function (lesson) {
              const isSelected = props.selectedId === lesson.id;
              return e(
                'article',
                {
                  key: lesson.id,
                  role: 'listitem',
                  className:
                    'lesson-item' + (isSelected ? ' is-selected' : ''),
                  onClick: function () {
                    props.onSelectLesson(lesson.id);
                  },
                },
                e('h3', { className: 'lesson-item__title' }, lesson.title),
                e(
                  'div',
                  { className: 'lesson-item__meta' },
                  e('span', { className: 'badge' }, formatSubject(lesson.subject)),
                  lesson.notes.length > 0
                    ? e(
                        'span',
                        { className: 'badge badge--note' },
                        lesson.notes.length +
                          ' note' +
                          (lesson.notes.length > 1 ? 's' : '')
                      )
                    : null,
                  lesson.source
                    ? e(
                        'span',
                        { className: 'badge badge--count' },
                        sourceLabel(lesson.source)
                      )
                    : null
                ),
                e(
                  'p',
                  { className: 'lesson-item__snippet' },
                  summariseText(lesson.text)
                )
              );
            })
      )
    );
  }

  function LessonViewer(props) {
    const contentRef = useRef(null);
    const lessonHtml = useMemo(
      function () {
        if (!props.lesson) {
          return '';
        }
        return renderMarkdown(props.lesson.text);
      },
      [props.lesson]
    );

    useEffect(
      function () {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      },
      [props.lesson]
    );

    if (!props.lesson) {
      return e(
        'section',
        { className: 'lesson-viewer card' },
        e(
          'div',
          { className: 'card__header lesson-viewer__header' },
          e(
            'div',
            null,
            e('p', { className: 'eyebrow', id: 'lesson-subject' }, 'No lesson selected'),
            e(
              'h2',
              { id: 'lesson-title' },
              'Adjust your filters to continue studying'
            )
          )
        ),
        e('div', { className: 'lesson-meta', id: 'lesson-meta' }),
        e(
          'div',
          { className: 'lesson-content', id: 'lesson-content', ref: contentRef },
          e(
            'p',
            { className: 'empty-state' },
            'Choose a lesson from the list to preview the full content.'
          )
        )
      );
    }

    return e(
      'section',
      { className: 'lesson-viewer card' },
      e(
        'div',
        { className: 'card__header lesson-viewer__header' },
        e(
          'div',
          null,
          e(
            'p',
            { className: 'eyebrow', id: 'lesson-subject' },
            formatSubject(props.lesson.subject)
          ),
          e('h2', { id: 'lesson-title' }, props.lesson.title)
        )
      ),
      e(
        'div',
        { className: 'lesson-meta', id: 'lesson-meta' },
        props.lesson.source
          ? e(
              'a',
              {
                href: props.lesson.source,
                target: '_blank',
                rel: 'noopener',
              },
              'View source PDF'
            )
          : null,
        props.lesson.notes.length > 0
          ? e(
              'div',
              { className: 'lesson-notes' },
              e('span', { className: 'badge badge--note' }, 'Notes'),
              e(
                'ul',
                { className: 'notes-list' },
                props.lesson.notes.map(function (note, index) {
                  return e('li', { key: index }, note);
                })
              )
            )
          : null
      ),
      e('div', {
        className: 'lesson-content',
        id: 'lesson-content',
        ref: contentRef,
        dangerouslySetInnerHTML: { __html: lessonHtml || '<p class="empty-state">This lesson does not include formatted content yet.</p>' },
      })
    );
  }

  function App() {
    const [subject, setSubject] = useState('all');
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('title');
    const [selectedId, setSelectedId] = useState(
      LESSONS.length > 0 ? LESSONS[0].id : null
    );
    const [navOpen, setNavOpen] = useState(false);
    const [activeNav, setActiveNav] = useState('dashboard');

    const subjects = useMemo(
      function () {
        return getUniqueSubjects(LESSONS);
      },
      []
    );

    const filteredLessons = useMemo(
      function () {
        return filterLessons(LESSONS, subject, query, sort);
      },
      [subject, query, sort]
    );

    const selectedLesson = useMemo(
      function () {
        if (!selectedId) {
          return null;
        }
        return (
          filteredLessons.find(function (lesson) {
            return lesson.id === selectedId;
          }) || null
        );
      },
      [filteredLessons, selectedId]
    );

    useEffect(
      function () {
        if (filteredLessons.length === 0) {
          if (selectedId !== null) {
            setSelectedId(null);
          }
          return;
        }
        const hasSelected = filteredLessons.some(function (lesson) {
          return lesson.id === selectedId;
        });
        if (!hasSelected) {
          setSelectedId(filteredLessons[0].id);
        }
      },
      [filteredLessons, selectedId]
    );

    useEffect(
      function () {
        document.body.classList.toggle('nav-open', navOpen);
      },
      [navOpen]
    );

    useEffect(function () {
      function handleKeyDown(event) {
        if (event.key === 'Escape') {
          setNavOpen(false);
        }
      }

      function handleResize() {
        if (window.innerWidth >= 900) {
          setNavOpen(false);
        }
      }

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);
      return function () {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    const metrics = useMemo(
      function () {
        return computeMetrics(LESSONS);
      },
      []
    );

    const hasLessons = LESSONS.length > 0;

    return e(
      'div',
      { className: 'app-shell' },
      e(Sidebar, {
        metrics: metrics,
        activeNav: activeNav,
        onSelectNav: function (id) {
          setActiveNav(id);
          setNavOpen(false);
        },
      }),
      e(
        'div',
        { className: 'main-area' },
        e(Topbar, {
          query: query,
          onQueryChange: setQuery,
          onToggleNav: function () {
            setNavOpen(function (open) {
              return !open;
            });
          },
          navOpen: navOpen,
        }),
        e(
          'main',
          null,
          e(Insights, { metrics: metrics }),
          hasLessons
            ? e(
                'div',
                { className: 'content-grid' },
                e(LessonBrowser, {
                  subjects: subjects,
                  subject: subject,
                  onSubjectChange: setSubject,
                  sort: sort,
                  onSortChange: setSort,
                  lessons: filteredLessons,
                  onSelectLesson: function (id) {
                    setSelectedId(id);
                    setNavOpen(false);
                  },
                  selectedId: selectedId,
                }),
                e(LessonViewer, { lesson: selectedLesson })
              )
            : e(
                'section',
                { className: 'card' },
                e(
                  'div',
                  { className: 'card__header' },
                  e('h2', null, 'No lesson data available'),
                  e(
                    'p',
                    null,
                    'Add lesson content to lesson-data.js to explore the workspace.'
                  )
                )
              )
        )
      )
    );
  }

  const container = document.getElementById('app');
  if (!container) {
    return;
  }
  container.removeAttribute('aria-busy');
  const root = ReactDOM.createRoot(container);
  root.render(e(App));
})();
