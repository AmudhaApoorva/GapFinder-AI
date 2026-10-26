import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GapFinder AI — Diagnose What You Don't Know",
  description:
    "Grounded syllabus-to-gap diagnosis. Upload study notes & past papers, take precision diagnostic quizzes, and generate adaptive revision plans.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} scroll-smooth`}>
      <body className="font-sans antialiased text-ink bg-paper selection:bg-terracotta/20 selection:text-terracotta">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

