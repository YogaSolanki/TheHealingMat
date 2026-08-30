import { ApproachSection } from "@/components/approach-section";
import { CtaBannerSection } from "@/components/cta-banner-section";
import { FaqSection } from "@/components/faq-section";
import { FoundersSection } from "@/components/founders-section";
import { HeroSection } from "@/components/hero-section";
import { TestimonialsSection } from "@/components/testimonials-section";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ApproachSection />
      <FoundersSection />
      <TestimonialsSection />
      <CtaBannerSection />
      <FaqSection />
    </main>
  );
}
