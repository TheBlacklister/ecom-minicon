import Header from './components/header'
import Footer from './components/footer'
import MuiTheme from './components/ThemeProvider'
import AuthProvider from './components/AuthProvider'
import { CountProvider } from './components/CountProvider'
import { Box } from '@mui/material';
import Script from 'next/script';
import ClientWrapper from './components/ClientWrapper';

export const metadata = {
  title: "Aesthetic T-Shirts for Men India | Oversized, Puff Print & Supima — Minicon",
  description:
    "Shop aesthetic, oversized & puff print t-shirts for men in India. Premium Supima cotton. Free shipping. Prices from ₹599. COD available.",
  alternates: {
    canonical: "https://minicon.in/",
  },
  openGraph: {
    title: "Aesthetic T-Shirts for Men India | Minicon",
    description:
      "Shop aesthetic, oversized & puff print t-shirts for men. Supima cotton. COD available.",
    url: "https://minicon.in/",
    images: [
      {
        url: "https://minicon.in/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-TDBBLTF6');
          `}
        </Script>

        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

        <link rel="icon" type="image/png" href="/images/black.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" href="/images/white.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/images/favicon.ico" />

        {/* ✅ Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Minicon",
              url: "https://minicon.in/",
              logo: "https://minicon.in/logo.svg",
              address: {
                "@type": "PostalAddress",
                streetAddress: "1/H/9 Rashmoni Bazar Road",
                addressLocality: "Kolkata",
                addressRegion: "West Bengal",
                postalCode: "700010",
                addressCountry: "IN",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+91-87770-73645",
                contactType: "customer service",
              },
            }),
          }}
        />

        {/* ✅ Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Minicon",
              url: "https://minicon.in/",
            }),
          }}
        />
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
        {/* GTM noscript */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TDBBLTF6"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* ✅ CLIENT LOGIC WRAPPED */}
        <ClientWrapper>
          <AuthProvider>
            <CountProvider>
              <Header />

              <main style={{ flex: 1 }}>
                <MuiTheme>
                  <Box
                    sx={{
                      margin: { xs: '8vh 0 6vh 0', sm: '8vh 0 8vh 0', md: '8vh 0 8vh 0' },
                    }}
                  >
                    {children}
                  </Box>
                </MuiTheme>
              </main>

              <Footer />
            </CountProvider>
          </AuthProvider>
        </ClientWrapper>

        {/* Razorpay */}
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}