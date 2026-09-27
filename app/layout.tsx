import type { Metadata } from "next";
import { archivo, plexSans, plexMono } from "@/lib/fonts";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "AnchorShip NL — Marine diesel engines & spare parts",
    template: "%s — AnchorShip NL",
  },
  description:
    "B2B marketplace for complete marine diesel engines and spare parts — Wärtsilä, MAN, MaK, Deutz, Caterpillar.",
  openGraph: { type: "website", siteName: "AnchorShip NL", locale: "en_GB" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <head>
        <noscript>
          <style>{"[data-fade-in]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col bg-surface-0 font-body text-hull antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
