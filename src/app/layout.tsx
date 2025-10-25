"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const hideHeader = pathname === "/login" || pathname === "/signup";

  return (
    <html lang="en">
      <body
        // suppress hydration warnings at the top-level to reduce noisy console messages in development
        {...({ suppressHydrationWarning: true } as any)}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {!hideHeader && <Header />}
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
