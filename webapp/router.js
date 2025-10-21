const subscribers = new Set();
let currentRoute = null;

function normalizePath(path = '') {
  if (!path) return '#/';
  if (path.startsWith('#')) {
    return path.startsWith('#/') ? path : `#/${path.replace(/^#*/, '')}`;
  }
  return path.startsWith('/') ? `#${path}` : `#/${path}`;
}

function parseHash() {
  const hash = window.location.hash || '#/';
  const cleaned = hash.replace(/^#\/?/, '');
  const segments = cleaned ? cleaned.split('/').filter(Boolean) : [];
  return segments;
}

function matchRoute(segments) {
  if (!segments.length) {
    return { name: '', segments: [], params: {}, hash: '#/' };
  }

  if (segments[0] === 'subjects') {
    if (segments.length === 1) {
      return { name: 'subjects', segments, params: {}, hash: '#/subjects' };
    }
    if (segments.length >= 2) {
      return {
        name: 'subjects/:subjectId',
        segments,
        params: { subjectId: segments[1] },
        hash: `#/subjects/${segments[1]}`,
      };
    }
  }

  if (segments[0] === 'spanish') {
    return { name: 'spanish', segments, params: {}, hash: '#/spanish' };
  }

  return { name: '', segments: [], params: {}, hash: '#/' };
}

function emitRoute() {
  const segments = parseHash();
  currentRoute = matchRoute(segments);
  subscribers.forEach((cb) => cb(currentRoute));
}

export function onRoute(cb) {
  if (typeof cb === 'function') {
    subscribers.add(cb);
    if (currentRoute === null) {
      emitRoute();
    } else {
      cb(currentRoute);
    }
    return () => subscribers.delete(cb);
  }
  return () => {};
}

export function navigate(path) {
  const target = normalizePath(path);
  if (window.location.hash !== target) {
    window.location.hash = target;
  } else {
    // Force route emit for same-hash navigation
    emitRoute();
  }
}

window.addEventListener('hashchange', emitRoute);

// Initialise
if (!window.location.hash) {
  window.location.hash = '#/';
} else {
  emitRoute();
}

export function getCurrentRoute() {
  if (currentRoute === null) {
    currentRoute = matchRoute(parseHash());
  }
  return currentRoute;
}
