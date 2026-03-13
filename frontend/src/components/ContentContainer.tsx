import type { ReactNode } from 'react';
import './ContentContainer.less';

interface ContentContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ContentContainer({ children, className }: ContentContainerProps) {
  return (
    <div className={`content-container${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
