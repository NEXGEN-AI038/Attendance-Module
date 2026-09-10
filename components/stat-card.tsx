import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'gray' | 'purple';
  subtitle?: string;
}

const colorClasses = {
  blue: 'bg-ink/5 text-ink border-ink/10',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  amber: 'bg-brass-light text-brass border-brass/20',
  gray: 'bg-muted text-muted-foreground border-border',
  purple: 'bg-[hsl(172,38%,27%)]/10 text-[hsl(172,38%,27%)] border-[hsl(172,38%,27%)]/15',
};

export function StatCard({ label, value, icon: Icon, color = 'blue', subtitle }: StatCardProps) {
  return (
    <Card className="border-t-2 border-t-brass/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="font-mono-time text-2xl font-semibold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-md border', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
