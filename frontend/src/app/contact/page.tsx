import type { Metadata } from "next";
import { ContactSection } from "@/components/contact-section";

export const metadata: Metadata = {
  title: "Contact Us | The Healing Mat",
  description:
    "We’re here to help. Call, WhatsApp, email, or send us a message — get in touch with The Healing Mat in whichever way is easiest for you.",
};

export default function ContactPage() {
  return (
    <main>
      <ContactSection />
    </main>
  );
}
