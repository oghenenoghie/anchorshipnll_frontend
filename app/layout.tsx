import type { Metadata } from "next";
import { archivo, plexSans, plexMono } from "@/lib/fonts";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AnchorShip NL — Marine diesel engines & spare parts",
    template: "%s — AnchorShip NL",
  },
  description:
    "B2B marketplace for complete marine diesel engines and spare parts — Wärtsilä, MAN, MaK, Deutz, Caterpillar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-surface-0 font-body text-hull antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
