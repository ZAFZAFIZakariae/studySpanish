const { useState, useEffect } = React;

const DEFAULT_TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'content', label: 'Content' },
  { key: 'raw', label: 'Raw' },
];

export function Tabs({ tabs = DEFAULT_TABS, activeKey, onChange, panels = {} }) {
  const [current, setCurrent] = useState(activeKey || tabs[0]?.key || 'summary');

  useEffect(() => {
    if (activeKey && activeKey !== current) {
      setCurrent(activeKey);
    }
  }, [activeKey]);

  useEffect(() => {
    if (!tabs.find((tab) => tab.key === current)) {
      setCurrent(tabs[0]?.key || 'summary');
    }
  }, [tabs, current]);

  useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(current);
    }
  }, [current, onChange]);

  const handleSelect = (key) => {
    setCurrent(key);
  };

  const ActivePanel = panels[current];
  const resolvedPanel =
    typeof ActivePanel === 'function' ? ActivePanel() : ActivePanel ?? null;

  return (
    React.createElement('div', { className: 'tabs-component' },
      React.createElement(
        'div',
        { className: 'tab-header', role: 'tablist' },
        tabs.map((tab) =>
          React.createElement(
            'button',
            {
              key: tab.key,
              className: `tab-button${current === tab.key ? ' active' : ''}`,
              type: 'button',
              role: 'tab',
              'aria-selected': current === tab.key,
              onClick: () => handleSelect(tab.key),
            },
            tab.label
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'tab-panel', role: 'tabpanel' },
        resolvedPanel || React.createElement('p', null, 'No content available yet.')
      )
    )
  );
}
