'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && isAuthPage) {
        router.replace('/');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isAuthPage) {
        router.replace('/');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [pathname, isAuthPage, router]);

  return <>{children}</>;
}