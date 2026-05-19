import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import ConditionalWhatsAppButton from "@/components/layout/ConditionalWhatsAppButton";

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
    <html
      lang="en"
      className="scroll-smooth"
      style={
        {
          "--font-inter": "ui-sans-serif, system-ui, sans-serif",
          "--font-outfit": "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
        } as CSSProperties
      }
    >
      <body className="font-sans antialiased bg-white text-brand-black">
        <ConditionalNavbar />
        <MainLayoutWrapper>
          {children}
        </MainLayoutWrapper>
        <ConditionalFooter />
        <ConditionalWhatsAppButton />
      </body>
    </html>
  );
}
