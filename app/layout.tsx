import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Paper H2H Lab",
    template: "%s | Paper H2H Lab"
  },
  description:
    "Paper H2H Lab - a paper-style planning tool for FPL head-to-head leagues, focusing on doubles, blanks, and rival risk."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col bg-paper">
          <header className="border-b-2 border-border bg-paper-dark">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
              <Link
                href="/"
                className="text-lg font-semibold text-primary tracking-wide"
              >
                Paper H2H Lab
              </Link>
              <nav className="flex gap-4 text-sm text-ink-lighter font-medium">
                <Link href="/planner" className="hover:text-ink underline-offset-4 hover:underline">
                  Planner
                </Link>
                <Link href="/setup" className="hover:text-ink underline-offset-4 hover:underline">
                  Setup
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
