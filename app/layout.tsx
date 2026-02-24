import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VVIP Hospitality | Premium Stays & Bakery Services",
  description: "Providing premium hospitality experiences and professional cloud kitchen services in Noida and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} scroll-smooth`}>
      <body className="font-sans antialiased bg-white text-brand-black">
        <ConditionalNavbar />
        <MainLayoutWrapper>
          {children}
        </MainLayoutWrapper>
        <ConditionalFooter />
        <WhatsAppButton />
      </body>
    </html>
  );
}
