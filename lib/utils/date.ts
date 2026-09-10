import { format, parseISO } from 'date-fns';

export function formatTimestamp(ts: string | null): string {
  if (!ts) return '—';
  try {
    return format(parseISO(ts), 'hh:mm a');
  } catch {
    return '—';
  }
}

export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function formatDateShort(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd MMM');
  } catch {
    return '—';
  }
}

export function formatTotalHours(hours: number | null): string {
  if (hours === null || hours === undefined) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function monthName(year: number, month: number): string {
  return format(new Date(year, month), 'MMMM yyyy');
}
