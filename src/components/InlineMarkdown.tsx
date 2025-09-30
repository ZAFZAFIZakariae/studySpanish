import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import styles from './InlineMarkdown.module.css';

const superscriptMap: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
};

const subscriptMap: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  'ₖ': 'k',
  'ₗ': 'l',
  'ₘ': 'm',
  'ₙ': 'n',
};

const symbolReplacements: Record<string, string> = {
  '·': '\\cdot',
  '×': '\\times',
  '−': '-',
  '–': '-',
  '—': '-',
  'Σ': '\\sum',
  '∑': '\\sum',
  'Π': '\\prod',
  '∏': '\\prod',
  'θ': '\\theta',
  'Θ': '\\Theta',
  'π': '\\pi',
  'λ': '\\lambda',
  'µ': '\\mu',
  'Ω': '\\Omega',
  'β': '\\beta',
  'γ': '\\gamma',
  'δ': '\\delta',
  'η': '\\eta',
  'κ': '\\kappa',
  'ρ': '\\rho',
  'φ': '\\phi',
  'ψ': '\\psi',
  'ω': '\\omega',
  'α': '\\alpha',
  '∈': '\\in',
  '±': '\\pm',
  '≥': '\\geq',
  '≤': '\\leq',
  '∞': '\\infty',
  '→': '\\to',
  '⇒': '\\Rightarrow',
  '↦': '\\mapsto',
  '°': '^{\\circ}',
  '%': '\\%',
};

const normalizeMathExpression = (value: string) => {
  let result = value;
  for (const [char, replacement] of Object.entries(symbolReplacements)) {
    result = result.split(char).join(replacement);
  }
  result = result.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (char) => `^{${superscriptMap[char] ?? char}}`);
  result = result.replace(/[₀₁₂₃₄₅₆₇₈₉ₖₗₘₙ]/g, (char) => `_{${subscriptMap[char] ?? char}}`);
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\\(sum|prod)\s+_/g, '\\$1_');
  return result;
};

const formatMatrixRow = (row: string) => {
  const sanitized = normalizeMathExpression(row.replace(/[.;]$/g, '').trim());
  if (!sanitized) {
    return '';
  }
  const tokens = sanitized.split(/[\s,]+/).filter((token) => token.length > 0);
  return tokens.join(' & ');
};

const wrapMatrix = (rows: string[]) => `\\begin{bmatrix} ${rows.join(' \\ ')} \\end{bmatrix}`;

const convertRowListMatrices = (text: string) =>
  text.replace(/(Filas:\s*)(\[[^\]]+\](?:,\s*\[[^\]]+\])+)/gi, (match, prefix, rowsPart) => {
    const rows = rowsPart.match(/\[[^\]]+\]/g);
    if (!rows) {
      return match;
    }
    const latexRows = rows
      .map((row: string) => formatMatrixRow(row.slice(1, -1)))
      .filter((row: string) => row.length > 0);
    if (latexRows.length === 0) {
      return match;
    }
    return `${prefix}$${wrapMatrix(latexRows)}$`;
  });

const convertSemicolonMatrices = (text: string) =>
  text.replace(/\[(?:[^\[\]]+;){1,}[^\[\]]+\](?!\()/g, (match) => {
    const content = match.slice(1, -1);
    const rows = content
      .split(';')
      .map((row: string) => row.trim())
      .filter((row: string) => row.length > 0);
    if (rows.length < 2) {
      return match;
    }
    const latexRows = rows
      .map((row: string) => formatMatrixRow(row))
      .filter((row: string) => row.length > 0);
    if (latexRows.length === 0) {
      return match;
    }
    return `$${wrapMatrix(latexRows)}$`;
  });

const convertNumericVectors = (text: string) =>
  text.replace(/(^|[^\w])(\[(?:\s*-?\d+(?:\.\d+)?\s*,\s*){2,}\s*-?\d+(?:\.\d+)?\s*\])(?=[\s.,;]|$)/g, (_, prefix, bracket) => {
    const content = bracket.slice(1, -1);
    const values = content
      .split(',')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0);
    if (values.length < 3) {
      return `${prefix}${bracket}`;
    }
    const latexRows = [formatMatrixRow(values.join(' '))];
    const rendered = `$${wrapMatrix(latexRows)}$`;
    return `${prefix}${rendered}`;
  });

