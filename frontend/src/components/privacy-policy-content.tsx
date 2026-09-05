import Link from "next/link";
import {
  LegalDocumentPage,
  type LegalDocumentSection,
} from "@/components/legal-document-page";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_PHONE_DISPLAY,
  SITE_WHATSAPP_URL,
} from "@/lib/site-contact";

const EFFECTIVE_DATE = "5 September 2026";
const LAST_UPDATED = "5 September 2026";

const sections: LegalDocumentSection[] = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: (
      <>
        <p>
          Depending on how you use The Healing Mat, we may collect:
        </p>
        <p className="font-semibold text-[#1f6b3a]">
          Information you provide to us
        </p>
        <p>This may include:</p>
        <ul>
          <li>Name</li>
          <li>Mobile number</li>
          <li>Email address</li>
          <li>Country and other basic account information</li>
          <li>Information provided when registering for a Free Trial</li>
          <li>Information provided when purchasing a membership</li>
          <li>Referral information</li>
          <li>Coupon information</li>
          <li>Information submitted through contact or corporate enquiry forms</li>
          <li>
            Messages or information you voluntarily send to us through email,
            WhatsApp or other communication channels
          </li>
        </ul>
        <p className="font-semibold text-[#1f6b3a]">Payment Information</p>
        <p>
          When you purchase a membership, payment information may be processed by
          our payment service provider.
        </p>
        <p>
          The Healing Mat does not need to store your complete card, bank or other
          sensitive payment credentials where the payment provider processes them
          directly.
        </p>
        <p>We may retain transaction-related information such as:</p>
        <ul>
          <li>Transaction/reference number</li>
          <li>Amount paid</li>
          <li>Payment date</li>
          <li>Membership purchased</li>
          <li>Discount or coupon applied</li>
          <li>Payment status</li>
          <li>Refund information, where applicable</li>
        </ul>
        <p className="font-semibold text-[#1f6b3a]">
          Information collected automatically
        </p>
        <p>
          When you use our website, certain technical information may be collected
          automatically, such as:
        </p>
        <ul>
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Pages visited</li>
          <li>Basic website usage information</li>
          <li>Date and time of access</li>
        </ul>
        <p>
          This information may be used to operate, secure and improve the website.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "2. How We Use Your Information",
    content: (
      <>
        <p>We may use your information to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Register you for a Free Trial</li>
          <li>Process membership purchases</li>
          <li>Provide access to your membership and Daily Classes</li>
          <li>Verify your identity</li>
          <li>Send OTPs and important account communications</li>
          <li>Process referrals and applicable rewards</li>
          <li>Apply valid coupon codes or discounts</li>
          <li>Process refunds where applicable</li>
          <li>Respond to enquiries and customer-support requests</li>
          <li>Send important information about your account or membership</li>
          <li>Improve our website, services and user experience</li>
          <li>Prevent misuse, fraud or unauthorised access</li>
          <li>Comply with applicable legal requirements</li>
        </ul>
        <p>
          Where you have provided appropriate consent, we may also use your
          contact information for promotional or marketing communication.
        </p>
      </>
    ),
  },
  {
    id: "health-information",
    title: "3. Health Information",
    content: (
      <>
        <p>
          The Healing Mat provides yoga and wellness services and may receive
          health-related information if you voluntarily provide it to us.
        </p>
        <p>
          For example, you may mention a health concern when communicating with
          us or when using a health-related service.
        </p>
        <p>
          We do not require unnecessary health information merely to create a
          basic THM account.
        </p>
        <p>
          If health information is collected, we will use it only for the relevant
          purpose for which it was provided and in accordance with applicable law.
        </p>
        <p>
          The Healing Mat does not use personal health information to diagnose or
          provide medical treatment.
        </p>
        <p>
          For more information about the health-related nature and limitations of
          our services, please see our{" "}
          <Link href="/health-and-safety">Health &amp; Safety page</Link>.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "4. Sharing of Information",
    content: (
      <>
        <p>We do not sell your personal information.</p>
        <p>
          We may share necessary information with trusted service providers who
          help us operate The Healing Mat, such as:
        </p>
        <ul>
          <li>Payment service providers</li>
          <li>OTP/authentication providers</li>
          <li>Email or communication service providers</li>
          <li>Website hosting and technology providers</li>
          <li>Analytics or website-support services</li>
          <li>Other service providers necessary to provide our services</li>
        </ul>
        <p>
          These providers should receive only the information reasonably required
          for the service they provide.
        </p>
        <p>
          We may also disclose information where required by law, legal process or
          a lawful government request.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "5. Payments",
    content: (
      <>
        <p>
          Membership payments may be processed through third-party payment
          providers.
        </p>
        <p>
          Your payment may therefore be subject to the privacy policy and terms
          of the relevant payment provider.
        </p>
        <p>
          The Healing Mat will retain appropriate transaction information for
          accounting, membership, customer-support and legal purposes.
        </p>
      </>
    ),
  },
  {
    id: "communications",
    title: "6. WhatsApp, Email and Other Communications",
    content: (
      <>
        <p>
          We may use email, WhatsApp, SMS or other communication methods to
          communicate with you about:
        </p>
        <ul>
          <li>Account verification</li>
          <li>Trial registration</li>
          <li>Trial information</li>
          <li>Membership</li>
          <li>Daily Classes</li>
          <li>Payments</li>
          <li>Important service information</li>
          <li>Customer support</li>
        </ul>
        <p>
          Where permitted and where you have provided the required consent, we may
          also send promotional communication.
        </p>
        <p>
          You may contact us if you no longer wish to receive promotional
          communications.
        </p>
        <p>
          Essential service communications may still be sent where necessary to
          provide the service or manage your account.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "7. Cookies and Website Analytics",
    content: (
      <>
        <p>The Healing Mat may use cookies and similar technologies to:</p>
        <ul>
          <li>Keep the website functioning properly</li>
          <li>Remember certain preferences</li>
          <li>Understand website usage</li>
          <li>Improve website performance</li>
          <li>Measure the effectiveness of our website and marketing</li>
        </ul>
        <p>
          Some cookies may be placed by third-party services used by The Healing
          Mat.
        </p>
        <p>
          You may be able to control cookies through your browser settings.
        </p>
        <p>
          Where applicable, additional cookie choices may be provided on the
          website.
        </p>
      </>
    ),
  },
  {
    id: "protection",
    title: "8. How We Protect Your Information",
    content: (
      <>
        <p>
          We take reasonable measures to protect personal information against:
        </p>
        <ul>
          <li>Unauthorised access</li>
          <li>Unauthorised disclosure</li>
          <li>Loss</li>
          <li>Misuse</li>
          <li>Alteration</li>
        </ul>
        <p>
          However, no internet-based system can be guaranteed to be completely
          secure.
        </p>
        <p>
          If we become aware of a data-security incident requiring action or
          notification under applicable law, we will take the appropriate steps.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "9. How Long We Keep Information",
    content: (
      <>
        <p>
          We retain personal information only for as long as reasonably necessary
          for the purposes for which it was collected, including:
        </p>
        <ul>
          <li>Providing our services</li>
          <li>Maintaining account and membership records</li>
          <li>Maintaining payment and transaction records</li>
          <li>Handling customer-support matters</li>
          <li>Meeting legal, tax and accounting requirements</li>
          <li>Resolving disputes</li>
          <li>Preventing fraud or misuse</li>
        </ul>
        <p>
          When information is no longer required, it may be deleted or otherwise
          handled in accordance with applicable law.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "10. Your Choices and Rights",
    content: (
      <>
        <p>
          Depending on applicable law, you may have rights relating to your
          personal information, including the ability to:
        </p>
        <ul>
          <li>Request access to information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion where legally permitted</li>
          <li>Withdraw consent where processing is based on consent</li>
          <li>Request information about how your data is being used</li>
          <li>Raise a privacy-related concern</li>
        </ul>
        <p>
          Some information may need to be retained where required by law or where
          there is a legitimate reason to retain it.
        </p>
        <p>
          To make a privacy-related request, please contact us using the details
          below.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "11. Children's Privacy",
    content: (
      <>
        <p>The Healing Mat is primarily intended for adults.</p>
        <p>
          We do not knowingly collect personal information from children in
          circumstances where such collection is prohibited by applicable law.
        </p>
        <p>
          If we learn that personal information has been collected from a child in
          circumstances where it should not have been collected, we will take
          appropriate steps as required by applicable law.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "12. Changes to This Privacy Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in our services, technology, legal requirements or business practices.
        </p>
        <p>
          The updated version will be published on this page with the revised Last
          Updated date.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "13. Contact Us",
    content: (
      <>
        <p>
          If you have a question, concern or request relating to your personal
          information or this Privacy Policy, please contact:
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
            Address:{" "}
            <span className="font-semibold">
              {SITE_ADDRESS_LINES.join(", ")}
            </span>
          </li>
        </ul>
      </>
    ),
  },
];

export function PrivacyPolicyContent() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            The Healing Mat respects your privacy. This Privacy Policy explains
            what personal information we collect, why we collect it, how we use
            it and the choices available to you when you use our website,
            register for a Free Trial, purchase a membership or communicate with
            us.
          </p>
          <p>
            By using The Healing Mat website or creating an account, you
            acknowledge that you have read this Privacy Policy.
          </p>
        </>
      }
      sections={sections}
      afterSections={
        <div className="mt-10 rounded-[18px] border border-[#e6ebe3] px-5 py-5 sm:px-6">
          <h2 className="font-serif text-[1.15rem] font-bold text-[#1f6b3a] sm:text-[1.25rem]">
            Important note for lawyer review
          </h2>
          <p className="mt-3">
            This is a THM V1 working draft, not the final legal text.
          </p>
          <p className="mt-3">
            The lawyer should specifically review:
          </p>
          <ul>
            <li>Applicable Indian data-protection requirements</li>
            <li>Consent wording</li>
            <li>User rights and grievance mechanism</li>
            <li>Health-information handling</li>
            <li>Children/minors</li>
            <li>Third-party service providers</li>
            <li>International users</li>
            <li>Data retention</li>
            <li>Data breach obligations</li>
            <li>Cross-border data transfers, if applicable</li>
            <li>Cookie/analytics requirements</li>
            <li>Exact legal entity name and contact details</li>
          </ul>
        </div>
      }
    />
  );
}
