import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Brand headline face: Raleway ExtraBold (800) and Light (300), self-hosted (SIL OFL, see fonts/OFL.txt).
const raleway = localFont({
  src: [
    { path: "./fonts/raleway-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/raleway-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-raleway",
  display: "swap",
  fallback: ["Tahoma", "Verdana", "sans-serif"],
});

// Brand body face: Neue Kabel, served from an Adobe Fonts web project.
// Set NEXT_PUBLIC_ADOBE_FONTS_KIT_ID in Vercel; without it the brand's approved fallback (Trebuchet MS) is used.
const ADOBE_KIT = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID;

export const metadata: Metadata = {
  title: "Agenics Page Builder",
  description: "Build Agenics web pages from the approved module library, then export a content brief for Squarespace.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={raleway.variable}>
      <head>{ADOBE_KIT ? <link rel="stylesheet" href={`https://use.typekit.net/${ADOBE_KIT}.css`} /> : null}</head>
      <body>{children}</body>
    </html>
  );
}
