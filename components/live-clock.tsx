'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface LiveClockProps {
  className?: string;
  size?: 'lg' | 'sm';
}

export function LiveClock({ className, size = 'lg' }: LiveClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      <p
        className={
          size === 'lg'
            ? 'font-mono-time text-4xl font-semibold tracking-tight sm:text-5xl'
            : 'font-mono-time text-2xl font-semibold tracking-tight'
        }
      >
        {now ? format(now, 'hh:mm:ss a') : '--:--:-- --'}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {now ? format(now, 'EEEE, dd MMMM yyyy') : ' '}
      </p>
    </div>
  );
}
