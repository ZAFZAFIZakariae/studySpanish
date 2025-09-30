import React from 'react';
import { getNotebookRecord } from '../../data/notebookRegistry';
import type { NotebookCell } from '../../types/notebook';
import InlineMarkdown from '../InlineMarkdown';
import styles from './NotebookPreview.module.css';

interface NotebookPreviewProps {
  notebookId: string;
  path: string;
  colabUrl?: string;
}

const renderCell = (cell: NotebookCell) => {
  if (cell.type === 'markdown') {
    const content = cell.source.trim();
    if (!content) {
      return null;
    }

    const paragraphs = content
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter((block) => block.length > 0);

    return (
      <div className={styles.markdown}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>
            <InlineMarkdown text={paragraph} />
          </p>
        ))}
      </div>
    );
  }

  return (
    <>
      <pre>
        <code>{cell.source}</code>
      </pre>
      {cell.outputs && cell.outputs.length > 0 && (
        <div className={styles.outputs}>
          {cell.outputs.map((output, index) => (
            <pre key={index}>
              <code>{output}</code>
            </pre>
          ))}
        </div>
      )}
    </>
  );
};

export const NotebookPreview: React.FC<NotebookPreviewProps> = ({ notebookId, path, colabUrl }) => {
  const record = getNotebookRecord(path);

  if (!record) {
    return (
      <section className={styles.preview} aria-labelledby={`${notebookId}-notebook-heading`}>
        <header className={styles.header}>
          <h3 id={`${notebookId}-notebook-heading`}>Notebook preview</h3>
        </header>
        <p className={styles.empty}>Notebook file unavailable. Download the source repository to review the exercises.</p>
      </section>
    );
  }

  const { cells, downloadUrl } = record;

  return (
    <section className={styles.preview} aria-labelledby={`${notebookId}-notebook-heading`}>
      <header className={styles.header}>
        <h3 id={`${notebookId}-notebook-heading`}>Notebook preview</h3>
        <div className={styles.actions}>
          {colabUrl && (
            <a className={styles.actionButton} href={colabUrl} target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">☁️</span> Open in Colab
            </a>
          )}
          <a className={styles.actionButton} href={downloadUrl} download>
            <span aria-hidden="true">⬇️</span> Download .ipynb
          </a>
        </div>
      </header>
      {cells.length === 0 ? (
        <p className={styles.empty}>This notebook does not expose any cells yet. Check the repository for the latest version.</p>
      ) : (
        <ol className={styles.cellList} aria-label="Notebook cells">
          {cells.map((cell) => (
            <li key={cell.id} className={styles.cell}>
              {cell.type === 'code' ? (
                <span className="ui-chip" aria-label="Code cell">Code</span>
              ) : (
                <span className="ui-chip" aria-label="Markdown cell">Notes</span>
              )}
              {renderCell(cell)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default NotebookPreview;
