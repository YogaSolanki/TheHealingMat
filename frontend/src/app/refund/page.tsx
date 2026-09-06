import type { Metadata } from "next";
import { RefundAndCancellationContent } from "@/components/refund-and-cancellation-content";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | The Healing Mat",
  description:
    "How membership cancellation and refunds work at The Healing Mat, including the 3-day cancellation window and refund processing.",
};

export default function RefundPage() {
  return (
    <main>
      <RefundAndCancellationContent />
    </main>
  );
}
