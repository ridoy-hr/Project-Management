import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'bordered' | 'icon' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none gap-3 whitespace-nowrap cursor-pointer';
    
    const variants = {
      primary: 'bg-mp-green-700 text-white hover:bg-mp-green-800 focus:bg-mp-green-700 disabled:bg-black-200 disabled:text-white',
      secondary: 'bg-black-50 text-black hover:bg-black-100 focus:bg-black-50 disabled:bg-black-200 disabled:text-white',
      bordered: 'bg-transparent border-2 border-black text-black hover:bg-black-50 focus:bg-black-50 disabled:border-black-200 disabled:text-black-200',
      icon: 'bg-mp-green-700 text-white hover:bg-mp-green-800 focus:bg-mp-green-default disabled:bg-black-200 disabled:text-white p-0',
      ghost: 'bg-transparent text-black hover:bg-black-50 focus:bg-black-50 disabled:bg-transparent disabled:text-black-200',
    };

    const sizes = {
      sm: 'h-10 px-3 py-2 text-[12px]',
      md: 'h-[50px] px-4 py-3 text-[14px]',
      lg: 'h-[60px] px-5 py-4 text-[16px]',
    };
    
    if (variant === 'icon') {
        sizes.sm = 'h-10 w-10 p-0';
        sizes.md = 'h-[50px] w-[50px] p-0';
        sizes.lg = 'h-[60px] w-[60px] p-0';
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
