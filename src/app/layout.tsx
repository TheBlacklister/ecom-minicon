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
import Script from 'next/script';


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
      { /* <!-- Google Tag Manager --> */}
      <Script id="gtm-script" strategy="afterInteractive">
        {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-TDBBLTF6');
        `}
        </Script>
        {/* <!-- End Google Tag Manager --> */}
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
        {/* <!-- Google Tag Manager (noscript) --> */}
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TDBBLTF6"
            height="0" width="0" style= {{display: "none", visibility: "hidden" }}>
          </iframe>
        </noscript>
          {/* <!-- End Google Tag Manager (noscript) --> */}
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

        {/* Razorpay Script */}
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
