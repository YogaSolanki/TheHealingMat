"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import {
  createRazorpayOrder,
  downloadMembershipInvoice,
  getMyCoupons,
  quoteMembership,
  verifyRazorpayPayment,
  type MemberCoupon,
  type MembershipQuote,
  type PublicMembershipPlan,
  type PublicUser,
} from "@/lib/api";
import {
  closeCheckoutModal,
  openPaymentRetryModal,
} from "@/components/checkout-modal-provider";
import { ButtonLoader } from "@/components/site-loader";
import { getStoredToken } from "@/lib/auth-storage";
import {
  clearCheckoutIntent,
  markCheckoutResumeAfterAuth,
  saveCheckoutIntent,
  type CheckoutStartMode,
} from "@/lib/checkout-intent";
import {
  BASE_MEMBERSHIP_PLANS,
  membershipPlansStore,
} from "@/lib/membership-plans-store";
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
  on: (
    event: "payment.failed",
    handler: (response: { error?: { description?: string } }) => void,
  ) => void;
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

function resolvePlan(planMonths: number): PublicMembershipPlan {
  return (
    membershipPlansStore.getPlanByMonths(planMonths) ??
    BASE_MEMBERSHIP_PLANS.find((plan) => plan.months === planMonths) ??
    BASE_MEMBERSHIP_PLANS[0]
  );
}

/** Build checkout totals from the already-loaded membership plan catalog. */
function quoteFromPlan(plan: PublicMembershipPlan): MembershipQuote {
  const offerPricePaise = plan.offerPricePaise;
  const listPricePaise = offerPricePaise ?? plan.listPricePaise;
  return {
    planMonths: plan.months,
    planName: plan.name,
    originalPricePaise: plan.listPricePaise,
    listPricePaise,
    discountPaise: 0,
    amountPaise: listPricePaise,
    discountLabel: "—",
    couponCode: null,
    offer: plan.offer,
    currency: "INR",
  };
}

type MembershipCheckoutPanelProps = {
  planMonths: number;
  startMode?: CheckoutStartMode;
  onClose?: () => void;
};

