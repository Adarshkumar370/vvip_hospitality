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
  title: "VVIP Hospitality - Premium Budget Stays & Professional Bakery Solutions",
  description: "Redefining the standards of comfort and taste. From premium budget stays at Olive Stayz to professional B2B bakery solutions. Excellence Reimagined.",
  keywords: ["VVIP Hospitality", "Olive Stayz", "VVIP Bakery", "budget hotel", "corporate stays", "B2B bakery", "Noida hotels"],
  authors: [{ name: "VVIP Hospitality Group" }],
  metadataBase: new URL('https://vvip-hospitality.vercel.app'),
  openGraph: {
    title: "VVIP Hospitality - Excellence Reimagined",
    description: "Premium budget stays and professional bakery solutions. Redefining standards of comfort and taste.",
    url: 'https://vvip-hospitality.vercel.app',
    siteName: 'VVIP Hospitality',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "VVIP Hospitality - Excellence Reimagined",
    description: "Premium budget stays and professional bakery solutions. Redefining standards of comfort and taste.",
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import SocialFloatingButton from "@/components/SocialFloatingButton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SocialFloatingButton />
      </body>
    </html>
  );
}
