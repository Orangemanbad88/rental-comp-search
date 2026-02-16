'use client';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        // Primary - burgundy gradient
        variant === 'primary' && 'btn-premium focus:ring-burgundy/50',
        // Secondary - walnut
        variant === 'secondary' && 'bg-walnut text-cream border border-walnut-dark hover:bg-walnut-light focus:ring-walnut shadow-md',
        // Outline - gold border
        variant === 'outline' && 'border-2 border-burgundy/30 dark:border-gold/30 bg-transparent text-burgundy dark:text-gold hover:bg-burgundy/5 dark:hover:bg-gold/5 hover:border-burgundy dark:hover:border-gold focus:ring-gold/50',
        // Ghost - minimal
        variant === 'ghost' && 'text-walnut dark:text-cream hover:bg-walnut/5 dark:hover:bg-cream/5 focus:ring-walnut/30',
        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-sm gap-1.5',
        size === 'md' && 'px-4 py-2.5 text-sm gap-2',
        size === 'lg' && 'px-6 py-3 text-base gap-2',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
