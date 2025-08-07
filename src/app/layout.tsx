"use client";
import Header from './components/header'
import Footer from './components/footer'
import MuiTheme from './components/ThemeProvider'
import AuthProvider from './components/AuthProvider'
import { CountProvider } from './components/CountProvider'
import { Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';


export default function RootLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link
          rel="icon"
          type="image/png"
          href="/images/black.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/png"
          href="/images/white.png"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="icon" href="/images/favicon.ico" />
      </head>
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          margin: 0,
          overflowX: 'hidden',
        }}
      >
        <AuthProvider>
          <CountProvider>
            {!isAuthPage && <Header />}
            <main style={{ flex: 1 }}>
              <MuiTheme>
                <Box sx={{
                  margin: { xs: '8vh 0 6vh 0', sm: '8vh 0 8vh 0',md: '8vh 0 8vh 0'},
                }}>
                  {children}
                </Box>
              </MuiTheme>
            </main>
            {!isAuthPage && <Footer />}
          </CountProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
