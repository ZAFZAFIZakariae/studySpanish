import { navigate } from '../router.js';

export function Topbar() {
  return (
    React.createElement('header', { className: 'topbar' },
      React.createElement('h1', null, 'Study Companion'),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => navigate('#/spanish'),
        },
        'Spanish'
      )
    )
  );
}
