'use client';

import { useAuth } from '@/lib/auth-context';
import { AttendanceCard } from '@/components/attendance-card';
import { LiveClock } from '@/components/live-clock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { getSupabaseClient } from '@/lib/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';
import { CalendarDays, Clock, TrendingUp, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AttendanceRecord } from '@/lib/types';
import { formatTotalHours } from '@/lib/utils/date';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function EmployeeDashboard() {
  const { profile } = useAuth();
  const supabase = getSupabaseClient();
  const [monthlyData, setMonthlyData] = useState<AttendanceRecord[]>([]);
  const [chartData, setChartData] = useState<{ date: string; hours: number }[]>([]);

  useEffect(() => {
    const fetchMonthly = async () => {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', profile?.id)
        .gte('attendance_date', format(start, 'yyyy-MM-dd'))
        .lte('attendance_date', format(end, 'yyyy-MM-dd'))
        .order('attendance_date', { ascending: true });

      if (data) {
        setMonthlyData(data as AttendanceRecord[]);
        const days = eachDayOfInterval({ start, end });
        const chart = days.map((day) => {
          const record = data.find((r) => r.attendance_date === format(day, 'yyyy-MM-dd'));
          return {
            date: format(day, 'dd'),
            hours: record?.total_hours ? Number(record.total_hours) : 0,
          };
        });
        setChartData(chart);
      }
    };

    if (profile) fetchMonthly();
  }, [supabase, profile]);

  const presentDays = monthlyData.filter((r) => r.status === 'present').length;
  const lateDays = monthlyData.filter((r) => r.late).length;
  const avgHours =
    monthlyData.length > 0
      ? monthlyData.reduce((sum, r) => sum + (r.total_hours || 0), 0) / monthlyData.length
      : 0;

  return (
    <div className="space-y-6">
      <Card className="border-t-2 border-t-brass/60">
        <CardContent className="flex items-center justify-center py-6">
          <LiveClock className="text-center" />
        </CardContent>
      </Card>

      <AttendanceCard />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Present This Month"
          value={presentDays}
          icon={CalendarDays}
          color="green"
        />
        <StatCard
          label="Late Arrivals"
          value={lateDays}
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="Avg Working Hours"
          value={formatTotalHours(avgHours)}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          label="Total Records"
          value={monthlyData.length}
          icon={Award}
          color="gray"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Working Hours</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}h`, 'Hours']}
                />
                <Bar dataKey="hours" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No data for this month yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
