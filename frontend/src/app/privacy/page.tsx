import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/components/privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | The Healing Mat",
  description:
    "How The Healing Mat collects, uses and protects your personal information when you use our website, Free Trial or membership.",
};

export default function PrivacyPage() {
  return (
    <main>
      <PrivacyPolicyContent />
    </main>
  );
}
