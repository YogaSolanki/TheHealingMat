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
    id: "who-we-are",
    title: "1. Who We Are",
    content: (
      <>
        <p>
          The Healing Mat provides online yoga classes and wellness services
          designed to help people make health a simple and sustainable part of
          everyday life.
        </p>
        <p>
          For privacy-related questions, requests or complaints, please contact:
        </p>
        <p className="font-semibold text-[#1f6b3a]">
          Privacy and Grievance Contact: Pradeep Singh Solanki, Partner
        </p>
        <ul className="list-none pl-0">
          <li>
            Email:{" "}
            <a href={`mailto:${SITE_EMAIL}`} className="font-semibold">
              {SITE_EMAIL}
            </a>
          </li>
          <li>
            Phone/WhatsApp:{" "}
            <a href={SITE_WHATSAPP_URL} className="font-semibold">
              {SITE_PHONE_DISPLAY}
            </a>
          </li>
          <li>
            Address: <span className="font-semibold">{CONTACT_ADDRESS}</span>
          </li>
        </ul>
        <p>
          In this Policy, &quot;The Healing Mat&quot;, &quot;THM&quot;,
          &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refer to the service
          operating under The Healing Mat name.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    content: (
      <>
        <p>
          Depending on how you use our website and services, we may collect the
          following information:
        </p>
        <p className="font-semibold text-[#1f6b3a]">
          Account and contact information
        </p>
        <ul>
          <li>
            Name and mobile number for users registering through the India
            registration route.
          </li>
          <li>
            Name and email address for users registering through the international
            registration route.
          </li>
          <li>One-time password (OTP) verification information.</li>
          <li>Referral codes, where applicable.</li>
        </ul>
        <p className="font-semibold text-[#1f6b3a]">
          Membership and transaction information
        </p>
        <ul>
          <li>
            Trial and membership details, including plan, duration and relevant
            dates.
          </li>
          <li>Coupon, referral and reward records.</li>
          <li>Payment transaction references and invoice details.</li>
        </ul>
        <p>
          Payments are processed through Razorpay. The Healing Mat does not
          intentionally store your full payment card details or banking
          credentials.
        </p>
        <p className="font-semibold text-[#1f6b3a]">
          Support and communication information
        </p>
        <ul>
          <li>Messages you send to us.</li>
          <li>
            Information required to respond to customer support, referral, reward
            or corporate enquiries.
          </li>
        </ul>
        <p className="font-semibold text-[#1f6b3a]">
          Technical and website information
        </p>
        <ul>
          <li>Limited information required to operate and secure the website.</li>
          <li>
            The country or region classification used to display the appropriate
            registration options.
          </li>
          <li>
            Information stored in your browser to support website functionality,
            such as login information and relevant website preferences.
          </li>
        </ul>
        <p>
          We do not require you to provide medical information to create an
          account. Please avoid sending sensitive health or medical details
          through general contact forms or ordinary support messages.
        </p>
      </>
    ),
  },
  {
    id: "why-we-use",
    title: "3. Why We Use Your Information",
    content: (
      <>
        <p>We use personal information for purposes such as:</p>
        <ul>
          <li>Creating and managing your account.</li>
          <li>Verifying your identity through OTPs.</li>
          <li>
            Providing free trials, memberships, classes and member services.
          </li>
          <li>Processing payments and generating invoices.</li>
          <li>Managing referrals, coupons and rewards.</li>
          <li>
            Sending essential service communications, such as OTPs, membership
            confirmations and relevant trial or account messages.
          </li>
          <li>Responding to enquiries and providing support.</li>
          <li>
            Maintaining website security, preventing misuse and troubleshooting
            technical problems.
          </li>
          <li>
            Meeting applicable legal, accounting and regulatory requirements.
          </li>
          <li>
            Sending promotional communications where you have provided the
            required consent.
          </li>
        </ul>
        <p>
          We use information only for relevant purposes and do not intentionally
          collect more information than is reasonably required for these
          activities.
        </p>
      </>
    ),
  },
  {
    id: "country-region-detection",
    title: "4. Country and Region Detection",
    content: (
      <>
        <p>
          We use country or region detection to display the appropriate
          registration process.
        </p>
        <p>
          For this purpose, our website may temporarily process your IP address
          or use a country/region signal provided by our technical infrastructure
          to determine whether you are accessing the website from India or
          outside India.
        </p>
        <p>
          The Healing Mat does not store IP addresses in its database for this
          country-detection purpose. We store the resulting region
          classification, such as &quot;India&quot; or &quot;outside India&quot;,
          so that the appropriate registration options can be displayed.
        </p>
        <p>
          Our hosting, content delivery or other technical service providers may
          independently process or retain IP addresses in their server or
          security logs. Such processing is subject to the relevant
          provider&apos;s systems, settings and retention practices.
        </p>
      </>
    ),
  },
  {
    id: "consent-and-choices",
    title: "5. Consent and Your Choices",
    content: (
      <>
        <p>
          Where consent is required, we will seek it for the relevant purpose.
          You may choose not to provide information that is optional, although
          some features or services may then be unavailable.
        </p>
        <p>
          You can contact us to withdraw consent for optional communications or
          make a privacy-related request. Withdrawal does not affect processing
          already carried out lawfully before the withdrawal, and it does not
          prevent us from retaining information where retention is required by
          law.
        </p>
        <p>
          Essential account, security, payment and service messages may still be
          sent where necessary to provide or administer the service.
        </p>
      </>
    ),
  },
  {
    id: "when-we-share",
    title: "6. When We Share Information",
    content: (
      <>
        <p>
          We may share relevant information with service providers who help us
          operate The Healing Mat, process payments, verify accounts, deliver
          communications, host the website or maintain its security.
        </p>
        <p>
          Our current service providers and their general roles include:
        </p>
        <ul>
          <li>
            <strong>Render:</strong> Hosting of the application and related
            backend infrastructure.
          </li>
          <li>
            <strong>Vercel:</strong> Hosting of the website frontend and
            administration interface.
          </li>
          <li>
            <strong>Razorpay:</strong> Payment processing.
          </li>
          <li>
            <strong>Resend:</strong> Email OTPs for users outside India and
            transactional emails.
          </li>
          <li>
            <strong>AiSensy:</strong> India WhatsApp OTPs, membership
            confirmations and invoice-related WhatsApp messages.
          </li>
          <li>
            <strong>MSG91:</strong> India SMS OTPs and relevant trial WhatsApp
            communications.
          </li>
          <li>
            <strong>Google/YouTube:</strong> Delivery of embedded YouTube content
            and processing associated with use of those services.
          </li>
        </ul>
        <p>
          We may also share information with professional advisers, auditors,
          legal authorities or government bodies where reasonably necessary for
          professional advice, legal compliance, the protection of rights or the
          handling of disputes.
        </p>
        <p>We do not sell personal information to third parties.</p>
        <p>
          Service providers may process information according to their own
          applicable terms, privacy notices and security practices. We seek to
          use them for legitimate operational purposes and to limit the
          information shared to what is relevant.
        </p>
      </>
    ),
  },
  {
    id: "processing-outside-india",
    title: "7. Processing Outside India",
    content: (
      <>
        <p>
          Some service providers may process or store information outside India,
          depending on their infrastructure, account configuration and service
          arrangements.
        </p>
        <p>
          Where applicable, we take this possibility into account when selecting
          and using service providers. The exact data-storage locations and
          log-retention settings of certain providers depend on their technical
          configurations and must be confirmed with those providers.
        </p>
      </>
    ),
  },
  {
    id: "messages-and-promotional",
    title: "8. Messages and Promotional Communications",
    content: (
      <>
        <p>
          We may send essential messages relating to OTP verification, your
          trial, membership, payments, invoices, account access and service
          changes.
        </p>
        <p>
          Promotional messages, including optional offers and referral or
          re-joining promotions, will be sent where the required consent has been
          obtained. WhatsApp promotional messages may require a separate opt-in.
        </p>
        <p>
          You may withdraw your consent to optional promotional communications by
          following the opt-out instructions provided in the message, where
          available, or by contacting us at{" "}
          <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
        </p>
        <p>
          Withdrawing promotional consent will not prevent essential service
          communications where those are necessary.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "9. Cookies and Browser Storage",
    content: (
      <>
        <p>
          The Healing Mat currently does not intentionally use its own analytics
          or advertising tracking scripts, such as Google Analytics or Meta
          Pixel.
        </p>
        <p>
          Our website uses browser storage for certain functional purposes,
          including maintaining login information and remembering relevant
          website settings or preferences. Depending on the page or feature used:
        </p>
        <ul>
          <li>
            Login information may be stored in your browser&apos;s local storage.
          </li>
          <li>
            The website may store your India/outside-India region classification
            and relevant interface preferences.
          </li>
          <li>
            Razorpay Checkout may use its own technical storage or cookies during
            payment.
          </li>
          <li>
            Embedded YouTube content may involve Google/YouTube technologies and
            associated storage.
          </li>
        </ul>
        <p>
          These technologies help website features work as intended. Blocking or
          clearing browser storage may affect login or other website functions.
        </p>
        <p>
          If we introduce analytics or advertising technologies in the future, we
          will review the applicable consent requirements and update our privacy
          and cookie information as necessary.
        </p>
        <p>
          For more information, please refer to our separate{" "}
          <Link href="/cookies">Cookie Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "10. How Long We Keep Information",
    content: (
      <>
        <p>
          We retain personal information for the period reasonably required for
          the purpose for which it was collected, subject to applicable legal,
          accounting, security and operational requirements.
        </p>
        <p>Our current retention schedule is:</p>
        <p className="rounded-[12px] border border-[#e6ebe3] bg-[#FBF9F5] px-4 py-3 text-[13px] text-[#5f6f64]">
          Retention schedule details to be inserted. Please provide the schedule
          table so it can be added here.
        </p>
        <p>
          After the applicable retention period, information will be deleted or
          anonymised where appropriate. For account and consent records covered
          by the schedule above, we intend to provide at least 48 hours&apos;
          notice before deletion or anonymisation.
        </p>
        <p>
          Some records, such as invoices, may need to be retained for longer
          where applicable law requires it. If information has been deleted from
          active systems, residual copies may remain in backups until those
          backups are overwritten. Such residual copies are not intended to be
          used for ordinary business purposes.
        </p>
        <p>
          You may contact us to request deletion of your information. We will
          assess the request and delete information where appropriate, except
          where retention is required or permitted for legal, accounting,
          security or other legitimate purposes.
        </p>
      </>
    ),
  },
  {
    id: "protection",
    title: "11. How We Protect Your Information",
    content: (
      <>
        <p>
          We use reasonable technical and organisational measures intended to
          protect personal information against unauthorised access, loss, misuse
          or disclosure.
        </p>
        <p>
          Access to personal information is limited to people and service
          providers who need it for authorised purposes. However, no website,
          transmission method or storage system can be guaranteed to be
          completely secure.
        </p>
        <p>
          Please do not share your password or OTP with anyone. If you suspect
          unauthorised access to your account or believe your information has
          been compromised, contact us promptly.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "12. Your Privacy Rights",
    content: (
      <>
        <p>Subject to applicable law, you may contact us to:</p>
        <ul>
          <li>Ask what personal information we hold about you.</li>
          <li>Request correction or updating of inaccurate information.</li>
          <li>Request deletion of information where applicable.</li>
          <li>Withdraw consent where processing is based on consent.</li>
          <li>
            Raise a concern or grievance about how your information is handled.
          </li>
          <li>
            Exercise any other rights available to you under applicable
            data-protection law.
          </li>
        </ul>
        <p>
          Please email{" "}
          <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a> or contact us at{" "}
          <a href={SITE_WHATSAPP_URL}>{SITE_PHONE_DISPLAY}</a>. We may need to
          verify your identity before acting on a request.
        </p>
        <p>
          We aim to acknowledge privacy requests within 3 days and work toward
          resolving them within 30 days. The actual time may depend on the nature
          of the request, verification requirements and applicable law.
        </p>
        <p>
          Where applicable, you may also nominate another person to exercise your
          privacy rights in accordance with the relevant legal requirements.
          Please contact us for the procedure.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "13. Children's Privacy",
    content: (
      <>
        <p>
          The Healing Mat&apos;s online membership service is intended for adults
          aged 18 years and above. We do not knowingly invite children under 18
          to register independently for an account or membership.
        </p>
        <p>
          If you believe that a child has provided personal information to us in
          circumstances where it should not have been collected, please contact
          us so we can review the matter and take appropriate action.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "14. Changes to This Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy when our services, technology,
          service providers or legal requirements change.
        </p>
        <p>
          The latest version will be published on our website with its effective
          date. We encourage you to review this page periodically.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "15. Contact Us",
    content: (
      <>
        <p>For privacy questions, requests or grievances, please contact:</p>
        <p className="font-semibold text-[#1f6b3a]">
          Pradeep Singh Solanki, Partner
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
            Phone/WhatsApp:{" "}
            <a href={SITE_WHATSAPP_URL} className="font-semibold">
              {SITE_PHONE_DISPLAY}
            </a>
          </li>
          <li>
            Address: <span className="font-semibold">{CONTACT_ADDRESS}</span>
          </li>
        </ul>
        <p>
          We will review your concern and respond in accordance with our
          grievance process and applicable law.
        </p>
      </>
    ),
  },
];

export function PrivacyPolicyContent() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            Website:{" "}
            <a
              href="https://www.thehealingmat.yoga"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.thehealingmat.yoga
            </a>
          </p>
          <p>
            The Healing Mat respects your privacy. This Privacy Policy explains
            what personal information we collect, why we use it, how it is
            handled, and the choices available to you when you visit our
            website, register for a free trial, purchase a membership, or use our
            services.
          </p>
        </>
      }
      sections={sections}
      afterSections={
        <p className="mt-10">
          This Privacy Policy describes The Healing Mat&apos;s intended
          practices. It should be read alongside the website&apos;s{" "}
          <Link href="/terms">Terms &amp; Conditions</Link> and{" "}
          <Link href="/cookies">Cookie Policy</Link>.
        </p>
      }
    />
  );
}
