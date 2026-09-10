export type UserRole = 'employee' | 'admin';
export type UserStatus = 'active' | 'inactive';
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave' | 'incomplete';

export interface Profile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  role: UserRole;
  joining_date: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: number | null;
  status: AttendanceStatus;
  late: boolean;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithProfile extends AttendanceRecord {
  profiles: {
    employee_id: string;
    full_name: string;
    email: string;
    department: string | null;
    designation: string | null;
    status: UserStatus;
  };
}

export interface Settings {
  id: number;
  company_name: string;
  timezone: string;
  office_start_time: string;
  grace_period_minutes: number;
  default_working_hours: number;
  updated_at: string;
}

export interface MonthlySummary {
  working_days: number;
  present: number;
  absent: number;
  leave: number;
  half_day: number;
  incomplete: number;
  late_arrivals: number;
  average_hours: number;
}

export interface DashboardStats {
  total_employees: number;
  present_today: number;
  absent_today: number;
  currently_checked_in: number;
  late_arrivals: number;
  on_leave: number;
}
