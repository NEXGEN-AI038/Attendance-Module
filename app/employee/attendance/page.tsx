'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AttendanceRecord, AttendanceStatus, MonthlySummary } from '@/lib/types';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { formatTimestamp, formatTotalHours, formatDate } from '@/lib/utils/date';
import { CalendarDays, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function EmployeeAttendance() {
  const { profile } = useAuth();
  const supabase = getSupabaseClient();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(false);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', profile?.id)
      .gte('attendance_date', format(start, 'yyyy-MM-dd'))
      .lte('attendance_date', format(end, 'yyyy-MM-dd'))
      .order('attendance_date', { ascending: false });

    if (error) {
      setError(true);
    } else {
      setRecords((data as AttendanceRecord[]) || []);
    }
    setLoading(false);
  }, [supabase, profile, currentMonth]);

  useEffect(() => {
    if (profile) fetchRecords();
  }, [fetchRecords, profile]);

  const filtered = records.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.attendance_date.includes(s) || r.status.includes(s);
    }
    return true;
  });

  const summary: MonthlySummary = {
    working_days: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    leave: records.filter((r) => r.status === 'leave').length,
    half_day: records.filter((r) => r.status === 'half_day').length,
    incomplete: records.filter((r) => r.status === 'incomplete').length,
    late_arrivals: records.filter((r) => r.late).length,
    average_hours:
      records.length > 0
        ? records.reduce((sum, r) => sum + (r.total_hours || 0), 0) / records.length
        : 0,
  };

  const chartData = records
    .filter((r) => r.total_hours)
    .sort((a, b) => a.attendance_date.localeCompare(b.attendance_date))
    .map((r) => ({
      date: format(parseISO(r.attendance_date), 'dd'),
      hours: Number(r.total_hours),
    }));

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-sm text-muted-foreground">View and track your attendance history</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Working Days" value={summary.working_days} icon={CalendarDays} color="blue" />
        <StatCard label="Present" value={summary.present} icon={CheckCircle2} color="green" />
        <StatCard label="Absent" value={summary.absent} icon={XCircle} color="red" />
        <StatCard label="Leave" value={summary.leave} icon={Clock} color="gray" />
        <StatCard label="Half Days" value={summary.half_day} icon={AlertCircle} color="amber" />
        <StatCard label="Avg Hours" value={formatTotalHours(summary.average_hours)} icon={TrendingUp} color="purple" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Attendance Chart</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                  formatter={(v: number) => [`${v}h`, 'Hours']}
                />
                <Bar dataKey="hours" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No data for this month</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Attendance History</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center text-sm font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by date or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <LoadingState rows={6} />
          ) : error ? (
            <ErrorState onRetry={fetchRecords} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No attendance records"
              description="You have no attendance records for the selected period."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{formatDate(record.attendance_date)}</TableCell>
                    <TableCell>{formatTimestamp(record.check_in)}</TableCell>
                    <TableCell>{formatTimestamp(record.check_out)}</TableCell>
                    <TableCell>
                      {record.total_hours ? formatTotalHours(record.total_hours) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} late={record.late} />
                    </TableCell>
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
