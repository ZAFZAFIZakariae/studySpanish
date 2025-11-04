import { navigate } from '../router.js';

export function Home() {
  return (
    React.createElement(
      'div',
      { className: 'home-page' },
      React.createElement('div', { className: 'subjects-header' },
        React.createElement('h2', null, 'Welcome to your study companion'),
        React.createElement(
          'p',
          null,
          'Explore curated subject summaries and dedicated Spanish learning resources.'
        )
      ),
      React.createElement(
        'div',
        { className: 'card-grid' },
        React.createElement(
          'div',
          { className: 'card' },
          React.createElement('h3', null, 'Study Subjects'),
          React.createElement(
            'p',
            null,
            'Browse subjects and drill into lessons, notes, practicals, and past papers.'
          ),
          React.createElement(
            'button',
            { type: 'button', onClick: () => navigate('#/subjects') },
            'Explore subjects'
          )
        ),
        React.createElement(
          'div',
          { className: 'card' },
          React.createElement('h3', null, 'Spanish resources'),
          React.createElement(
            'p',
            null,
            'Head to the Spanish hub for vocabulary builders, dialogues, and practice tips.'
          ),
          React.createElement(
            'button',
            { type: 'button', onClick: () => navigate('#/spanish') },
            'Go to Spanish hub'
          )
        )
      )
    )
  );
}
