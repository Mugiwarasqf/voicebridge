import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhySection } from "@/components/landing/WhySection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { PricingSection } from "@/components/landing/PricingSection";

export const metadata: Metadata = {
  title: "VoiceBridge Text & Speech on Your AWS",
  description:
    "Convert text to natural-sounding speech and transcribe audio — powered by Amazon Polly & Transcribe, deployed in your own AWS account. Pay only for what you use.",
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
