import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { tailwindClasses } from '../../utils/tailwindClasses';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'link';
  children: ReactNode;
  loading?: boolean;
  pointer?: boolean;
}

export default function Button({
  variant = 'secondary',
  children,
  loading = false,
  disabled,
  className = '',
  pointer = true,
  ...props
}: ButtonProps) {
  const baseClass = tailwindClasses.btn[variant];
  const disabledClass = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : pointer ? 'cursor-pointer' : '';
  return (
    <button
      className={`${baseClass} ${disabledClass} ${className} ${pointer ? 'cursor-pointer' : ''}`}
      disabled={disabled || loading}
      {...props}>
      {loading ? 'Chargement...' : children}
    </button>
  );
}
