import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Playfair_Display } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stellarin | Check In",
  description: "Quick check-in to start playing",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#262d25",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col bg-gradient-animated" suppressHydrationWarning>
        <main className="flex-1 flex flex-col items-center justify-center px-5 py-8">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
