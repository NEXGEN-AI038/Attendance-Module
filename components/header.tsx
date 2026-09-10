'use client';

import { Profile } from '@/lib/types';
import { getGreeting } from '@/lib/utils/date';
import { format } from 'date-fns';
import { Fingerprint, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Sidebar } from '@/components/sidebar';

interface HeaderProps {
  profile: Profile;
  onSignOut: () => void;
}

export function Header({ profile, onSignOut }: HeaderProps) {
  const today = format(new Date(), 'EEEE, dd MMMM yyyy');

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar profile={profile} onSignOut={onSignOut} />
          </SheetContent>
        </Sheet>
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight lg:text-xl">
            {getGreeting()}, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md bg-brass-light px-3 py-1.5 sm:flex">
          <Fingerprint className="h-4 w-4 text-brass" />
          <span className="font-mono-time text-sm font-medium text-brass">{profile.employee_id}</span>
        </div>
      </div>
    </header>
  );
}
