import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/auth/session-provider";
import { UserMenu } from "@/components/auth/user-menu";

export const metadata: Metadata = {
  title: "Indian Tax Planner — Old vs New Regime",
  description: "AI-powered tax regime comparison for Indian salaried employees. Compare Old vs New regime, get deduction suggestions, and make the right choice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-14 items-center">
              <a href="/" className="flex items-center gap-2 font-semibold">
                <span className="text-primary text-xl">₹</span>
                <span>Tax Planner</span>
              </a>
              <span className="ml-3 text-xs text-muted-foreground hidden sm:inline">
                Old vs New Regime — FY 2023-24 to 2026-27
              </span>
              <div className="ml-auto">
                <UserMenu />
              </div>
            </div>
          </header>
          <main className="container py-6 md:py-10">
            {children}
          </main>
          <footer className="border-t mt-16">
            <div className="container py-4 text-xs text-muted-foreground text-center">
              For informational purposes only. Always verify with a qualified CA.
              Tax laws may change — check official sources.
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
