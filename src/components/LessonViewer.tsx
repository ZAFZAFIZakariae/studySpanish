import React from 'react';
import ReactMarkdown from 'react-markdown';

export const LessonViewer: React.FC<{ markdown: string }> = ({ markdown }) => {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};
