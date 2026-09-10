import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route protection for /admin and /employee is enforced client-side in
// components/app-shell.tsx (it reads the Supabase session from
// localStorage via useAuth() and redirects to /login if there isn't one).
// This middleware previously also tried to gate those routes by checking
// for a cookie named "sb-access-token", but nothing in this app ever sets
// that cookie (the browser client persists sessions to localStorage, not
// cookies), so the check always failed and created a redirect loop with
// the client-side check above. Left as a pass-through until/unless the
// app is migrated to @supabase/ssr for real server-side session cookies.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/login'],
};
