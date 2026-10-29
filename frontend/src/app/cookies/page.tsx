import type { Metadata } from "next";
import { CookiePolicyContent } from "@/components/cookie-policy-content";

export const metadata: Metadata = {
  title: "Cookie Policy | The Healing Mat",
  description:
    "How The Healing Mat uses cookies and similar technologies, including essential login storage, Razorpay payments and embedded YouTube videos.",
};

export default function CookiesPage() {
  return (
    <main>
      <CookiePolicyContent />
    </main>
  );
}
