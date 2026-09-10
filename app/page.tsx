'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const supabase = getSupabaseClient();

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
      router.push('/login');
    })();
  }, [router, supabase]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brass" />
    </div>
  );
}
