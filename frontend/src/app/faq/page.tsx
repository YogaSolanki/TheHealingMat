import type { Metadata } from "next";
import { FaqPageContent } from "@/components/faq-page-content";

export const metadata: Metadata = {
  title: "FAQs | The Healing Mat",
  description:
    "Simple answers and clear guidance. Everything you need to know before you begin your journey with The Healing Mat.",
};

export default function FaqPage() {
  return (
    <main>
      <FaqPageContent />
    </main>
  );
}
