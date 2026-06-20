import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/theme-provider";
import Navbar from "@/components/Navbar";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

import PasskeyModal from "@/components/PasskeyModal";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://passgrid.vercel.app"
  ),
  title: "SecureSyncZ — Secure Password & Card Vault",
  description:
    "Your premium digital vault for passwords and credit cards. Military-grade encryption, beautiful interface, always accessible.",
  keywords: [
    "password manager",
    "secure vault",
    "credential manager",
    "credit card wallet",
    "SecureSyncZ",
    "encryption",
    "pwa",
  ],
  authors: [{ name: "MD. SAIF ISLAM" }],
  openGraph: {
    title: "SecureSyncZ — Secure Password & Card Vault",
    description: "Your premium digital vault for passwords and credit cards.",
    url: "https://passgrid.vercel.app",
    siteName: "SecureSyncZ",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "SecureSyncZ Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SecureSyncZ — Secure Password & Card Vault",
    description: "Your premium digital vault for passwords and credit cards.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SecureSyncZ",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <Navbar />
              <main className="safe-bottom">{children}</main>
              <Toaster
                toastOptions={{
                  className: "glass !border-emerald-500/20 !text-foreground",
                }}
              />
              <PasskeyModal />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
