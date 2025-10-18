const lessons = (Array.isArray(window.LESSON_DATA) ? window.LESSON_DATA : []).map((entry) => ({
  ...entry,
  text: entry.text ?? (entry.textLines ? entry.textLines.join('\n') : ''),
}));

const subjectLabels = {
  Admeav: 'Administración de Empresas',
  Dbd: 'Bases de Datos',
  Ggo: 'Gobierno de TI',
  Sad: 'Servicios Distribuidos',
  snlp: 'Spanish NLP Research',
};

const elements = {
  subjectFilter: document.getElementById('subject-filter'),
  lessonList: document.getElementById('lesson-list'),
  sortSelect: document.getElementById('sort-select'),
  searchInput: document.getElementById('global-search'),
  lessonSubject: document.getElementById('lesson-subject'),
  lessonTitle: document.getElementById('lesson-title'),
  lessonMeta: document.getElementById('lesson-meta'),
  lessonContent: document.getElementById('lesson-content'),
  lessonCount: document.getElementById('lesson-count'),
  notesCount: document.getElementById('notes-count'),
  streakValue: document.getElementById('streak-value'),
  hamburger: document.querySelector('.hamburger'),
};

const state = {
  subject: 'all',
  query: '',
  sort: 'title',
  selectedId: null,
};

const uniqueSubjects = [...new Set(lessons.map((lesson) => lesson.subject))].sort((a, b) => {
  const labelA = subjectLabels[a] ?? a;
  const labelB = subjectLabels[b] ?? b;
  return labelA.localeCompare(labelB);
});

function formatSubject(subject) {
  return subjectLabels[subject] ?? subject.replace(/(^|[\s_/.-])(\w)/g, (_, prefix, char) => `${prefix}${char.toUpperCase()}`);
}

function summariseText(text) {
  const cleaned = text
    .replace(/^#.+$/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const snippet = cleaned.slice(0, 180);
  return cleaned.length > 180 ? `${snippet}…` : snippet;
}

function getFilteredLessons() {
  const query = state.query.trim().toLowerCase();
  const bySubject = state.subject === 'all'
    ? lessons
    : lessons.filter((lesson) => lesson.subject.toLowerCase() === state.subject.toLowerCase());

  const searched = query.length === 0
    ? bySubject
    : bySubject.filter((lesson) => {
        const haystack = `${lesson.title} ${lesson.text} ${(lesson.notes || []).join(' ')}`.toLowerCase();
        return haystack.includes(query);
      });

  const sorted = [...searched];
  sorted.sort((a, b) => {
    if (state.sort === 'subject') {
      const labelCompare = formatSubject(a.subject).localeCompare(formatSubject(b.subject));
      if (labelCompare !== 0) return labelCompare;
      return a.title.localeCompare(b.title);
    }

    if (state.sort === 'notes') {
      const notesA = (a.notes || []).length;
      const notesB = (b.notes || []).length;
      if (notesA === notesB) {
        return a.title.localeCompare(b.title);
      }
      return notesB - notesA;
    }

    return a.title.localeCompare(b.title);
  });

  return sorted;
}

function renderSubjectFilters() {
  const fragment = document.createDocumentFragment();

  const createChip = (id, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.dataset.subject = id;
    button.textContent = label;
    if (state.subject === id) {
      button.classList.add('is-active');
    }
    button.addEventListener('click', () => {
      state.subject = id;
      renderSubjectFilters();
      renderLessonList();
      document.body.classList.remove('nav-open');
      elements.hamburger?.setAttribute('aria-expanded', 'false');
    });
    return button;
  };

  fragment.appendChild(createChip('all', 'All subjects'));
  uniqueSubjects.forEach((subject) => {
    fragment.appendChild(createChip(subject, formatSubject(subject)));
  });

  elements.subjectFilter.innerHTML = '';
  elements.subjectFilter.appendChild(fragment);
}

function renderLessonList() {
  const list = elements.lessonList;
  list.innerHTML = '';
  const filtered = getFilteredLessons();

  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No lessons match the current filters. Try another subject or search keyword.';
    list.appendChild(empty);
    state.selectedId = null;
    elements.lessonSubject.textContent = 'No lesson selected';
    elements.lessonTitle.textContent = 'Adjust your filters to continue studying';
    elements.lessonMeta.innerHTML = '';
    elements.lessonContent.innerHTML = '<p class="empty-state">Filters cleared the current selection. Try a different query.</p>';
    return;
  }

  let selectedLesson = filtered.find((lesson) => lesson.id === state.selectedId) ?? null;
  if (!selectedLesson) {
    selectedLesson = filtered[0];
    state.selectedId = selectedLesson.id;
    renderLesson(selectedLesson);
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach((lesson) => {
    const item = document.createElement('article');
    item.className = 'lesson-item';
    item.setAttribute('role', 'listitem');
    if (lesson.id === state.selectedId) {
      item.classList.add('is-selected');
    }

    const title = document.createElement('h3');
    title.className = 'lesson-item__title';
    title.textContent = lesson.title;

    const meta = document.createElement('div');
    meta.className = 'lesson-item__meta';
    const subjectBadge = document.createElement('span');
    subjectBadge.className = 'badge';
    subjectBadge.textContent = formatSubject(lesson.subject);
    meta.appendChild(subjectBadge);

    if (lesson.notes && lesson.notes.length > 0) {
      const noteBadge = document.createElement('span');
      noteBadge.className = 'badge badge--note';
      noteBadge.textContent = `${lesson.notes.length} note${lesson.notes.length > 1 ? 's' : ''}`;
      meta.appendChild(noteBadge);
    }

    const sourceBadge = document.createElement('span');
    sourceBadge.className = 'badge badge--count';
    sourceBadge.textContent = lesson.source.split('/').slice(-1)[0];
    meta.appendChild(sourceBadge);

    const snippet = document.createElement('p');
    snippet.className = 'lesson-item__snippet';
    snippet.textContent = summariseText(lesson.text);

    item.append(title, meta, snippet);
    item.addEventListener('click', () => {
      state.selectedId = lesson.id;
      renderLesson(lesson);
      renderLessonList();
      if (window.innerWidth < 900) {
        document.body.classList.remove('nav-open');
        elements.hamburger?.setAttribute('aria-expanded', 'false');
      }
    });

    fragment.appendChild(item);
  });

  list.appendChild(fragment);
}

let markedPromise = null;
async function ensureMarked() {
  if (!markedPromise) {
    markedPromise = import('https://esm.sh/marked@11.1.1?bundle').then((module) => {
      const { marked } = module;
      marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false,
      });
      return marked;
    });
  }
  return markedPromise;
}

