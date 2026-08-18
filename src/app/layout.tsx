import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXUS - Ecosystem Intelligence Platform",
  description: "AI-Powered Ecosystem Intelligence That Automates 98% of Grant & Procurement Applications. From Gazette to Grant in 47 Minutes™.",
  keywords: [
    "NEXUS", 
    "Grant Automation", 
    "Procurement Intelligence", 
    "Ecosystem Intelligence",
    "AI-Powered Grants",
    "Gazette Monitor",
    "Funding Platform"
  ],
  authors: [{ name: "NEXUS Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "NEXUS - Ecosystem Intelligence Platform",
    description: "From Gazette to Grant in 47 Minutes™. AI-Powered Ecosystem Intelligence.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXUS - Ecosystem Intelligence Platform",
    description: "From Gazette to Grant in 47 Minutes™",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
