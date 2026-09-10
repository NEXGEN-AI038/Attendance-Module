/*
# Employee Attendance Portal - Core Schema

1. Purpose
   Creates the complete database schema for an Employee Attendance Management Portal.
   Supports employee login, check-in/check-out with server-generated timestamps,
   attendance history, admin dashboards, employee management, reports, and settings.

2. New Tables
   - `profiles`: Employee profiles linked to Supabase auth.users. Contains employee_id,
     full_name, email, phone, department, designation, role (employee/admin), joining_date,
     status (active/inactive), created_at, updated_at.
   - `attendance`: Daily attendance records per employee. Contains employee_id (FK to profiles),
     attendance_date, check_in, check_out, total_hours, status (present/absent/half_day/leave/incomplete),
     late (boolean), created_at, updated_at. Unique constraint on (employee_id, attendance_date).
   - `settings`: Company-wide settings (singleton row). Contains company_name, timezone,
     office_start_time, grace_period_minutes, default_working_hours, updated_at.

3. Security (RLS)
   - profiles: Employees can read/update their own profile. Admins can read/update all profiles.
   - attendance: Employees can read their own attendance. Admins can read all attendance.
     Employees CANNOT directly insert/update attendance (must use SECURITY DEFINER functions).
     Admins can insert/update attendance for corrections.
   - settings: Admins can read/update. Employees can read.

4. PostgreSQL Functions (SECURITY DEFINER)
   - `check_in()`: Creates today's attendance record with server-generated check_in timestamp.
   - `check_out()`: Updates today's attendance record with server-generated check_out timestamp.
   - `get_todays_attendance()`: Returns today's attendance for the calling user.
   - `is_admin()`: Helper to check if the current user has admin role.
   - `get_server_time()`: Returns current server time.

5. Important Notes
   - All timestamps are generated server-side using now() - never trusted from the client.
   - The unique constraint on (employee_id, attendance_date) prevents duplicate daily attendance.
   - Late detection is based on settings.office_start_time + grace_period_minutes.
   - Attendance insert/update by employees is blocked via RLS; only SECURITY DEFINER functions can write.
*/

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id varchar UNIQUE NOT NULL,
  full_name varchar NOT NULL,
  email varchar UNIQUE NOT NULL,
  phone varchar,
  department varchar,
  designation varchar,
  role varchar NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  joining_date date,
  status varchar NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "insert_profile_admin" ON profiles;
