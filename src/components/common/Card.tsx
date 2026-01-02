import type { ReactNode } from 'react';
import { tailwindClasses } from '../../utils/tailwindClasses';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`${tailwindClasses.card} ${className}`}>
      {title && (
        <div className={tailwindClasses.cardHeader}>
          <h3 className={tailwindClasses.cardTitle}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

