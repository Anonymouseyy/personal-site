import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { site } from "@/lib/content";
import "./globals.css";

const font = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: site.meta.title,
  description: site.meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const t = site.theme ?? {};
  const vars = {
    ...(t.accent && { "--accent": t.accent }),
    ...(t.bg && { "--bg": t.bg }),
    ...(t.ink && { "--ink": t.ink }),
  } as React.CSSProperties;
  return (
    <html lang="en">
      <body className={font.className} style={vars}>{children}</body>
    </html>
  );
}
