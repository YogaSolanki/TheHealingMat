import type { Metadata } from "next";
import { CorporateEnquirySection } from "@/components/corporate-enquiry-section";

export const metadata: Metadata = {
  title: "Corporate Enquiry | The Healing Mat",
  description:
    "Tell us about your organisation and explore how The Healing Mat can support your employees with simple, guided workplace wellness.",
};

export default function CorporateEnquiryPage() {
  return (
    <main className="min-h-full bg-[#FBF9F5]">
      <CorporateEnquirySection />
    </main>
  );
}
