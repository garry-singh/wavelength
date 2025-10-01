import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wavelength - The Telepathic Party Game",
  description:
    "Wavelength is a social guessing game where you try to read minds. You give a clue, and other players try to guess where it falls on a spectrum between two concepts.",
  keywords: [
    "wavelength",
    "party game",
    "social game",
    "guessing game",
    "telepathic",
    "online game",
  ],
  authors: [{ name: "Wavelength Game" }],
  openGraph: {
    title: "Wavelength - The Telepathic Party Game",
    description:
      "A social guessing game where you try to read minds. Play online with friends!",
    type: "website",
  },
};

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
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
