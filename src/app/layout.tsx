import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Journal of Contemporary Eastern Asia",
    template: "%s | JCEA",
  },
  description:
    "The Journal of Contemporary Eastern Asia (JCEA) is a peer-reviewed, open-access journal on East and Southeast Asia, convergence and future network studies. eISSN 2383-9449.",
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "Journal of Contemporary Eastern Asia",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceSerif.variable} antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div
          role="note"
          aria-label="Site announcement"
          className="bg-accent-500 px-4 py-1.5 text-center text-xs font-medium text-primary-950 sm:py-2 sm:text-sm"
        >
          <strong>You are viewing a preview of JCEA&rsquo;s new website</strong> at a
          temporary test address. The journal&rsquo;s official website is{" "}
          <a href="https://jceasia.org/" className="underline hover:text-primary-800">
            jceasia.org
          </a>
          , which still shows the current site; in 2027 jceasia.org will switch to this new design.
        </div>
        {children}
      </body>
    </html>
  );
}
