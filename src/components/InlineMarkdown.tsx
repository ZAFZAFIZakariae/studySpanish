import React from 'react';

const renderTokens = (text: string): React.ReactNode[] => {
  const pattern = new RegExp(
    [
      '\\*\\*[^*]+?\\*\\*',
      '__[^_]+?__',
      '\\*[^*]+?\\*',
      '_[^_]+?_',
      '`[^`]+?`',
      '\\[[^\\]]+?\\]\\([^\\s)]+?\\)',
    ].join('|'),
    'g'
  );
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (/^\*\*.+\*\*$/.test(token) || /^__.+__$/.test(token)) {
      nodes.push(
        <strong key={`md-strong-${key}`}>{token.slice(2, -2)}</strong>
      );
    } else if (/^\*.+\*$/.test(token) || /^_.+_$/.test(token)) {
      nodes.push(
        <em key={`md-em-${key}`}>{token.slice(1, -1)}</em>
      );
    } else if (/^`.+`$/.test(token)) {
      nodes.push(
        <code key={`md-code-${key}`}>{token.slice(1, -1)}</code>
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        nodes.push(
          <a key={`md-link-${key}`} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }

    key += 1;
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

const InlineMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  return <>{renderTokens(text)}</>;
};

export default InlineMarkdown;
