import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FINDER",
    template: "%s | FINDER",
  },
  description: "Comunidade de jogadores, mentoria e oportunidades de time no Free Fire.",
  keywords: [
    "FINDER",
    "Free Fire",
    "time",
    "jogadores",
    "mentoria",
    "comunidade",
    "LAFF",
    "ZK Esports",
  ],
  metadataBase: new URL("https://laff-finder.com"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
