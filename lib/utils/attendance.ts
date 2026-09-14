import { AttendanceStatus } from '@/lib/types';

export function getStatusBadgeClass(status: AttendanceStatus): string {
  switch (status) {
    case 'present':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'absent':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'half_day':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'leave':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'incomplete':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function getStatusDotClass(status: AttendanceStatus): string {
  switch (status) {
    case 'present':
      return 'bg-emerald-500';
    case 'absent':
      return 'bg-red-500';
    case 'half_day':
      return 'bg-amber-500';
    case 'leave':
      return 'bg-blue-500';
    case 'incomplete':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'half_day':
      return 'Half Day';
    case 'leave':
      return 'Leave';
    case 'incomplete':
      return 'Incomplete';
    default:
      return status;
  }
}

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null)[][]
): void {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
