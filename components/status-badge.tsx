import { Badge } from '@/components/ui/badge';
import { AttendanceStatus } from '@/lib/types';
import { getStatusBadgeClass, getStatusLabel } from '@/lib/utils/attendance';
import { cn } from '@/lib/utils';

export function StatusBadge({ status, late }: { status: AttendanceStatus; late?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={cn('font-medium', getStatusBadgeClass(status))}>
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
