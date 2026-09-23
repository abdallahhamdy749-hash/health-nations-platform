import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import LanguageProvider from "@/components/LanguageProvider";

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
  title: {
    default: "Health Nations Medical",
    template: "%s | Health Nations Medical",
  },

  description:
    "Global medical marketplace connecting healthcare buyers, medical suppliers, equipment, consumables and spare parts worldwide.",

  keywords: [
    "Health Nations Medical",
    "Medical Marketplace",
    "Medical Equipment",
    "Medical Supplies",
    "Medical Spare Parts",
    "Healthcare Suppliers",
    "Medical Equipment Suppliers",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}