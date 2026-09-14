import { Badge } from '@/components/ui/badge';
import { AttendanceStatus } from '@/lib/types';
import { getStatusBadgeClass, getStatusLabel, getStatusDotClass } from '@/lib/utils/attendance';
import { cn } from '@/lib/utils';

export function StatusBadge({ status, late }: { status: AttendanceStatus; late?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={cn('font-medium gap-1.5 transition-colors', getStatusBadgeClass(status))}>
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            getStatusDotClass(status),
            status === 'present' && 'motion-safe:animate-pulse'
          )}
        />
        {getStatusLabel(status)}
      </Badge>
      {late && (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 font-medium">
          Late
        </Badge>
      )}
    </div>
  );
}
