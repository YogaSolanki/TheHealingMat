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

const LAST_UPDATED = "29 October 2026";

const CONTACT_ADDRESS =
  "GC 51, 5th Floor, Aditya Gold Crest, Vaibhav Khand, Indirapuram, Ghaziabad, Uttar Pradesh 201014, India";

const sections: LegalDocumentSection[] = [
  {
    id: "membership-cancellation",
    title: "1. Membership Cancellation",
    content: (
      <>
        <p>You may request cancellation of your paid membership:</p>
        <ul>
          <li>Before your membership start date; or</li>
          <li>
            Within 3 calendar days of the membership start date recorded in our
            system.
          </li>
        </ul>
        <p>
          The three-day cancellation period is calculated from the membership
          start date, not the purchase date, payment date or date you first
          attend a class.
        </p>
        <p>
          <strong>Example:</strong> If your membership starts on 15 August, you
          may request cancellation during the three-calendar-day period ending on
          17 August.
        </p>
        <p>
          Your cancellation request must be received within the applicable
          period. Sending a request does not automatically cancel the membership;
          The Healing Mat must review and process it.
        </p>
      </>
    ),
  },
  {
    id: "how-to-request",
    title: "2. How to Request Cancellation",
    content: (
      <>
        <p>Cancellation requests are handled manually.</p>
        <p>
          To request cancellation, contact us through either of the following
          channels:
        </p>
        <ul>
          <li>
            Email:{" "}
            <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>
          </li>
          <li>
            WhatsApp/Phone:{" "}
            <a href={SITE_WHATSAPP_URL}>{SITE_PHONE_DISPLAY}</a>
          </li>
        </ul>
        <p>
          Please provide enough information for us to identify your account and
          the membership you wish to cancel. We may verify your request using
          your registered mobile number or email address.
        </p>
        <p>
          Please do not send your password, OTP or full payment card details.
        </p>
        <p>
          There is currently no self-service cancellation button on the website.
        </p>
      </>
    ),
  },
  {
    id: "refund-eligibility",
    title: "3. Refund Eligibility",
    content: (
      <>
        <p>
          If your cancellation request is eligible under this policy and is
          approved by The Healing Mat, the applicable refund will be processed.
        </p>
        <p>
          Requests received outside the standard cancellation period are not
          automatically eligible under this policy. However, we will review
          genuine payment or service-related problems individually.
        </p>
        <p>These may include:</p>
        <ul>
          <li>Duplicate payments.</li>
          <li>
            Payment completed but membership not activated because of a technical
            issue.
          </li>
          <li>Incorrect payments.</li>
          <li>Failure to provide paid membership access.</li>
          <li>Other genuine payment or service-related errors.</li>
        </ul>
        <p>
          The standard cancellation policy does not limit any rights or remedies
          available to you under applicable law.
        </p>
      </>
    ),
  },
  {
    id: "refund-processing",
    title: "4. Refund Processing Time",
    content: (
      <>
        <p>
          Once a refund is approved, The Healing Mat will initiate it within 10
          working days.
        </p>
        <p>
          Where possible, the refund will be made through the original payment
          method and transaction.
        </p>
        <p>
          The time taken for the refunded amount to appear in your bank account
          or payment instrument may depend on your payment provider or bank and
          may be longer than our processing period.
        </p>
        <p>
          Where available, we may provide the relevant refund or transaction
          reference.
        </p>
        <p>
          Approval of a refund request and completion of a refund are separate
          steps. We will not describe a refund as completed merely because it has
          been approved.
        </p>
      </>
    ),
  },
  {
    id: "free-trials",
    title: "5. Free Trials",
    content: (
      <>
        <p>
          The Healing Mat may offer free trials so that people can experience our
          classes before deciding whether to purchase a membership.
        </p>
        <p>
          Taking a free trial is optional. You may choose whether to participate
          before purchasing a paid membership.
        </p>
        <p>
          A free trial is not itself a paid membership. If you subsequently
          purchase a membership, the cancellation period for that paid membership
          will be calculated according to Section 1 of this Policy.
        </p>
        <p>
          Free trial eligibility, duration, start dates and other applicable
          conditions will be communicated through the relevant registration or
          trial information.
        </p>
      </>
    ),
  },
  {
    id: "referral-and-coupon",
    title: "6. Referral and Coupon Purchases",
    content: (
      <>
        <p>
          If you purchase a membership using a referral benefit or coupon, the
          original transaction will retain the applicable referral or coupon
          information.
        </p>
        <p>
          Cancellation or refund of a membership may affect an associated
          referral reward or promotional benefit, subject to the applicable
          referral or coupon rules and applicable law.
        </p>
      </>
    ),
  },
  {
    id: "after-cancellation",
    title: "7. What Happens After Cancellation?",
    content: (
      <>
        <p>
          Once a cancellation is approved, the relevant membership will be marked
          as cancelled. Access to its member-only benefits will end in accordance
          with the applicable cancellation rules.
        </p>
        <p>
          Cancelling a membership does not automatically delete your The Healing
          Mat account.
        </p>
        <p>
          Your account may continue to retain relevant information, including:
        </p>
        <ul>
          <li>Account details.</li>
          <li>Personal The Healing Mat access link.</li>
          <li>Referral code and referral history.</li>
          <li>Previous membership information.</li>
          <li>Transaction and invoice records.</li>
        </ul>
        <p>
          This information will be handled in accordance with our{" "}
          <Link href="/privacy">Privacy Policy</Link> and applicable legal
          requirements.
        </p>
        <p>
          You may purchase another membership in the future using the same
          account, subject to the applicable membership rules.
        </p>
      </>
    ),
  },
  {
    id: "consumer-rights",
    title: "8. Consumer Rights",
    content: (
      <>
        <p>
          Nothing in this Policy is intended to exclude, restrict or override any
          consumer rights or remedies that cannot lawfully be excluded or
          restricted under applicable law.
        </p>
        <p>
          If you believe that you have been charged incorrectly, have not
          received the service you paid for, or have another concern relating to
          your purchase, please contact us so that we can review the matter.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "9. Contact Us",
    content: (
      <>
        <p>
          For cancellation, refund or payment-related questions, please contact:
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
          <li>
            Address: <span className="font-semibold">{CONTACT_ADDRESS}</span>
          </li>
        </ul>
        <p>
          Please read this Policy together with our{" "}
          <Link href="/terms">Terms &amp; Conditions</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
];

export function RefundAndCancellationContent() {
  return (
    <LegalDocumentPage
      title="Refund & Cancellation Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          We want you to feel comfortable with your decision to join The Healing
          Mat. This policy explains how membership cancellations and refunds
          work.
        </p>
      }
      sections={sections}
    />
  );
}
