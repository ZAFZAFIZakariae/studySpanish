import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfmPlugin from '../lib/remarkGfmPlugin';

export const LessonViewer: React.FC<{ markdown: string }> = ({ markdown }) => {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfmPlugin]}>{markdown}</ReactMarkdown>
    </div>
  );
};
