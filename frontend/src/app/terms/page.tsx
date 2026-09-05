import type { Metadata } from "next";
import { TermsAndConditionsContent } from "@/components/terms-and-conditions-content";

export const metadata: Metadata = {
  title: "Terms & Conditions | The Healing Mat",
  description:
    "Terms and conditions governing your use of The Healing Mat website, account, Free Trial and paid membership.",
};

export default function TermsPage() {
  return (
    <main>
      <TermsAndConditionsContent />
    </main>
  );
}
