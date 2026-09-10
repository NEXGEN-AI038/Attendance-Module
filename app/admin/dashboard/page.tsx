'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { LiveClock } from '@/components/live-clock';
import { StatusBadge } from '@/components/status-badge';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { formatTimestamp, formatTotalHours, formatDate } from '@/lib/utils/date';
import { format } from 'date-fns';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  CalendarDays,
  Search,
  TrendingUp,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardData {
  stats: {
    total_employees: number;
    present_today: number;
    absent_today: number;
    currently_checked_in: number;
    late_arrivals: number;
    on_leave: number;
  };
  todayAttendance: {
    id: string;
    employee_id: string;
    full_name: string;
    department: string | null;
    check_in: string | null;
    check_out: string | null;
    total_hours: number | null;
    status: string;
    late: boolean;
  }[];
}

export default function AdminDashboard() {
  const supabase = getSupabaseClient();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(false);

    const today = format(new Date(), 'yyyy-MM-dd');

    const { data: employees } = await supabase
      .from('profiles')
      .select('id, employee_id, full_name, department, status, role')
      .eq('role', 'employee');

    const { data: attendance } = await supabase
      .from('attendance')
      .select(`
        id,
        check_in,
        check_out,
        total_hours,
        status,
        late,
        employee_id,
        profiles!inner (
          employee_id,
          full_name,
          department
        )
      `)
      .eq('attendance_date', today);

    if (employees && attendance) {
      const activeEmployees = (employees as any[]).filter((e) => e.status === 'active');
      const totalEmployees = activeEmployees.length;
      const presentToday = (attendance as any[]).filter((a) => a.status === 'present' || a.status === 'half_day').length;
      const onLeave = (attendance as any[]).filter((a) => a.status === 'leave').length;
      const lateArrivals = (attendance as any[]).filter((a) => a.late).length;
      const currentlyCheckedIn = (attendance as any[]).filter((a) => a.check_in && !a.check_out).length;
      const absentToday = totalEmployees - presentToday - onLeave;

      const todayAtt = (attendance as any[]).map((a) => ({
        id: a.id,
        employee_id: a.profiles?.employee_id || '',
        full_name: a.profiles?.full_name || '',
        department: a.profiles?.department || null,
        check_in: a.check_in,
        check_out: a.check_out,
        total_hours: a.total_hours,
        status: a.status,
        late: a.late,
      }));

      setData({
        stats: {
          total_employees: totalEmployees,
          present_today: presentToday,
          absent_today: absentToday,
          currently_checked_in: currentlyCheckedIn,
          late_arrivals: lateArrivals,
          on_leave: onLeave,
        },
        todayAttendance: todayAtt,
      });

      const depts = Array.from(new Set(activeEmployees.map((e: any) => e.department).filter(Boolean))) as string[];
      setDepartments(depts);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const filtered = (data?.todayAttendance || []).filter((a) => {
    if (deptFilter !== 'all' && a.department !== deptFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.full_name.toLowerCase().includes(s) || a.employee_id.toLowerCase().includes(s);
    }
    return true;
  });

  const pieData = data
    ? [
        { name: 'Present', value: data.stats.present_today, color: 'hsl(142 71% 45%)' },
        { name: 'Absent', value: data.stats.absent_today, color: 'hsl(0 84% 60%)' },
        { name: 'On Leave', value: data.stats.on_leave, color: 'hsl(221 83% 53%)' },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState onRetry={fetchDashboard} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <Card className="border-t-2 border-t-brass/60 sm:w-auto">
          <CardContent className="px-6 py-3">
            <LiveClock size="sm" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Employees" value={data.stats.total_employees} icon={Users} color="blue" />
        <StatCard label="Present Today" value={data.stats.present_today} icon={CheckCircle2} color="green" />
        <StatCard label="Absent Today" value={data.stats.absent_today} icon={XCircle} color="red" />
        <StatCard label="Checked In Now" value={data.stats.currently_checked_in} icon={Clock} color="amber" />
        <StatCard label="Late Arrivals" value={data.stats.late_arrivals} icon={AlertCircle} color="purple" />
        <StatCard label="On Leave" value={data.stats.on_leave} icon={CalendarDays} color="gray" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No attendance records"
                description="No employees match the current filters."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 20).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.full_name}</TableCell>
                      <TableCell>{a.employee_id}</TableCell>
                      <TableCell>{a.department || '—'}</TableCell>
                      <TableCell>{formatTimestamp(a.check_in)}</TableCell>
                      <TableCell>{formatTimestamp(a.check_out)}</TableCell>
                      <TableCell>{a.total_hours ? formatTotalHours(a.total_hours) : '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status as any} late={a.late} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                />
                <Legend fontSize={12} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
