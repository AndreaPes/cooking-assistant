import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cooking Assistant",
  description: "Your AI-powered cooking companion.",
};

/**
 * Viewport configuration optimized for AR and Mobile.
 * - Disables user scaling to prevent accidental zooming while interacting with 3D elements.
 * - Sets the theme color to match the application background.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111827",
};

/**
 * Root Layout Component.
 * Wraps the entire application with global styles and font configurations.
 *
 * @param children - The page content to be rendered.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