CREATE POLICY "insert_profile_admin" ON profiles FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  attendance_date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  total_hours numeric(5,2),
  status varchar NOT NULL DEFAULT 'incomplete' CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'incomplete')),
  late boolean NOT NULL DEFAULT false,
  check_in_latitude numeric(10,7),
  check_in_longitude numeric(10,7),
  check_out_latitude numeric(10,7),
  check_out_longitude numeric(10,7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_employee_date_unique ON attendance (employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance (employee_id);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attendance" ON attendance;
CREATE POLICY "select_own_attendance" ON attendance FOR SELECT
  TO authenticated USING (
    employee_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_attendance_admin" ON attendance;
CREATE POLICY "insert_attendance_admin" ON attendance FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "update_attendance_admin" ON attendance;
CREATE POLICY "update_attendance_admin" ON attendance FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name varchar NOT NULL DEFAULT 'Acme Corporation',
  timezone varchar NOT NULL DEFAULT 'Asia/Kolkata',
  office_start_time time NOT NULL DEFAULT '09:30:00',
  grace_period_minutes int NOT NULL DEFAULT 15,
  default_working_hours numeric(4,2) NOT NULL DEFAULT 8.00,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_settings" ON settings;
CREATE POLICY "select_settings" ON settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_settings_admin" ON settings;
CREATE POLICY "update_settings_admin" ON settings FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "insert_settings_admin" ON settings;
CREATE POLICY "insert_settings_admin" ON settings FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTION: is_admin()
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================
-- FUNCTION: check_in()
-- ============================================
DROP FUNCTION IF EXISTS check_in();
CREATE OR REPLACE FUNCTION check_in(p_latitude numeric DEFAULT NULL, p_longitude numeric DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  employee_id uuid,
  attendance_date date,
  check_in timestamptz,
  check_out timestamptz,
  total_hours numeric,
  status varchar,
  late boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid := auth.uid();
  v_profile profiles%ROWTYPE;
  v_today date := CURRENT_DATE;
  v_existing attendance%ROWTYPE;
  v_settings settings%ROWTYPE;
  v_check_in_time timestamptz := now();
  v_office_start timestamptz;
  v_late_threshold timestamptz;
  v_is_late boolean := false;
  v_record_exists boolean := false;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE profiles.id = v_employee_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF v_profile.status = 'inactive' THEN
    RAISE EXCEPTION 'Employee account is inactive';
  END IF;

  SELECT * INTO v_existing FROM attendance WHERE attendance.employee_id = v_employee_id AND attendance.attendance_date = v_today;
  v_record_exists := FOUND;
  IF v_record_exists AND v_existing.check_in IS NOT NULL THEN
    RETURN QUERY SELECT v_existing.id, v_existing.employee_id, v_existing.attendance_date,
      v_existing.check_in, v_existing.check_out, v_existing.total_hours,
      v_existing.status, v_existing.late, v_existing.created_at, v_existing.updated_at;
    RETURN;
  END IF;

  SELECT * INTO v_settings FROM settings WHERE settings.id = 1;
  v_office_start := (v_today || ' ' || v_settings.office_start_time)::timestamptz;
  v_late_threshold := v_office_start + (v_settings.grace_period_minutes || ' minutes')::interval;
  v_is_late := v_check_in_time > v_late_threshold;

  IF v_record_exists THEN
    UPDATE attendance
    SET check_in = v_check_in_time, late = v_is_late, status = 'present',
      check_in_latitude = p_latitude, check_in_longitude = p_longitude, updated_at = now()
    WHERE attendance.id = v_existing.id
    RETURNING *
    INTO v_existing;
    RETURN QUERY SELECT v_existing.id, v_existing.employee_id, v_existing.attendance_date,
      v_existing.check_in, v_existing.check_out, v_existing.total_hours,
      v_existing.status, v_existing.late, v_existing.created_at, v_existing.updated_at;
    RETURN;
  END IF;

  INSERT INTO attendance (employee_id, attendance_date, check_in, status, late, check_in_latitude, check_in_longitude)
  VALUES (v_employee_id, v_today, v_check_in_time, 'present', v_is_late, p_latitude, p_longitude)
  RETURNING *
  INTO v_existing;

  RETURN QUERY SELECT v_existing.id, v_existing.employee_id, v_existing.attendance_date,
    v_existing.check_in, v_existing.check_out, v_existing.total_hours,
    v_existing.status, v_existing.late, v_existing.created_at, v_existing.updated_at;
  RETURN;
END;
$$;

-- ============================================
-- FUNCTION: check_out()
-- ============================================
DROP FUNCTION IF EXISTS check_out();
CREATE OR REPLACE FUNCTION check_out(p_latitude numeric DEFAULT NULL, p_longitude numeric DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  employee_id uuid,
  attendance_date date,
  check_in timestamptz,
  check_out timestamptz,
  total_hours numeric,
  status varchar,
  late boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_existing attendance%ROWTYPE;
  v_check_out_time timestamptz := now();
  v_total_hours numeric;
  v_settings settings%ROWTYPE;
  v_status varchar;
BEGIN
  SELECT * INTO v_existing FROM attendance WHERE attendance.employee_id = v_employee_id AND attendance.attendance_date = v_today;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No attendance record found for today. Please check in first.';
  END IF;
  IF v_existing.check_in IS NULL THEN
    RAISE EXCEPTION 'You have not checked in yet. Please check in first.';
  END IF;
  IF v_existing.check_out IS NOT NULL THEN
    RETURN QUERY SELECT v_existing.id, v_existing.employee_id, v_existing.attendance_date,
      v_existing.check_in, v_existing.check_out, v_existing.total_hours,
      v_existing.status, v_existing.late, v_existing.created_at, v_existing.updated_at;
    RETURN;
  END IF;

  v_total_hours := EXTRACT(EPOCH FROM (v_check_out_time - v_existing.check_in)) / 3600;
  v_total_hours := ROUND(v_total_hours, 2);

  SELECT * INTO v_settings FROM settings WHERE settings.id = 1;
  IF v_total_hours >= v_settings.default_working_hours THEN
    v_status := 'present';
  ELSIF v_total_hours >= v_settings.default_working_hours / 2 THEN
    v_status := 'half_day';
  ELSE
    v_status := 'incomplete';
  END IF;

  UPDATE attendance
  SET check_out = v_check_out_time, total_hours = v_total_hours, status = v_status,
    check_out_latitude = p_latitude, check_out_longitude = p_longitude, updated_at = now()
  WHERE attendance.id = v_existing.id
  RETURNING *
  INTO v_existing;

  RETURN QUERY SELECT v_existing.id, v_existing.employee_id, v_existing.attendance_date,
    v_existing.check_in, v_existing.check_out, v_existing.total_hours,
    v_existing.status, v_existing.late, v_existing.created_at, v_existing.updated_at;
  RETURN;
END;
$$;

-- ============================================
-- FUNCTION: get_todays_attendance()
-- ============================================
CREATE OR REPLACE FUNCTION get_todays_attendance()
RETURNS TABLE (
  id uuid,
  employee_id uuid,
  attendance_date date,
  check_in timestamptz,
  check_out timestamptz,
  total_hours numeric,
  status varchar,
  late boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT a.id, a.employee_id, a.attendance_date, a.check_in, a.check_out,
    a.total_hours, a.status, a.late, a.created_at, a.updated_at
  FROM attendance a
  WHERE a.employee_id = auth.uid() AND a.attendance_date = CURRENT_DATE;
$$;

-- ============================================
-- FUNCTION: get_server_time()
-- ============================================
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT now();
$$;

-- ============================================
-- TRIGGERS: update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS attendance_updated_at ON attendance;
CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
