import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "VoiceBridge — Private Text-to-Speech & Speech-to-Text",
    template: "%s | VoiceBridge",
  },
  description:
    "Production-grade text-to-speech and speech-to-text web application deployed directly into your own AWS account. Complete data privacy and zero SaaS markup.",
  openGraph: {
    title: "VoiceBridge — Private Text-to-Speech & Speech-to-Text",
    description:
      "Production-grade text-to-speech and speech-to-text web application deployed directly into your own AWS account. Complete data privacy and zero SaaS markup.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Runtime config injected by Terraform at deploy time */}
        <script src="/config.js" />
      </head>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
