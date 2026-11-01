import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import LanguageProvider from "@/components/LanguageProvider";

import "./globals.css";
import { ADSENSE_ID, SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Health Nations",
  openGraph: { type: "website", siteName: "Health Nations", title: "Health Nations Medical", description: "Medical equipment, supplies, spare parts and healthcare services." },
  twitter: { card: "summary", title: "Health Nations Medical" },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
  other: ADSENSE_ID ? { "google-adsense-account": ADSENSE_ID } : {},
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Health Nations Medical", url: SITE_URL }) }} />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
