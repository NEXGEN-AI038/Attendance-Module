'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Profile, AttendanceRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { formatDate, formatTimestamp, formatTotalHours } from '@/lib/utils/date';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Mail, Phone, Building2, Briefcase, CalendarDays, Fingerprint, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export default function EmployeeDetail() {
  const params = useParams();
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    setError(false);

    const { data: emp, error: empError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (empError || !emp) {
      setError(true);
      setLoading(false);
      return;
    }
    setProfile(emp as Profile);

    const [year, month] = monthFilter.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const { data: att } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', params.id)
      .gte('attendance_date', format(start, 'yyyy-MM-dd'))
      .lte('attendance_date', format(end, 'yyyy-MM-dd'))
      .order('attendance_date', { ascending: false });

    setRecords((att as AttendanceRecord[]) || []);
    setLoading(false);
  }, [supabase, params.id, monthFilter]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const presentDays = records.filter((r) => r.status === 'present').length;
  const absentDays = records.filter((r) => r.status === 'absent').length;
  const leaveDays = records.filter((r) => r.status === 'leave').length;
  const lateArrivals = records.filter((r) => r.late).length;
  const avgHours =
    records.length > 0
      ? records.reduce((sum, r) => sum + (r.total_hours || 0), 0) / records.length
      : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState rows={4} />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !profile) {
    return <ErrorState message="Employee not found" onRetry={() => router.push('/admin/employees')} />;
  }

  const initials = profile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, i, 1);
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/employees')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <p className="text-sm text-muted-foreground">Employee Details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-brass-light text-brass text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <Badge
                variant="outline"
                className={profile.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}
              >
                {profile.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Employee ID', value: profile.employee_id, icon: Fingerprint },
                { label: 'Email', value: profile.email, icon: Mail },
                { label: 'Phone', value: profile.phone || '—', icon: Phone },
                { label: 'Department', value: profile.department || '—', icon: Building2 },
                { label: 'Designation', value: profile.designation || '—', icon: Briefcase },
                { label: 'Joining Date', value: profile.joining_date ? formatDate(profile.joining_date) : '—', icon: CalendarDays },
              ].map((item) => (
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Present Days" value={presentDays} icon={CheckCircle2} color="green" />
        <StatCard label="Absent Days" value={absentDays} icon={XCircle} color="red" />
        <StatCard label="Leave" value={leaveDays} icon={Clock} color="gray" />
        <StatCard label="Late Arrivals" value={lateArrivals} icon={AlertCircle} color="amber" />
        <StatCard label="Avg Hours" value={formatTotalHours(avgHours)} icon={TrendingUp} color="blue" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Attendance Records</CardTitle>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No records" description="No attendance records for this period." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{formatDate(r.attendance_date)}</TableCell>
                    <TableCell>{formatTimestamp(r.check_in)}</TableCell>
                    <TableCell>{formatTimestamp(r.check_out)}</TableCell>
                    <TableCell>{r.total_hours ? formatTotalHours(r.total_hours) : '—'}</TableCell>
                    <TableCell><StatusBadge status={r.status} late={r.late} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
