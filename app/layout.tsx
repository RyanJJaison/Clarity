import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif, Inter, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { PageTransition } from "@/components/motion/PageTransition";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

// Editorial accent — the whiteboard "lesson title" treatment, not a
// general-purpose heading font. Regular + Italic only (all this face ships).
const editorialFont = Instrument_Serif({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clarity — AI Adaptive Learning Companion",
  description: "Ingest anything, get a personalized tutor, adaptive quizzes, spaced-repetition review, and exam or language coaching.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} ${editorialFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <MotionProvider>
            <PageTransition>{children}</PageTransition>
            <Toaster />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
