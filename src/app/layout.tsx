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
    default: "Journal of Contemporary Eastern Asia (Test Site)",
    template: "%s | JCEA (Test Site)",
  },
  description:
    "Test environment — not the official JCEA website (see jceasia.org). Demonstration of an editorial system for the open-access journal on East and Southeast Asia. ISSN 2383-9449.",
  robots: { index: false, follow: false },
  openGraph: {
    siteName: "Journal of Contemporary Eastern Asia (Test Site)",
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
          aria-label="Test site notice"
          className="bg-accent-500 px-4 py-2 text-center text-sm font-medium text-primary-950"
        >
          ⚠️ Test environment — this is a technology demonstration and{" "}
          <strong>not the official website of the Journal of Contemporary Eastern Asia</strong>.
          Published-article listings mirror the real journal and link to
          KoreaScience; editorial-workflow data is simulated. The official site is{" "}
          <a
            href="https://jceasia.org/"
            className="underline hover:text-primary-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            jceasia.org
          </a>
          .
        </div>
        {children}
      </body>
    </html>
  );
}
