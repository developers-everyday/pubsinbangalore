import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCanonicalUrl } from "@/lib/utils/canonical";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { AgeVerificationModal } from "@/components/age-gate/age-verification-modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Pubs in Bangalore | PubsInBangalore",
    description: "Discover the best pubs in Bangalore. Find venues by locality, check live updates, and book for corporate events.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleAnalytics />
        <AgeVerificationModal />
        {children}
      </body>
    </html>
  );
}