async function renderLesson(lesson) {
  const marked = await ensureMarked();
  const cleaned = lesson.text.replace(/^[\t ]*[•·–]\s?/gm, '- ');
  const html = marked.parse(cleaned);

  elements.lessonSubject.textContent = formatSubject(lesson.subject);
  elements.lessonTitle.textContent = lesson.title;

  const meta = document.createElement('div');
  meta.className = 'lesson-meta';

  const sourceLink = document.createElement('a');
  sourceLink.href = lesson.source;
  sourceLink.textContent = 'View source PDF';
  sourceLink.target = '_blank';
  sourceLink.rel = 'noopener';
  meta.appendChild(sourceLink);

  if (lesson.notes && lesson.notes.length > 0) {
    const notesWrap = document.createElement('div');
    notesWrap.className = 'lesson-notes';

    const notesLabel = document.createElement('span');
    notesLabel.className = 'badge badge--note';
    notesLabel.textContent = 'Notes';

    const notesList = document.createElement('ul');
    notesList.className = 'notes-list';
    lesson.notes.forEach((note) => {
      const li = document.createElement('li');
      li.textContent = note;
      notesList.appendChild(li);
    });

    notesWrap.append(notesLabel, notesList);
    meta.appendChild(notesWrap);
  }

  elements.lessonMeta.innerHTML = '';
  elements.lessonMeta.appendChild(meta);

  elements.lessonContent.innerHTML = html;
  elements.lessonContent.scrollTop = 0;
}

function updateMetrics() {
  const totalLessons = lessons.length;
  const totalNotes = lessons.reduce((acc, lesson) => acc + (lesson.notes ? lesson.notes.length : 0), 0);
  const streak = 7 + Math.max(3, Math.floor(totalLessons / 14));

  elements.lessonCount.textContent = totalLessons.toString();
  elements.notesCount.textContent = totalNotes.toString();
  elements.streakValue.textContent = `${streak} days`;
}

function initSearch() {
  elements.searchInput?.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderLessonList();
  });
}

function initSorting() {
  elements.sortSelect?.addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderLessonList();
  });
}

function initHamburger() {
  if (!elements.hamburger) return;
  elements.hamburger.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    elements.hamburger.setAttribute('aria-expanded', String(isOpen));
  });
}

function initNavHighlights() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      navItems.forEach((nav) => nav.classList.remove('nav-item--active'));
      item.classList.add('nav-item--active');
    });
  });
}

function enhanceLessonContent() {
  const observer = new MutationObserver(() => {
    const links = elements.lessonContent.querySelectorAll('a[href^="subjects/"]');
    links.forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
    });
  });

  observer.observe(elements.lessonContent, { childList: true, subtree: true });
}

function init() {
  updateMetrics();
  renderSubjectFilters();
  renderLessonList();
  initSearch();
  initSorting();
  initHamburger();
  initNavHighlights();
  enhanceLessonContent();
}

if (lessons.length === 0) {
  elements.lessonList.innerHTML = '<p class="empty-state">No lesson data available.</p>';
} else {
  init();
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
    elements.hamburger?.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 900 && document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
    elements.hamburger?.setAttribute('aria-expanded', 'false');
  }
});
