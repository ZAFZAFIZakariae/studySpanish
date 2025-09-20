import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from '@/lib/remarkGfm';

export const LessonViewer: React.FC<{ markdown: string }> = ({ markdown }) => {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
};
