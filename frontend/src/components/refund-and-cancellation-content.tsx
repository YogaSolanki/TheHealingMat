import Link from "next/link";
import {
  LegalDocumentPage,
  type LegalDocumentSection,
} from "@/components/legal-document-page";
import {
  SITE_EMAIL,
  SITE_PHONE_DISPLAY,
  SITE_WHATSAPP_URL,
} from "@/lib/site-contact";

const EFFECTIVE_DATE = "5 September 2026";
const LAST_UPDATED = "5 September 2026";

const sections: LegalDocumentSection[] = [
  {
    id: "membership-cancellation",
    title: "1. Membership Cancellation",
    content: (
      <>
        <p>
          A member may request cancellation of their membership within 3 days of
          the membership start date.
        </p>
        <p>For example:</p>
        <ul>
          <li>Membership starts: 15 August</li>
          <li>
            The member may request cancellation within the applicable 3-day
            cancellation period.
          </li>
        </ul>
        <p>
          The cancellation period will be calculated from the membership start
          date recorded in our system.
        </p>
      </>
    ),
  },
  {
    id: "how-to-request",
    title: "2. How to Request Cancellation",
    content: (
      <>
        <p>
          Cancellation requests are handled manually in Version 1.
        </p>
        <p>
          To request cancellation, contact The Healing Mat through our designated:
        </p>
        <ul>
          <li>Email</li>
          <li>WhatsApp</li>
        </ul>
        <p>
          Please provide enough information for us to identify your account and
          membership.
        </p>
        <p>
          We may use your registered mobile number or email address to verify the
          request.
        </p>
        <p>
          There is currently no self-service cancellation button on the website.
        </p>
      </>
    ),
  },
  {
    id: "refund",
    title: "3. Refund",
    content: (
      <>
        <p>
          If your cancellation request is eligible under this policy, The Healing
          Mat will process the applicable refund.
        </p>
        <p>
          Where possible, the refund will be made through the original payment
          method.
        </p>
        <p>
          Once a refund is approved, The Healing Mat will initiate the refund
          within 10 working days.
        </p>
        <p>
          The time taken for the refunded amount to appear in your account may
          depend on the payment provider or bank.
        </p>
      </>
    ),
  },
  {
    id: "after-cancellation",
    title: "4. After Cancellation",
    content: (
      <>
        <p>Once a cancellation has been approved:</p>
        <p className="font-semibold text-[#1f6b3a]">Membership → Cancelled</p>
        <p>Your THM account itself is not deleted.</p>
        <p>Your account may continue to retain:</p>
        <ul>
          <li>Account information</li>
          <li>Personal THM Access Link</li>
          <li>Referral Code</li>
          <li>Referral history</li>
          <li>Previous membership information</li>
          <li>Transaction records</li>
        </ul>
        <p>
          You may purchase a membership again in the future, subject to the
          applicable membership rules.
        </p>
      </>
    ),
  },
  {
    id: "refund-processing",
    title: "5. Refund Processing",
    content: (
      <>
        <p>
          Once a refund has been approved, The Healing Mat will initiate it within
          10 working days.
        </p>
        <p>
          The date on which the refund actually reaches your bank account or
          payment instrument may be later and depends on the relevant payment
          provider or bank.
        </p>
        <p>
          Where available, The Healing Mat may provide the relevant refund or
          transaction reference.
        </p>
      </>
    ),
  },
  {
    id: "other-refund-situations",
    title: "6. Other Refund Situations",
    content: (
      <>
        <p>
          We may also review refund requests arising from situations such as:
        </p>
        <ul>
          <li>Duplicate payment</li>
          <li>
            Payment completed but membership not activated because of a technical
            issue
          </li>
          <li>Incorrect payment</li>
          <li>Other genuine payment or service-related errors</li>
        </ul>
        <p>Such cases will be reviewed individually.</p>
      </>
    ),
  },
  {
    id: "referral-coupon",
    title: "7. Referral or Coupon Purchases",
    content: (
      <>
        <p>
          If a membership was purchased using a referral benefit or coupon, the
          original transaction will retain the applicable referral or coupon
          information.
        </p>
        <p>
          Cancellation or refund of that membership may affect any associated
          referral reward or promotional benefit, subject to the applicable
          referral or coupon rules.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "8. Contact Us",
    content: (
      <>
        <p>
          For cancellation or refund-related questions, please contact:
        </p>
        <p className="font-semibold text-[#1f6b3a]">The Healing Mat</p>
        <ul className="list-none pl-0">
          <li>
            Email:{" "}
            <a href={`mailto:${SITE_EMAIL}`} className="font-semibold">
              {SITE_EMAIL}
            </a>
          </li>
          <li>
            WhatsApp/Phone:{" "}
            <a href={SITE_WHATSAPP_URL} className="font-semibold">
              {SITE_PHONE_DISPLAY}
            </a>
          </li>
        </ul>
      </>
    ),
  },
];

export function RefundAndCancellationContent() {
  return (
    <LegalDocumentPage
      title="Refund & Cancellation Policy"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          We want you to feel comfortable with your decision to join The Healing
          Mat. This policy explains how membership cancellation and refunds work.
        </p>
      }
      sections={sections}
      afterSections={
        <>
          <div className="mt-10 rounded-[18px] border border-[#e6ebe3] px-5 py-5 sm:px-6">
            <h2 className="font-serif text-[1.15rem] font-bold text-[#1f6b3a] sm:text-[1.25rem]">
              Important
            </h2>
            <p className="mt-3">
              This policy is intended to explain The Healing Mat&apos;s Version 1
              cancellation and refund process.
            </p>
            <p className="mt-3">
              The final policy should be reviewed by a qualified lawyer before
              publication and should be read together with the{" "}
              <Link href="/terms">Terms &amp; Conditions</Link>.
            </p>
          </div>

          <div className="mt-8 rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] px-5 py-5 sm:px-6">
            <h2 className="font-serif text-[1.15rem] font-bold text-[#1f6b3a] sm:text-[1.25rem]">
              One thing we would specifically ask the lawyer to check
            </h2>
            <p className="mt-3">
              Not whether we should make the policy more complicated, but whether
              this simple structure is legally sufficient:
            </p>
            <p className="mt-3 font-medium text-[#3d4a3c]">
              14-day free trial → membership purchase → 3-day cancellation window →
              refund initiated within 10 working days.
            </p>
            <p className="mt-3">
              If the lawyer says the 3-day rule needs modification for any
              statutory reason, we change it then. Otherwise, we would keep it
              exactly this simple.
            </p>
          </div>
        </>
      }
    />
  );
}
