import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from '@/lib/remarkGfm';
import { LessonFigure } from './lessonFigures';
import styles from './LessonViewer.module.css';

export const LessonViewer: React.FC<{ markdown: string }> = ({ markdown }) => (
  <div className={styles.viewer}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ({ src, alt, ...rest }) => {
          if (typeof src === 'string' && src.startsWith('figure:')) {
            const figureId = src.replace(/^figure:/, '');
            return (
              <LessonFigure
                figureId={figureId}
                alt={alt ?? ''}
                className={styles.figure}
                mediaClassName={styles.figureMedia}
                captionClassName={styles.figureCaption}
                fallbackClassName={styles.figureFallback}
              />
            );
          }

          return <img src={src ?? ''} alt={alt ?? ''} {...rest} />;
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  </div>
);

export default LessonViewer;