const convertEquationSegments = (text: string) => {
  const equationPattern =
    /(?<!\$)([A-Za-z][A-Za-z0-9]*(?:\[[^\]]+\]|\([^)]*\))?\s*=\s*)([^\$=;,.]+?)(?=(?:\s+[yYeEoOuU]\b|\s+(?:con|sin|donde)\b|[;,.]|$))/g;
  return text.replace(equationPattern, (match, leftPart: string, rightPart: string) => {
    const candidate = `${leftPart}${rightPart}`.trim();
    if (!candidate || candidate.includes('$') || rightPart.includes('[') || candidate.length > 120) {
      return match;
    }
    if (!/[0-9\[\]()\\Σ∑πθλµΩβγδ∞±·×∈%]/.test(candidate)) {
      return match;
    }
    return `$${normalizeMathExpression(candidate)}$`;
  });
};

const preprocessText = (text: string) => {
  const withRowMatrices = convertRowListMatrices(text);
  const withSemicolonMatrices = convertSemicolonMatrices(withRowMatrices);
  const withNumericVectors = convertNumericVectors(withSemicolonMatrices);
  return convertEquationSegments(withNumericVectors);
};

const renderMath = (expression: string, key: number, displayMode = false) => {
  const trimmed = expression.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const html = katex.renderToString(trimmed, {
      throwOnError: false,
      displayMode,
      strict: 'ignore',
    });
    if (displayMode) {
      return (
        <div
          key={`md-math-${key}`}
          className={styles.blockMath}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    return (
      <span
        key={`md-math-${key}`}
        className={styles.inlineMath}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (error) {
    const fallbackClassName = `${styles.inlineMath} ${styles.mathError}`;
    return (
      <span key={`md-math-${key}`} className={fallbackClassName}>
        {expression}
      </span>
    );
  }
};

const renderTokens = (text: string): React.ReactNode[] => {
  const pattern = new RegExp(
    [
      '~~[^~]+?~~',
      '\\*\\*[^*]+?\\*\\*',
      '__[^_]+?__',
      '\\*[^*]+?\\*',
      '_[^_]+?_',
      '~[^~]+?~',
      '\\^[^^]+?\\^',
      '`[^`]+?`',
      '\\$\\$[\\s\\S]+?\\$\\$',
      '\\$[^$]+?\\$',
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

    if (/^~~.+~~$/.test(token)) {
      nodes.push(<del key={`md-del-${key}`}>{token.slice(2, -2)}</del>);
    } else if (/^\*\*.+\*\*$/.test(token) || /^__.+__$/.test(token)) {
      nodes.push(
        <strong key={`md-strong-${key}`}>{token.slice(2, -2)}</strong>
      );
    } else if (/^\*.+\*$/.test(token) || /^_.+_$/.test(token)) {
      nodes.push(
        <em key={`md-em-${key}`}>{token.slice(1, -1)}</em>
      );
    } else if (/^~.+~$/.test(token)) {
      nodes.push(
        <span key={`md-sub-${key}`} className={styles.inlineSub}>
          {token.slice(1, -1)}
        </span>
      );
    } else if (/^\^.+\^$/.test(token)) {
      nodes.push(
        <span key={`md-sup-${key}`} className={styles.inlineSup}>
          {token.slice(1, -1)}
        </span>
      );
    } else if (/^`.+`$/.test(token)) {
      nodes.push(
        <code key={`md-code-${key}`}>{token.slice(1, -1)}</code>
      );
    } else if (/^\$\$[\s\S]+\$\$$/.test(token)) {
      const expression = token.slice(2, -2);
      const rendered = renderMath(expression, key, true);
      if (rendered) {
        nodes.push(rendered);
      }
    } else if (/^\$.+\$$/.test(token)) {
      const rendered = renderMath(token.slice(1, -1), key);
      if (rendered) {
        nodes.push(rendered);
      }
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
  const prepared = preprocessText(text);
  const trimmed = prepared.trim();
  if (!trimmed) {
    return null;
  }

  return <>{renderTokens(prepared)}</>;
};

export default InlineMarkdown;
