'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AttendanceRecord } from '@/lib/types';
import { formatTimestamp, formatTotalHours, formatDuration } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, CheckCircle2, Loader2, CalendarCheck } from 'lucide-react';

export function AttendanceCard() {
  const supabase = getSupabaseClient();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_todays_attendance');
    if (error) {
      toast.error('Unable to load attendance data');
    } else if (data && data.length > 0) {
      setRecord(data[0] as AttendanceRecord);
    } else {
      setRecord(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  useEffect(() => {
    if (!record?.check_in || record?.check_out) return;
    const startTime = new Date(record.check_in).getTime();
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [record]);

  const getCoords = (): Promise<{ latitude: number | null; longitude: number | null }> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Permission denied, timed out, or unavailable — still allow check-in/out without location.
          resolve({ latitude: null, longitude: null });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    const { latitude, longitude } = await getCoords();
    const { data, error } = await supabase.rpc('check_in', {
      p_latitude: latitude,
      p_longitude: longitude,
    });
    if (error) {
      if (error.message.includes('inactive')) {
        toast.error('Your account is inactive. Please contact an administrator.');
      } else {
        toast.error('Unable to record attendance. Please try again.');
      }
    } else if (data && data.length > 0) {
      setRecord(data[0] as AttendanceRecord);
      toast.success(`Check-in recorded successfully at ${formatTimestamp(data[0].check_in)}`);
    }
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    const { latitude, longitude } = await getCoords();
    const { data, error } = await supabase.rpc('check_out', {
      p_latitude: latitude,
      p_longitude: longitude,
    });
    if (error) {
      if (error.message.includes('not checked in') || error.message.includes('check in first')) {
        toast.error('Please check in before checking out.');
      } else {
        toast.error('Unable to record attendance. Please try again.');
      }
    } else if (data && data.length > 0) {
      setRecord(data[0] as AttendanceRecord);
      toast.success(`Check-out recorded successfully at ${formatTimestamp(data[0].check_out)}`);
    }
    setActionLoading(false);
  };

  const isCheckedIn = !!record?.check_in;
  const isCheckedOut = !!record?.check_out;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-ink text-ink-foreground">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg text-white flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-brass" />
            Today's Attendance
          </CardTitle>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            {loading ? 'Loading...' : !isCheckedIn ? 'Not Checked In' : isCheckedOut ? 'Completed' : 'Checked In'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brass" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-md border bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Check In</p>
                <p className="font-mono-time mt-1 text-lg font-semibold">
                  {formatTimestamp(record?.check_in ?? null)}
                </p>
              </div>
              <div className="rounded-md border bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Check Out</p>
                <p className="font-mono-time mt-1 text-lg font-semibold">
                  {formatTimestamp(record?.check_out ?? null)}
                </p>
              </div>
              <div className="rounded-md border bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Hours</p>
                <p className="font-mono-time mt-1 text-lg font-semibold">
                  {isCheckedOut && record?.total_hours != null
                    ? formatTotalHours(record.total_hours)
                    : isCheckedIn && !isCheckedOut
                    ? formatDuration(elapsed)
                    : '—'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              {!isCheckedIn && (
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-semibold bg-[hsl(172,38%,27%)] hover:bg-[hsl(172,38%,22%)] text-white"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-5 w-5" />
                  )}
                  Check in
                </Button>
              )}
              {isCheckedIn && !isCheckedOut && (
                <>
                  <p className="mb-3 text-center text-sm text-muted-foreground">
                    Checked in at {formatTimestamp(record?.check_in ?? null)}
                    {record?.late && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-brass-light px-2 py-0.5 text-xs font-medium text-brass">
                        Late
                      </span>
                    )}
                  </p>
                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-semibold bg-brass hover:bg-brass/90 text-white"
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-5 w-5" />
                    )}
                    Check out
                  </Button>
                </>
              )}
              {isCheckedOut && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <CheckCircle2 className="h-12 w-12 text-[hsl(172,38%,27%)]" />
                  <p className="font-display text-base font-semibold text-foreground">Attendance completed</p>
                  <p className="font-mono-time text-sm text-muted-foreground">
                    Total working hours: {formatTotalHours(record?.total_hours ?? null)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
