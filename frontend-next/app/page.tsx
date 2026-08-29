import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhySection } from "@/components/landing/WhySection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { PricingSection } from "@/components/landing/PricingSection";

export const metadata: Metadata = {
  title: "VoiceBridge — Private Text-to-Speech & Speech-to-Text",
  description:
    "Production-grade text-to-speech and speech-to-text web application deployed directly into your own AWS account. Complete data privacy and zero SaaS markup.",
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <WhySection />
      <UseCasesSection />
      <PricingSection />
    </main>
  );
}
