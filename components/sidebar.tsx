'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Profile } from '@/lib/types';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  UserCircle,
  Clock,
  LogOut,
  Fingerprint,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  profile: Profile;
  onSignOut: () => void;
}

const employeeNav = [
  { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'My Attendance', href: '/employee/attendance', icon: CalendarDays },
  { label: 'My Profile', href: '/employee/profile', icon: UserCircle },
];

const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/admin/employees', icon: Users },
  { label: 'Attendance', href: '/admin/attendance', icon: Clock },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar({ profile, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const nav = profile.role === 'admin' ? adminNav : employeeNav;
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="flex h-full w-64 flex-col bg-ink text-ink-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brass">
          <Fingerprint className="h-5 w-5 text-ink" />
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-tight tracking-tight">
            Attendance
          </p>
          <p className="text-xs text-ink-foreground/50 leading-tight">Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white border-l-2 border-brass pl-[10px]'
                  : 'text-ink-foreground/60 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className={cn('h-4 w-4', isActive ? 'text-brass' : 'text-ink-foreground/40')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brass/20 text-brass text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{profile.full_name}</p>
            <p className="truncate text-xs text-ink-foreground/50 capitalize">{profile.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start mt-2 text-ink-foreground/60 hover:bg-white/5 hover:text-white"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
