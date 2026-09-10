'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Fingerprint, Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) {
          router.push(profile.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
          return;
        }
      }
      setChecking(false);
    })();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      toast.error(error.message || 'Invalid email or password');
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        toast.error('Account not found. Please contact an administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (profile.status === 'inactive') {
        toast.error('Your account is inactive. Please contact an administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success('Welcome back!');
      router.push(profile.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    }
  };

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink p-12 text-ink-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, hsl(var(--brass)) 0, hsl(var(--brass)) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(90deg, hsl(var(--brass)) 0, hsl(var(--brass)) 1px, transparent 1px, transparent 64px)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brass">
            <Fingerprint className="h-6 w-6 text-ink" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Attendance Portal</p>
            <p className="text-sm text-ink-foreground/50">Employee Management System</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Every check-in, timestamped and accounted for
          </h2>
          <p className="text-ink-foreground/60 max-w-md">
            Track daily attendance, manage employees, generate reports, and monitor
            workforce activity — all from one centralized portal.
          </p>
          <div className="flex gap-8 font-mono-time">
            <div>
              <p className="text-2xl font-semibold text-brass">24/7</p>
              <p className="text-sm text-ink-foreground/50 font-sans">Access</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-brass">Live</p>
              <p className="text-sm text-ink-foreground/50 font-sans">Tracking</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-brass">RLS</p>
              <p className="text-sm text-ink-foreground/50 font-sans">Server-side</p>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-ink-foreground/40">© 2026 Attendance Portal. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-ink">
              <Fingerprint className="h-7 w-7 text-brass" />
            </div>
            <h1 className="font-display mt-3 text-xl font-semibold">Employee Attendance Portal</h1>
            <p className="text-sm text-muted-foreground">Secure Employee Attendance Management</p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="font-display text-2xl">Sign in</CardTitle>
              <CardDescription>Enter your credentials to access the portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => toast.info('Please contact your administrator to reset your password.')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Need an account? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
