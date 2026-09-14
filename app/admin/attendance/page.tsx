'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AttendanceWithProfile } from '@/lib/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { formatTimestamp, formatTotalHours, formatDate } from '@/lib/utils/date';
import { exportToCSV } from '@/lib/utils/attendance';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
} from 'lucide-react';
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

export default function AdminAttendance() {
  const supabase = getSupabaseClient();
  const [records, setRecords] = useState<AttendanceWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(false);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const { data, error } = await supabase
      .from('attendance')
      .select(
        `
        id,
        employee_id,
        attendance_date,
        check_in,
        check_out,
        total_hours,
        status,
        late,
        check_in_latitude,
        check_in_longitude,
        check_out_latitude,
        check_out_longitude,
        break_start,
        break_end,
        break_minutes,
        created_at,
        updated_at,
        profiles!inner (
          employee_id,
          full_name,
          email,
          department,
          designation,
          status
        )
      `
      )
      .gte('attendance_date', format(start, 'yyyy-MM-dd'))
      .lte('attendance_date', format(end, 'yyyy-MM-dd'))
      .order('attendance_date', { ascending: false });

    if (error) {
      setError(true);
    } else {
      setRecords((data as unknown as AttendanceWithProfile[]) || []);
    }
    setLoading(false);
  }, [supabase, currentMonth]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.profiles?.department) set.add(r.profiles.department);
    });
    return Array.from(set).sort();
  }, [records]);

  const filtered = records.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (deptFilter !== 'all' && r.profiles?.department !== deptFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.profiles?.full_name?.toLowerCase().includes(s) ||
        r.profiles?.employee_id?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.late).length;

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const handleExport = () => {
    exportToCSV(
      `attendance_${format(currentMonth, 'yyyy_MM')}.csv`,
      ['Employee ID', 'Name', 'Department', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Late'],
      filtered.map((r) => [
        r.profiles?.employee_id ?? '',
        r.profiles?.full_name ?? '',
        r.profiles?.department ?? '',
        r.attendance_date,
        r.check_in,
        r.check_out,
        r.total_hours,
        r.status,
        r.late ? 'Yes' : 'No',
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">Attendance records across all employees</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Records This Month" value={records.length} icon={CalendarDays} color="blue" />
        <StatCard label="Present" value={presentCount} icon={CheckCircle2} color="green" />
        <StatCard label="Absent" value={absentCount} icon={XCircle} color="red" />
        <StatCard label="Late Arrivals" value={lateCount} icon={AlertCircle} color="amber" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Attendance Records</CardTitle>
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
                placeholder="Search by employee name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <LoadingState rows={8} />
          ) : error ? (
            <ErrorState onRetry={fetchRecords} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No attendance records"
              description="No records match the selected filters for this month."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.profiles?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{record.profiles?.employee_id}</div>
                      </TableCell>
                      <TableCell>{record.profiles?.department || '—'}</TableCell>
                      <TableCell className="font-medium">{formatDate(record.attendance_date)}</TableCell>
                      <TableCell>{formatTimestamp(record.check_in)}</TableCell>
                      <TableCell>{formatTimestamp(record.check_out)}</TableCell>
                      <TableCell>
                        {record.total_hours ? formatTotalHours(record.total_hours) : '—'}
                      </TableCell>
                      <TableCell>
                        {record.break_minutes ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                            {Math.round(record.break_minutes)}m
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} late={record.late} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-xs">
                          {record.check_in_latitude != null && record.check_in_longitude != null ? (
                            <a
                              href={`https://www.google.com/maps?q=${record.check_in_latitude},${record.check_in_longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[hsl(172,38%,27%)] hover:underline"
                              title="View check-in location"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              In
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {record.check_out_latitude != null && record.check_out_longitude != null && (
                            <a
                              href={`https://www.google.com/maps?q=${record.check_out_latitude},${record.check_out_longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-brass hover:underline"
                              title="View check-out location"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              Out
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
