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
    default: "VoiceBridge — Text & Speech on Your AWS",
    template: "%s | VoiceBridge",
  },
  description:
    "Convert text to natural-sounding speech and speech to text using Amazon Polly and Transcribe — deployed in your own AWS account, pay only for what you use.",
  openGraph: {
    title: "VoiceBridge — Text & Speech on Your AWS",
    description:
      "Self-hosted, serverless text-to-speech and speech-to-text. Own your data, pay per use.",
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