export function MembershipCheckoutPanel({
  planMonths,
  startMode = "now",
  onClose,
}: MembershipCheckoutPanelProps) {
  const router = useRouter();
  const { openAuth } = useAuthModal();

  const [user, setUser] = useState<PublicUser | null>(null);
  const [quote, setQuote] = useState<MembershipQuote>(() =>
    quoteFromPlan(resolvePlan(planMonths)),
  );
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [assignedCoupons, setAssignedCoupons] = useState<MemberCoupon[]>([]);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paidMembershipId, setPaidMembershipId] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

  useEffect(() => {
    setQuote(quoteFromPlan(resolvePlan(planMonths)));
    setCouponInput("");
    setAppliedCoupon("");
    setAssignedCoupons([]);
    setError(null);
    setSuccess(false);
    setPaidMembershipId(null);
  }, [planMonths]);

  useEffect(() => {
    if (document.getElementById("razorpay-checkout-js")) return;
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  /** Soft sync: user + referral/coupon discounts only — UI already has plan/offer prices. */
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      saveCheckoutIntent(planMonths, startMode);
      markCheckoutResumeAfterAuth();
      openAuth("login");
      return;
    }

    let cancelled = false;

    Promise.all([
      sessionStore.ensureUser(),
      getMyCoupons(token).catch(() => ({ coupons: [] })),
    ])
      .then(async ([me, mine]) => {
        if (cancelled) return;
        setUser(me);

        const assigned = mine.coupons ?? [];
        setAssignedCoupons(assigned);

        const assignedCode = assigned[0]?.code?.trim() ?? "";
        if (assignedCode) {
          setCouponInput(assignedCode);
          const nextQuote = await quoteMembership(token, {
            planMonths,
            couponCode: assignedCode,
          });
          if (cancelled) return;
          setQuote(nextQuote);
          setAppliedCoupon(nextQuote.couponCode ?? assignedCode);
          return;
        }

        // Referral / server-side discounts without blocking first paint
        const nextQuote = await quoteMembership(token, { planMonths });
        if (cancelled) return;
        setQuote(nextQuote);
      })
      .catch(() => {
        // Keep catalog quote on screen if soft sync fails.
      });

    return () => {
      cancelled = true;
    };
  }, [openAuth, planMonths, startMode]);

  const payableLabel = useMemo(() => formatInr(quote.amountPaise), [quote]);

  async function applyCoupon(codeOverride?: string) {
    const token = getStoredToken();
    if (!token) return;
    const code = (codeOverride ?? couponInput).trim();
    if (codeOverride) setCouponInput(code);
    setError(null);
    try {
      const next = await quoteMembership(token, {
        planMonths,
        couponCode: code || undefined,
      });
      setQuote(next);
      setAppliedCoupon(next.couponCode ?? "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "This coupon code is not valid.");
    }
  }

  async function refreshMemberDetails() {
    sessionStore.invalidateAccess();
    await Promise.all([
      sessionStore.ensureAccess({ force: true }),
      sessionStore.ensureUser({ force: true }).catch(() => null),
    ]);
  }

  function failPayment(message?: string) {
    setPaying(false);
    setVerifying(false);
    openPaymentRetryModal({
      planMonths,
      startMode,
      message: message || PAYMENT_INCOMPLETE,
    });
  }

  async function confirmPaidMembership(membershipId?: string | null) {
    setVerifying(true);
    setPaying(false);
    if (membershipId) setPaidMembershipId(membershipId);
    clearCheckoutIntent();
    await refreshMemberDetails();
    setVerifying(false);
    setSuccess(true);
  }

  async function onDownloadInvoice() {
    const token = getStoredToken();
    if (!token || !paidMembershipId || downloadingInvoice) return;
    setDownloadingInvoice(true);
    try {
      await downloadMembershipInvoice(token, paidMembershipId);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to download invoice.",
      );
    } finally {
      setDownloadingInvoice(false);
    }
  }

  async function onPay() {
    const token = getStoredToken();
    if (!token) {
      openAuth("login");
      return;
    }
    if (!window.Razorpay) {
      failPayment("Payment is still loading. Please try again in a moment.");
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
        await confirmPaidMembership(order.membership?.id);
        return;
      }

      if (!order.order_id) {
        throw new Error("Unable to start payment.");
      }

      const razorpayOrderId = String(order.order_id);

      const checkout = new window.Razorpay({
        key: order.key_id || keyId,
        amount: order.amount,
        currency: order.currency,
        name: "The Healing Mat",
        description: quote.planName,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.fullName,
          email: user?.email ?? undefined,
          contact: user?.mobile ?? undefined,
        },
        theme: { color: "#1f6b3a" },
        modal: {
          ondismiss: () => {
            failPayment();
          },
        },
        handler: async (response: RazorpaySuccess) => {
          try {
            setVerifying(true);
            setPaying(false);
            const paymentId = String(response.razorpay_payment_id || "").trim();
            const signature = String(response.razorpay_signature || "").trim();
            // Verify against the order we created on the server.
            const orderId = razorpayOrderId;
            if (!paymentId || !signature || !orderId) {
              throw new Error(
                "Payment confirmation was incomplete. Please retry payment.",
              );
            }
            const verified = await verifyRazorpayPayment(token, {
              razorpay_order_id: orderId,
              razorpay_payment_id: paymentId,
              razorpay_signature: signature,
            });
            await confirmPaidMembership(verified.membership?.id);
          } catch (err: unknown) {
            failPayment(
              err instanceof Error ? err.message : PAYMENT_INCOMPLETE,
            );
          }
        },
      });

      checkout.on("payment.failed", () => {
        failPayment();
      });

      checkout.open();
    } catch (err: unknown) {
      failPayment(err instanceof Error ? err.message : PAYMENT_INCOMPLETE);
    }
  }

  if (success) {
    return (
      <CheckoutCard className="payment-success-card overflow-hidden text-center">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <span
            aria-hidden="true"
            className="payment-success-ring absolute inset-0 rounded-full bg-[#1f6b3a]/20"
          />
          <span className="payment-success-check relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#1f6b3a] text-white shadow-[0_12px_28px_rgba(31,107,58,0.28)]">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
              <path
                d="M6.5 12.5 10.2 16 17.5 8.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <p className="mt-5 text-[11px] font-bold tracking-[0.2em] text-black uppercase">
          Confirmed
        </p>
        <h1 className="mt-2 font-serif text-[1.7rem] font-bold text-[#1f6b3a] sm:text-[1.9rem]">
          Payment successful
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
          Your membership is active. Details have been updated on your account.
        </p>
        {error ? (
          <p className="mt-3 text-[13px] font-medium text-[#b42318]">{error}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2.5">
          {paidMembershipId ? (
            <button
              type="button"
              disabled={downloadingInvoice}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#1f6b3a] bg-white px-5 py-3 text-[14px] font-bold text-[#1f6b3a] transition hover:bg-[#f4f8f2] disabled:opacity-60"
              onClick={() => void onDownloadInvoice()}
            >
              {downloadingInvoice ? "Downloading…" : "Download invoice"}
            </button>
          ) : null}
          <button
            type="button"
            className="btn-primary inline-flex w-full items-center justify-center rounded-[16px] bg-[#1f6b3a] px-5 py-3 text-[14px] font-bold text-white"
            onClick={() => {
              closeCheckoutModal();
              onClose?.();
              router.replace("/dashboard/membership");
            }}
          >
            Go to My Membership
          </button>
        </div>
      </CheckoutCard>
    );
  }

  return (
    <CheckoutCard className="relative overflow-hidden">
      {verifying ? (
        <div
          className="payment-verify-overlay absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[22px] bg-white/78 backdrop-blur-[6px]"
          aria-busy="true"
          aria-live="polite"
        >
          <ButtonLoader tone="brand" size="md" label="Confirming payment" />
          <p className="text-[13px] font-semibold text-[#1f6b3a]">
            Confirming payment…
          </p>
          <p className="px-6 text-center text-[12px] text-[#5f6f64]">
            Checking status with our server and updating your membership.
          </p>
        </div>
      ) : null}

      <p className="text-[11px] font-bold tracking-[0.2em] text-black uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-serif text-[1.7rem] font-bold text-[#1f6b3a] sm:text-[1.9rem]">
        {quote.planName}
      </h1>
      <p className="mt-2 text-[14px] text-[#5f6f64] sm:text-[15px]">
        Complete payment to start or renew your membership. Access is granted only
        after a successful payment.
      </p>

      <dl className="mt-6 space-y-2 rounded-[16px] border border-[#e6ebe3] bg-[#F4F8F2] px-4 py-4 text-[14px]">
        {quote.offer ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[#5f6f64]">Offer</dt>
            <dd className="font-semibold text-[#c45c16]">{quote.offer.badge}</dd>
          </div>
        ) : null}
        {quote.originalPricePaise > quote.listPricePaise ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[#5f6f64]">Regular price</dt>
            <dd className="font-semibold text-[#8a978c] line-through">
              {formatInr(quote.originalPricePaise)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-[#5f6f64]">
            {quote.offer ? "Offer price" : "Plan price"}
          </dt>
          <dd className="font-semibold text-[#243028]">
            {formatInr(quote.listPricePaise)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#5f6f64]">Discount</dt>
          <dd className="font-semibold text-[#1f6b3a]">
            {quote.discountPaise > 0
              ? `− ${formatInr(quote.discountPaise)} (${quote.discountLabel})`
              : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-[#d7e5d9] pt-2">
          <dt className="font-bold text-[#243028]">Amount payable</dt>
          <dd className="font-bold text-[#1f6b3a]">{payableLabel}</dd>
        </div>
      </dl>

      <label className="mt-5 block text-[13px] font-semibold text-[#243028]">
        Coupon or referral code
        {assignedCoupons.length > 0 ? (
          <div className="mt-2 rounded-[14px] border border-[#d7e5d9] bg-[#f4f8f2] px-3.5 py-3">
            <p className="text-[12px] font-bold text-[#1f6b3a]">
              Your coupon{assignedCoupons.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-2 space-y-1.5">
              {assignedCoupons.map((coupon) => (
                <li
                  key={coupon.id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="font-mono text-[13px] font-bold tracking-wide text-[#243028]">
                      {coupon.code}
                    </span>
                    <span className="ml-2 text-[12px] font-medium text-[#5f6f64]">
                      {coupon.discountLabel}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={paying || verifying}
                    onClick={() => void applyCoupon(coupon.code)}
                    className="rounded-full border border-[#1f6b3a] px-2.5 py-1 text-[11px] font-bold text-[#1f6b3a] disabled:opacity-60"
                  >
                    {appliedCoupon === coupon.code ? "Applied" : "Use"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <span className="mt-1.5 flex gap-2">
          <input
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value)}
            disabled={paying || verifying}
            className="min-w-0 flex-1 rounded-[12px] border border-[#d7e5d9] bg-white px-3 py-2.5 text-[14px] font-medium text-[#243028] outline-none focus:border-[#1f6b3a] disabled:opacity-60"
            placeholder="Enter code"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => void applyCoupon()}
            disabled={paying || verifying}
            className="rounded-[12px] border border-[#1f6b3a] px-3 py-2.5 text-[13px] font-bold text-[#1f6b3a] disabled:opacity-60"
          >
            Apply
          </button>
        </span>
      </label>
      {appliedCoupon ? (
        <p className="mt-2 text-[12px] font-medium text-[#1f6b3a]">
          Applied: {appliedCoupon}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-[12px] border border-[#f0d4d0] bg-[#fff6f5] px-3 py-2.5 text-[13px] text-[#9b3b32]">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={paying || verifying}
        onClick={() => void onPay()}
        className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#1f6b3a] px-5 py-3 text-[14px] font-bold text-white disabled:opacity-60"
      >
        {paying || verifying ? <ButtonLoader /> : null}
        {verifying
          ? "Confirming…"
          : paying
            ? "Opening payment…"
            : quote.amountPaise === 0
              ? "Confirm membership"
              : `Pay ${payableLabel}`}
      </button>

      <button
        type="button"
        disabled={paying || verifying}
        onClick={() => onClose?.()}
        className="mt-4 inline-flex w-full items-center justify-center text-[13px] font-semibold text-[#5f6f64] underline-offset-2 hover:underline disabled:opacity-50"
      >
        Back to plans
      </button>
    </CheckoutCard>
  );
}

function CheckoutCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border border-[#e6ebe3] bg-white px-5 py-7 shadow-[0_18px_48px_rgba(15,28,20,0.16)] sm:px-8 sm:py-8 ${className}`.trim()}
    >
      {children}
    </section>
  );
}
