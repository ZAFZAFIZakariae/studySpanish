import { navigate } from '../router.js';
import { Tabs } from '../components/Tabs.js';

const CATEGORY_MAP = [
  { key: 'lessons', label: 'Lessons' },
  { key: 'complementaryNotes', label: 'Complementary notes' },
  { key: 'practicals', label: 'Practicals' },
  { key: 'exams', label: 'Exams' },
  { key: 'answers', label: 'Answers' },
];

function renderContentSections(sections = []) {
  if (!sections.length) {
    return React.createElement('p', null, 'No structured content yet.');
  }
  return React.createElement(
    'div',
    { className: 'section-list' },
    sections.map((section, index) =>
      React.createElement(
        'div',
        { key: `${section.title}-${index}` },
        React.createElement('h4', null, section.title),
        section.points && section.points.length
          ? React.createElement(
              'ul',
              null,
              section.points.map((item, idx) =>
                React.createElement('li', { key: `${section.title}-${idx}` }, item)
              )
            )
          : null
      )
    )
  );
}

function buildRawHtml(rawPages = [], images = []) {
  const usedImages = new Set();
  const hasPages = Array.isArray(rawPages) && rawPages.length > 0;

  if (!hasPages && (!images || !images.length)) {
    return React.createElement('p', null, 'Raw notes will be added soon.');
  }

  const htmlPages = (hasPages ? rawPages : []).map((page, index) => {
    let content = page;
    content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      const caption = alt ? `<figcaption>${alt}</figcaption>` : '';
      return `<figure class="img-figure"><img src="${src}" alt="${alt}" />${caption}</figure>`;
    });

    content = content.replace(/\{\{image:(\d+)\}\}/g, (_, imgIndex) => {
      const img = images[Number(imgIndex)];
      if (!img) return '';
      usedImages.add(Number(imgIndex));
      const caption = img.caption ? `<figcaption>${img.caption}</figcaption>` : '';
      return `<figure class="img-figure"><img src="${img.src}" alt="${img.alt || ''}" />${caption}</figure>`;
    });

    return React.createElement(
      'div',
      { key: `page-${index}`, className: 'page-block' },
      React.createElement('h5', null, `Page ${index + 1}`),
      React.createElement('div', {
        dangerouslySetInnerHTML: { __html: content },
      })
    );
  });

  const trailingImages = images
    .map((img, index) => ({ img, index }))
    .filter(({ index }) => !usedImages.has(index));

  const trailingElements = trailingImages.map(({ img, index }) =>
    React.createElement(
      'figure',
      { key: `trailing-${index}` },
      React.createElement('img', { src: img.src, alt: img.alt || '' }),
      img.caption ? React.createElement('figcaption', null, img.caption) : null
    )
  );

  return React.createElement(React.Fragment, null, [...htmlPages, ...trailingElements]);
}

function getSubjectById(subjects, id) {
  return subjects.find((subject) => subject.id === id);
}

export function Subjects({ route, subjects }) {
  const { useMemo, useState, useEffect } = React;
  const routeName = route?.name;

  const subject = useMemo(() => {
    if (routeName !== 'subjects/:subjectId') return null;
    return getSubjectById(subjects, route?.params?.subjectId);
  }, [subjects, routeName, route?.params?.subjectId]);

  const [activeCategory, setActiveCategory] = useState(() => {
    if (window.appState?.currentCategory) {
      return window.appState.currentCategory;
    }
    return 'lessons';
  });

  useEffect(() => {
    if (!subject) return;
    const available = CATEGORY_MAP.filter(({ key }) => subject.categories?.[key]);
    if (!available.length) return;
    const defaultKey = available[0].key;
    if (!subject.categories?.[activeCategory]) {
      setActiveCategory(defaultKey);
      return;
    }
    if (!window.appState) window.appState = {};
    window.appState.currentCategory = activeCategory;
    window.appState.currentSubject = subject.id;
  }, [subject, activeCategory]);

  if (routeName === 'subjects/:subjectId') {
    if (!subjects.length) {
      return React.createElement(
        'div',
        { className: 'subjects-detail' },
        React.createElement('p', null, 'Loading subject details...')
      );
    }

    if (!subject) {
      return React.createElement(
        'div',
        { className: 'subjects-detail' },
        React.createElement('h2', null, 'Subject not found'),
        React.createElement(
          'p',
          null,
          'The requested subject could not be located.'
        )
      );
    }

    const categoryItems = CATEGORY_MAP.filter(({ key }) => subject.categories?.[key]);
    const currentCategory = subject.categories?.[activeCategory];

    return React.createElement(
      'div',
      { className: 'subjects-detail' },
      React.createElement('div', { className: 'subjects-header' },
        React.createElement('h2', null, subject.title),
        subject.description
          ? React.createElement('p', null, subject.description)
          : null
      ),
      React.createElement(
        'div',
        { className: 'subjects-layout' },
        React.createElement(
          'div',
          { className: 'secondary-sidebar' },
          categoryItems.length
            ? categoryItems.map(({ key, label }) =>
                React.createElement(
                  'div',
                  {
                    key,
                    className: `section-item${activeCategory === key ? ' active' : ''}`,
                    onClick: () => setActiveCategory(key),
                  },
                  label
                )
              )
            : React.createElement('p', null, 'No categories available yet.')
        ),
        React.createElement(
          'div',
          { className: 'category-content' },
          currentCategory
            ? React.createElement(Tabs, {
                key: activeCategory,
                panels: {
                  summary: () =>
                    React.createElement(
                      'div',
                      null,
                      React.createElement(
                        'p',
                        null,
                        currentCategory.summary
                          ? currentCategory.summary
                          : 'No summary available for this category yet.'
                      )
                    ),
                  content: () => renderContentSections(currentCategory.content),
                  raw: () =>
                    buildRawHtml(
                      Array.isArray(currentCategory.raw) ? currentCategory.raw : [],
                      Array.isArray(currentCategory.images) ? currentCategory.images : []
                    ),
                },
              })
            : React.createElement(
                'div',
                { className: 'tab-panel' },
                'This category has no content yet.'
              )
        )
      )
    );
  }

  const limitedSubjects = subjects.slice(0, 5);

  return React.createElement(
    'div',
    { className: 'subjects-list' },
    React.createElement('div', { className: 'subjects-header' },
      React.createElement('h2', null, 'Subjects'),
      React.createElement(
        'p',
        null,
        'Choose a subject to drill down into topic-specific material.'
      )
    ),
    limitedSubjects.length
      ? React.createElement(
          'div',
          { className: 'card-grid' },
          limitedSubjects.map((subject) =>
            React.createElement(
              'div',
              { key: subject.id, className: 'card' },
              React.createElement('h3', null, subject.title),
              React.createElement('p', null, subject.shortDescription || subject.description),
              React.createElement(
                'button',
                { type: 'button', onClick: () => navigate(`#/subjects/${subject.id}`) },
                'Open'
              )
            )
          )
        )
      : React.createElement('p', null, 'Loading subjects...')
  );
}
