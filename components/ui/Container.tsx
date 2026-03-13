import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`max-w-screen-xl mx-auto px-[0.8rem] md:px-8 ${className}`}>
      {children}
    </div>
  );
};