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

  const timeClass =
    size === 'lg'
      ? 'font-mono-time text-4xl font-semibold tracking-tight sm:text-5xl'
      : 'font-mono-time text-2xl font-semibold tracking-tight';

  const colon = (
    <span className="motion-safe:animate-pulse text-brass" aria-hidden="true">
      :
    </span>
  );

  return (
    <div className={className}>
      {now ? (
        <p className={cnTimeGlow(timeClass)}>
          {format(now, 'hh')}
          {colon}
          {format(now, 'mm')}
          {colon}
          {format(now, 'ss')}
          <span className="ml-1 text-2xl sm:text-3xl">{format(now, 'a')}</span>
        </p>
      ) : (
        <p className={timeClass}>--:--:-- --</p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">
        {now ? format(now, 'EEEE, dd MMMM yyyy') : ' '}
      </p>
    </div>
  );
}

function cnTimeGlow(base: string) {
  return `${base} [text-shadow:0_0_24px_hsl(var(--brass)/0.18)]`;
}
