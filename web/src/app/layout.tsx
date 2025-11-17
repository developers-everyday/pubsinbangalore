import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCanonicalUrl } from "@/lib/utils/canonical";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { AgeVerificationModal } from "@/components/age-gate/age-verification-modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Best Pubs in Bangalore | PubsInBangalore - Events, Offers & Bookings",
  description:
    "Discover the best pubs in Bangalore. Find venues by locality, check live updates, book for corporate events. Follow us for exclusive offers and nightlife updates.",
  keywords: ["pubs in bangalore", "best bars bangalore", "bangalore nightlife", "pubs near me", "bangalore pubs", "nightlife bangalore", "pub booking bangalore"],
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
  openGraph: {
    title: "Best Pubs in Bangalore | PubsInBangalore",
    description:
      "Discover the best pubs in Bangalore. Find venues by locality, check live updates, and book for corporate events.",
    type: "website",
    url: "https://pubsinbangalore.com",
    locale: "en_IN",
    siteName: "PubsInBangalore",
    images: [
      {
        url: "https://pubsinbangalore.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "PubsInBangalore - Discover the best pubs in Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Pubs in Bangalore | PubsInBangalore",
    description: "Discover the best pubs in Bangalore. Find venues by locality, check live updates, and book for corporate events.",
    images: ["https://pubsinbangalore.com/og-image.png"],
    creator: "@pubsinbangalore",
    site: "@pubsinbangalore",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS prefetch for additional performance */}
        <link rel="dns-prefetch" href="https://maps.google.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#059669" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PubsInBangalore" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleAnalytics />
        <AgeVerificationModal />
        {children}
      </body>
    </html>
  );
}
