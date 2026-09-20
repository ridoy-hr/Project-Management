import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline';
  className?: string;
}

export function Avatar({ initials, src, size = 'md', status, className }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-10 h-10',
    md: 'w-[56px] h-[56px]',
    lg: 'w-20 h-20',
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center rounded-[16px] bg-black-100 border border-black-200 shrink-0", sizes[size], className)}>
      {src ? (
        <img src={src} alt="User Profile Photo" loading="lazy" className="w-full h-full object-cover rounded-[16px]" />
      ) : (
        <span className="font-semibold text-black text-[16px]">{initials}</span>
      )}
      {status === 'online' && (
        <span className="absolute -bottom-1 -right-1 w-[10px] h-[10px] bg-mp-green-500 rounded-full ring-[4px] ring-white"></span>
      )}
    </div>
  );
}
