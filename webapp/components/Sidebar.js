import { navigate, onRoute } from '../router.js';

let subjectsCache = null;
let loadingPromise = null;

const SUBJECT_LIST_LIMIT = 5;

export function Sidebar({ route, subjects = [], onSubjectsLoaded }) {
  const { useEffect, useState } = React;
  const [items, setItems] = useState(subjects.slice(0, SUBJECT_LIST_LIMIT));
  const [activeRoute, setActiveRoute] = useState(route);

  useEffect(() => {
    const unsubscribe = onRoute((r) => setActiveRoute(r));
    return unsubscribe;
  }, []);

  useEffect(() => {
    setActiveRoute(route);
  }, [route]);

  useEffect(() => {
    if (subjects.length) {
      setItems(subjects.slice(0, SUBJECT_LIST_LIMIT));
    }
  }, [subjects]);

  useEffect(() => {
    let isMounted = true;
    if (subjectsCache) {
      if (isMounted) {
        setItems(subjectsCache.slice(0, SUBJECT_LIST_LIMIT));
        onSubjectsLoaded?.(subjectsCache);
      }
      return () => {
        isMounted = false;
      };
    }

    if (!loadingPromise) {
      loadingPromise = fetch('./data/subjects.json')
        .then((res) => res.json())
        .then((data) => {
          subjectsCache = Array.isArray(data?.subjects) ? data.subjects : [];
          return subjectsCache;
        })
        .catch((error) => {
          console.error('Failed to load subjects.json', error);
          subjectsCache = [];
          return subjectsCache;
        });
    }

    loadingPromise.then((list) => {
      if (!isMounted) return;
      setItems(list.slice(0, SUBJECT_LIST_LIMIT));
      onSubjectsLoaded?.(list);
    });

    return () => {
      isMounted = false;
    };
  }, [onSubjectsLoaded]);

  const currentName = activeRoute?.name || '';
  const subjectId = activeRoute?.params?.subjectId;

  const handleNavigate = (path) => () => navigate(path);

  return (
    React.createElement(
      'aside',
      { className: 'sidebar' },
      React.createElement('div', null,
        React.createElement('div', {
          className: `nav-item${currentName === 'subjects' || currentName === 'subjects/:subjectId' ? ' active' : ''}`,
          onClick: handleNavigate('#/subjects'),
        }, 'Subjects')
      ),
      (currentName === 'subjects' || currentName === 'subjects/:subjectId') &&
        React.createElement('div', null,
          React.createElement('h2', null, 'Subjects'),
          React.createElement(
            'div',
            { className: 'subject-list' },
            items.map((subject) =>
              React.createElement(
                'div',
                {
                  key: subject.id,
                  className: `subject-item${subjectId === subject.id ? ' active' : ''}`,
                  onClick: handleNavigate(`#/subjects/${subject.id}`),
                },
                React.createElement('div', { className: 'subject-title' }, subject.title),
                subject.shortDescription
                  ? React.createElement('small', null, subject.shortDescription)
                  : null
              )
            )
          )
        )
    )
  );
}
