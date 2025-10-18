import React from 'react';

type Props = {
  children?: React.ReactNode;
  className?: string;
};

type AnyProps = Props & Record<string, unknown>;

const ReactMarkdown: React.FC<AnyProps> = ({ children, className, ...rest }) => {
  return (
    <div className={className} data-react-markdown-mock {...rest}>
      {children}
    </div>
  );
};

export default ReactMarkdown;
