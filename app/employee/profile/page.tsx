'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  CalendarDays,
  UserCircle,
  Fingerprint,
} from 'lucide-react';

export default function EmployeeProfile() {
  const { profile } = useAuth();

  if (!profile) return null;

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const info = [
    { label: 'Employee ID', value: profile.employee_id, icon: Fingerprint },
    { label: 'Email', value: profile.email, icon: Mail },
    { label: 'Phone', value: profile.phone || '—', icon: Phone },
    { label: 'Department', value: profile.department || '—', icon: Building2 },
    { label: 'Designation', value: profile.designation || '—', icon: Briefcase },
    { label: 'Joining Date', value: profile.joining_date ? formatDate(profile.joining_date) : '—', icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">View your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-brass-light text-brass text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Badge
                variant="outline"
                className={
                  profile.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-red-100 text-red-700 border-red-200'
                }
              >
                {profile.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-bold">{profile.full_name}</h2>
                <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {info.map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-light">
                      <item.icon className="h-4 w-4 text-brass" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
