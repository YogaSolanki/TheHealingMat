"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import {
  createRazorpayOrder,
  quoteMembership,
  verifyRazorpayPayment,
  type MembershipQuote,
  type PublicUser,
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import {
  clearCheckoutIntent,
  saveCheckoutIntent,
  type CheckoutStartMode,
} from "@/lib/checkout-intent";
import { sessionStore } from "@/lib/session-store";

const PAYMENT_INCOMPLETE =
  "Payment was not completed. Please try again to start or renew your membership.";

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function parsePlan(value: string | null): 3 | 6 | 12 {
  if (value === "3" || value === "6" || value === "12") return Number(value) as 3 | 6 | 12;
  return 12;
}

export function MembershipCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuth } = useAuthModal();
  const planMonths = parsePlan(searchParams.get("plan"));
  const startMode: CheckoutStartMode =
    searchParams.get("start") === "after-trial" ? "after_current" : "now";

  const [user, setUser] = useState<PublicUser | null>(null);
  const [quote, setQuote] = useState<MembershipQuote | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

  useEffect(() => {
    if (document.getElementById("razorpay-checkout-js")) return;
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      saveCheckoutIntent(planMonths, startMode);
      openAuth("login");
      setLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all([
      sessionStore.ensureUser(),
      quoteMembership(token, { planMonths }),
    ])
      .then(([me, nextQuote]) => {
        if (cancelled) return;
        setUser(me);
        setQuote(nextQuote);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load checkout.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [openAuth, planMonths, startMode]);

  const payableLabel = useMemo(() => {
    if (!quote) return "";
    return formatInr(quote.amountPaise);
  }, [quote]);

  async function applyCoupon() {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    try {
      const next = await quoteMembership(token, {
        planMonths,
        couponCode: couponInput.trim() || undefined,
      });
      setQuote(next);
      setAppliedCoupon(next.couponCode ?? "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "This coupon code is not valid.");
    }
  }

  async function onPay() {
    const token = getStoredToken();
    if (!token || !quote) {
      openAuth("login");
      return;
    }
    if (!window.Razorpay) {
      setError("Payment is still loading. Please try again in a moment.");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const order = await createRazorpayOrder(token, {
        planMonths,
        couponCode: appliedCoupon || couponInput.trim() || undefined,
        startMode,
      });

      if (order.skipCheckout) {
        clearCheckoutIntent();
        sessionStore.invalidateAccess();
        setSuccess(true);
        setPaying(false);
        return;
      }

      if (!order.order_id) {
        throw new Error("Unable to start payment.");
      }

      const checkout = new window.Razorpay({
        key: order.key_id || keyId,
        amount: order.amount,
        currency: order.currency,
        name: "The Healing Mat",
        description: quote.planName,
        order_id: order.order_id,
        prefill: {
          name: user?.fullName,
          email: user?.email ?? undefined,
          contact: user?.mobile ?? undefined,
        },
        theme: { color: "#1f6b3a" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setError(PAYMENT_INCOMPLETE);
          },
        },
        handler: async (response: RazorpaySuccess) => {
          try {
            await verifyRazorpayPayment(token, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCheckoutIntent();
            sessionStore.invalidateAccess();
            setSuccess(true);
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : PAYMENT_INCOMPLETE);
          } finally {
            setPaying(false);
          }
        },
      });

      checkout.on("payment.failed", () => {
        setPaying(false);
        setError(PAYMENT_INCOMPLETE);
      });

      checkout.open();
    } catch (err: unknown) {
      setPaying(false);
      setError(err instanceof Error ? err.message : PAYMENT_INCOMPLETE);
    }
  }

  if (success) {
    return (
      <CheckoutCard>
        <h1 className="font-serif text-[1.7rem] font-bold text-[#1f6b3a] sm:text-[1.9rem]">
          Payment successful
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
          Your membership is confirmed. You can view the details on My Membership.
        </p>
        <button
          type="button"
          className="btn-primary mt-6 inline-flex items-center justify-center rounded-[16px] bg-[#1f6b3a] px-5 py-3 text-[14px] font-bold text-white"
          onClick={() => router.replace("/dashboard/membership")}
        >
          Go to My Membership
        </button>
      </CheckoutCard>
    );
  }

  return (
    <CheckoutCard>
      <p className="text-[11px] font-bold tracking-[0.2em] text-black uppercase">Checkout</p>
      <h1 className="mt-2 font-serif text-[1.7rem] font-bold text-[#1f6b3a] sm:text-[1.9rem]">
        {quote?.planName ?? `${planMonths}-Month Membership`}
      </h1>
      <p className="mt-2 text-[14px] text-[#5f6f64] sm:text-[15px]">
        Complete payment to start or renew your membership. Access is granted only after a
        successful payment.
      </p>

      <dl className="mt-6 space-y-2 rounded-[16px] border border-[#e6ebe3] bg-[#F4F8F2] px-4 py-4 text-[14px]">
        <div className="flex justify-between gap-4">
          <dt className="text-[#5f6f64]">Plan price</dt>
          <dd className="font-semibold text-[#243028]">
            {quote ? formatInr(quote.listPricePaise) : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#5f6f64]">Discount</dt>
          <dd className="font-semibold text-[#1f6b3a]">
            {quote && quote.discountPaise > 0
              ? `− ${formatInr(quote.discountPaise)} (${quote.discountLabel})`
              : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-[#d7e5d9] pt-2">
          <dt className="font-bold text-[#243028]">Amount payable</dt>
          <dd className="font-bold text-[#1f6b3a]">{payableLabel || "—"}</dd>
        </div>
      </dl>

      <label className="mt-5 block text-[13px] font-semibold text-[#243028]">
        Coupon or referral code
        <span className="mt-1.5 flex gap-2">
          <input
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value)}
            className="min-w-0 flex-1 rounded-[12px] border border-[#d7e5d9] bg-white px-3 py-2.5 text-[14px] font-medium text-[#243028] outline-none focus:border-[#1f6b3a]"
            placeholder="Enter code"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => void applyCoupon()}
            disabled={loading}
            className="rounded-[12px] border border-[#1f6b3a] px-3 py-2.5 text-[13px] font-bold text-[#1f6b3a] disabled:opacity-60"
          >
            Apply
          </button>
        </span>
      </label>

      {error ? (
        <p className="mt-4 rounded-[12px] border border-[#f0d4d0] bg-[#fff6f5] px-3 py-2.5 text-[13px] text-[#9b3b32]">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={paying || loading || !quote}
        onClick={() => void onPay()}
        className="btn-primary mt-6 inline-flex w-full items-center justify-center rounded-[16px] bg-[#1f6b3a] px-5 py-3 text-[14px] font-bold text-white disabled:opacity-60"
      >
        {paying
          ? "Opening payment…"
          : quote && quote.amountPaise === 0
            ? "Confirm membership"
            : `Pay ${payableLabel || "—"}`}
      </button>

      <Link
        href="/membership"
        className="mt-4 inline-flex w-full items-center justify-center text-[13px] font-semibold text-[#5f6f64] underline-offset-2 hover:underline"
      >
        Back to plans
      </Link>
    </CheckoutCard>
  );
}

function CheckoutCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full bg-[#FBF9F5]">
      <div className="mx-auto w-full max-w-[560px] px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-[22px] border border-[#e6ebe3] bg-white px-5 py-7 shadow-[0_10px_32px_rgba(31,107,58,0.05)] sm:px-8 sm:py-8">
          {children}
        </section>
      </div>
    </main>
  );
}
