import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PubsInBangalore • AI-enriched Pub Directory",
  description:
    "Building a Supabase-backed, SEO-first directory for pubs in Bangalore with AI enrichment and programmatic locality pages.",
  openGraph: {
    title: "PubsInBangalore Technical Preview",
    description:
      "Follow the build of a locality-first, AI-enriched pub directory powered by Supabase and Next.js.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PubsInBangalore Technical Preview",
    description:
      "Supabase + Next.js powered directory with AI enrichment and badge-driven backlinks.",
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
        {children}
      </body>
    </html>
  );
}
