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

const topBorderClasses = {
  blue: 'border-t-ink/50 hover:border-t-ink',
  green: 'border-t-emerald-400 hover:border-t-emerald-600',
  red: 'border-t-red-400 hover:border-t-red-600',
  amber: 'border-t-brass/60 hover:border-t-brass',
  gray: 'border-t-muted-foreground/30 hover:border-t-muted-foreground/60',
  purple: 'border-t-[hsl(172,38%,27%)]/60 hover:border-t-[hsl(172,38%,27%)]',
};

export function StatCard({ label, value, icon: Icon, color = 'blue', subtitle }: StatCardProps) {
  return (
    <Card
      className={cn(
        'group border-t-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        topBorderClasses[color]
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="font-mono-time text-2xl font-semibold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-md border transition-transform duration-300 group-hover:scale-110',
              colorClasses[color]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
