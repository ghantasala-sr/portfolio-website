import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { ScrollProvider } from "@/lib/scroll/ScrollProvider";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { Cursor } from "@/components/chrome/Cursor";
import { BootSequence } from "@/components/chrome/BootSequence";
import { TrackView } from "@/components/chrome/TrackView";
import { profile } from "@/content/profile";

const display = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

const description =
  "Software engineer building event-driven multi-agent systems, warehouse data pipelines, and the evaluation harnesses that make non-deterministic systems measurable.";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio-gsr.vercel.app"),
  title: {
    default: `${profile.name}. Software Engineer`,
    template: `%s, ${profile.shortName} Ghantasala`,
  },
  description,
  openGraph: {
    title: `${profile.name}. Software Engineer`,
    description,
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090b" },
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <ThemeProvider>
          <ScrollProvider>
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <div className="overlay-grid" aria-hidden="true" />
            <div className="overlay-grain" aria-hidden="true" />
            <BootSequence />
            <TrackView />
            <Cursor />
            <SiteHeader />
            <main id="main" className="relative z-10">
              {children}
            </main>
            <SiteFooter />
          </ScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
