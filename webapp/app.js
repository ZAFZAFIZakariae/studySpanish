import { onRoute, getCurrentRoute } from './router.js';
import { Sidebar } from './components/Sidebar.js';
import { Topbar } from './components/Topbar.js';
import { Home } from './pages/Home.js';
import { Subjects } from './pages/Subjects.js';
import { Spanish } from './pages/Spanish.js';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

window.appState = window.appState || {
  subjects: [],
  currentRoute: getCurrentRoute(),
  currentCategory: 'lessons',
  currentSubject: null,
};

function App() {
  const { useCallback, useEffect, useMemo, useState } = React;
  const [route, setRoute] = useState(window.appState.currentRoute || getCurrentRoute());
  const [subjects, setSubjects] = useState(window.appState.subjects || []);

  useEffect(() => {
    const unsubscribe = onRoute((nextRoute) => {
      window.appState.currentRoute = nextRoute;
      setRoute(nextRoute);
    });
    return unsubscribe;
  }, []);

  const handleSubjectsLoaded = useCallback((loadedSubjects) => {
    if (!Array.isArray(loadedSubjects)) return;
    window.appState.subjects = loadedSubjects;
    setSubjects(loadedSubjects);
  }, []);

  const page = useMemo(() => {
    if (route?.name === 'subjects' || route?.name === 'subjects/:subjectId') {
      return React.createElement(Subjects, { route, subjects });
    }

    if (route?.name === 'spanish') {
      return React.createElement(Spanish, null);
    }

    return React.createElement(Home, null);
  }, [route, subjects]);

  return React.createElement(
    'div',
    { className: 'app-shell' },
    React.createElement(Topbar, null),
    React.createElement(Sidebar, {
      route,
      subjects,
      onSubjectsLoaded: handleSubjectsLoaded,
    }),
    React.createElement('main', { className: 'main-content' }, page)
  );
}

root.render(React.createElement(App));
