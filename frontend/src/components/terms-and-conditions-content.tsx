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
    id: "about",
    title: "1. About The Healing Mat",
    content: (
      <>
        <p>
          The Healing Mat provides online yoga, movement, relaxation and wellness
          experiences designed to help people make health part of everyday life.
        </p>
        <p>Our services may include:</p>
        <ul>
          <li>Free Trial access</li>
          <li>Paid memberships</li>
          <li>Daily Classes</li>
          <li>Yoga and movement practices</li>
          <li>Wellness programs</li>
          <li>Health and wellness resources</li>
          <li>Articles, videos and other educational material</li>
        </ul>
        <p>
          The Healing Mat is a wellness service. It is not a medical service.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: (
      <>
        <p>
          You must provide accurate information when creating an account or
          purchasing a membership.
        </p>
        <p>
          You are responsible for ensuring that the information associated with
          your account remains reasonably accurate.
        </p>
        <p>
          Where applicable, additional requirements relating to age or use by
          minors will be governed by applicable law.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "3. Your THM Account",
    content: (
      <>
        <p>Some THM services require you to create an account.</p>
        <p>Your account may be associated with:</p>
        <ul>
          <li>Your name</li>
          <li>Registered mobile number or email address</li>
          <li>Personal THM Access Link</li>
          <li>Referral Code</li>
          <li>Membership information</li>
          <li>Transaction history</li>
        </ul>
        <p>
          You should not knowingly provide false information or create duplicate
          accounts to misuse a Free Trial, referral benefit, coupon or other THM
          offer.
        </p>
        <p>You are responsible for keeping your account access secure.</p>
        <p>
          If you believe someone has accessed your account without your
          permission, please contact us.
        </p>
      </>
    ),
  },
  {
    id: "free-trial",
    title: "4. Free Trial",
    content: (
      <>
        <p>The Healing Mat may offer a Free Trial to eligible users.</p>
        <p>
          The availability, duration, start date and other conditions of the Free
          Trial may be determined by THM from time to time.
        </p>
        <p>
          The Free Trial is intended to allow a person to experience The Healing
          Mat before deciding whether to purchase a membership.
        </p>
        <p>
          A person who has already used a Free Trial is not automatically
          entitled to another Free Trial.
        </p>
        <p>
          THM may refuse or withdraw a Free Trial where it reasonably believes
          that the offer is being misused.
        </p>
        <p>
          The detailed Free Trial rules are available through the applicable
          information provided during registration.
        </p>
      </>
    ),
  },
  {
    id: "membership",
    title: "5. Membership",
    content: (
      <>
        <p>
          A THM membership provides access to the Daily Classes and other benefits
          included with the membership purchased by you.
        </p>
        <p>
          The membership period begins according to the membership start date
          selected during purchase and the applicable membership terms.
        </p>
        <p>Membership information, including:</p>
        <ul>
          <li>Plan</li>
          <li>Start date</li>
          <li>End date</li>
          <li>Price</li>
          <li>Applicable benefits</li>
        </ul>
        <p>will be shown to you during the purchase process.</p>
        <p>
          A membership does not automatically renew unless THM specifically
          offers an automatic-renewal arrangement and you agree to it.
        </p>
      </>
    ),
  },
  {
    id: "daily-classes",
    title: "6. Daily Classes",
    content: (
      <>
        <p>
          Members receive access to Daily Classes according to their membership
          and the schedule made available by The Healing Mat.
        </p>
        <p>
          The schedule, timing, format, content or availability of particular
          Daily Classes may change from time to time.
        </p>
        <p>
          THM may modify, replace or discontinue a particular class, program or
          resource where reasonably necessary.
        </p>
        <p>
          We will make reasonable efforts to provide the services included with
          your membership.
        </p>
        <p>
          The Healing Mat does not promise that a particular trainer, class,
          topic or session will always be available.
        </p>
      </>
    ),
  },
  {
    id: "health-disclaimer",
    title: "7. Health, Safety & Medical Disclaimer",
    content: (
      <>
        <p>
          The Healing Mat provides yoga, movement, relaxation and wellness
          practices for general health and wellbeing.
        </p>
        <p>
          Our Daily Classes, programs, videos, guides and other resources are not
          medical advice, diagnosis or treatment.
        </p>
        <p>The Healing Mat does not claim to:</p>
        <ul>
          <li>Diagnose diseases or medical conditions</li>
          <li>Cure diseases or medical conditions</li>
          <li>Replace medical treatment</li>
          <li>Replace medication prescribed by a healthcare professional</li>
          <li>Guarantee a particular medical or health outcome</li>
        </ul>
        <p>
          Yoga and physical activity may involve risks, including discomfort,
          strain or injury.
        </p>
        <p>
          You are responsible for considering whether a particular activity is
          appropriate for your health and ability.
        </p>
        <p>
          If you have a medical condition, injury, are pregnant, have recently
          undergone surgery, have been advised to restrict physical activity, or
          have another health concern, you should seek appropriate professional
          medical advice before participating where appropriate.
        </p>
        <p>
          You should practise within your own ability and stop if you experience
          pain, dizziness, difficulty breathing, chest pain or other concerning
          symptoms.
        </p>
        <p>
          Nothing provided by The Healing Mat creates a doctor-patient or other
          medical relationship.
        </p>
        <p>
          For more detailed guidance, please see our{" "}
          <Link href="/health-and-safety">Health &amp; Safety page</Link>.
        </p>
      </>
    ),
  },
  {
    id: "individual-results",
    title: "8. Individual Results",
    content: (
      <>
        <p>People respond differently to yoga and physical activity.</p>
        <p>The Healing Mat does not guarantee:</p>
        <ul>
          <li>Weight loss</li>
          <li>Pain relief</li>
          <li>Increased flexibility</li>
          <li>Improvement in a medical condition</li>
          <li>Stress reduction</li>
          <li>Any other particular physical or mental health result</li>
        </ul>
        <p>
          Any examples, testimonials or general health information provided by THM
          should not be understood as a guarantee of your individual results.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "9. Payments",
    content: (
      <>
        <p>Membership prices will be displayed before payment.</p>
        <p>
          You are responsible for paying the applicable membership price and any
          applicable taxes or charges shown during checkout.
        </p>
        <p>Payments may be processed through third-party payment providers.</p>
        <p>
          Your payment may therefore also be subject to the applicable terms of
          the payment provider.
        </p>
        <p>
          A successful payment does not necessarily mean that your membership
          begins immediately if you have selected a future membership start date.
        </p>
      </>
    ),
  },
  {
    id: "cancellation-refunds",
    title: "10. Cancellation & Refunds",
    content: (
      <>
        <p>
          Membership cancellation and refunds are governed by The Healing
          Mat&apos;s{" "}
          <Link href="/refund">Refund &amp; Cancellation Policy</Link>.
        </p>
        <p>
          The current policy provides for cancellation requests within the
          applicable cancellation period and explains the process for requesting
          and receiving a refund.
        </p>
        <p>The detailed policy is available on the THM website.</p>
        <p>
          Nothing in these Terms is intended to remove any rights that cannot
          legally be excluded under applicable law.
        </p>
      </>
    ),
  },
  {
    id: "referrals-coupons",
    title: "11. Referral Codes, Coupons & Rewards",
    content: (
      <>
        <p>
          THM may offer referral programs, coupon codes, discounts or rewards.
        </p>
        <p>These offers may have specific eligibility conditions.</p>
        <p>Referral Codes and coupons must not be:</p>
        <ul>
          <li>Used fraudulently</li>
          <li>Shared or generated for misuse</li>
          <li>Used to create duplicate accounts</li>
          <li>Used to obtain benefits contrary to the applicable offer rules</li>
        </ul>
        <p>
          THM may cancel or reverse a referral benefit, discount or reward where
          it reasonably determines that the applicable rules have been misused.
        </p>
        <p>
          The specific referral and coupon rules may change from time to time and
          will be communicated through the applicable THM program information.
        </p>
      </>
    ),
  },
  {
    id: "access-link",
    title: "12. Personal THM Access Link",
    content: (
      <>
        <p>
          Eligible users may receive a permanent Personal THM Access Link
          associated with their account.
        </p>
        <p>The link is intended for the individual account holder.</p>
        <p>
          You must not intentionally share your Personal THM Access Link to
          provide unauthorised access to another person.
        </p>
        <p>
          THM may restrict access where an account or access link is being
          misused.
        </p>
      </>
    ),
  },
  {
    id: "content-use",
    title: "13. Use of THM Content",
    content: (
      <>
        <p>
          The Healing Mat&apos;s website, Daily Classes, videos, photographs,
          graphics, written material, guides, programs, logos, trademarks and
          other content belong to THM or are used with appropriate rights.
        </p>
        <p>
          Your membership gives you permission to use the applicable content for
          your personal, non-commercial use during the permitted access period.
        </p>
        <p>You must not, without permission:</p>
        <ul>
          <li>Copy or reproduce THM content</li>
          <li>Re-upload THM videos</li>
          <li>Sell or commercially distribute THM content</li>
          <li>Publicly broadcast protected member content</li>
          <li>Share protected content with non-members</li>
          <li>Use THM content to provide your own commercial service</li>
          <li>Remove copyright or ownership information</li>
        </ul>
        <p>
          Your membership does not transfer ownership of THM content to you.
        </p>
      </>
    ),
  },
  {
    id: "misuse",
    title: "14. Website and Service Misuse",
    content: (
      <>
        <p>You must not use the THM website or services to:</p>
        <ul>
          <li>Commit fraud</li>
          <li>Attempt unauthorised access</li>
          <li>Interfere with the website or services</li>
          <li>Circumvent access controls</li>
          <li>Abuse referral, coupon or Free Trial offers</li>
          <li>Misrepresent your identity</li>
          <li>Use THM content for unauthorised commercial purposes</li>
          <li>Do anything unlawful or harmful</li>
        </ul>
        <p>
          We may restrict or suspend access where necessary to protect THM, our
          members or our services.
        </p>
      </>
    ),
  },
  {
    id: "suspension",
    title: "15. Account Suspension or Termination",
    content: (
      <>
        <p>
          THM may suspend or terminate an account where there is reasonable
          evidence of:
        </p>
        <ul>
          <li>Fraud</li>
          <li>Serious misuse</li>
          <li>Unauthorised access</li>
          <li>Account sharing</li>
          <li>Repeated abuse of offers</li>
          <li>Copyright infringement</li>
          <li>Illegal activity</li>
          <li>Serious violation of these Terms</li>
        </ul>
        <p>Where appropriate, we may provide notice before taking action.</p>
        <p>
          Nothing in this section limits any rights available to you under
          applicable law.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "16. Third-Party Services",
    content: (
      <>
        <p>
          Some parts of The Healing Mat&apos;s service may depend on third-party
          providers, including:
        </p>
        <ul>
          <li>Payment providers</li>
          <li>OTP/authentication services</li>
          <li>Communication services</li>
          <li>Hosting or technology providers</li>
          <li>Other services required to operate the website</li>
        </ul>
        <p>
          THM is not responsible for independent failures or policies of
          third-party services, although we will take reasonable steps to address
          issues affecting our service where possible.
        </p>
      </>
    ),
  },
  {
    id: "service-changes",
    title: "17. Changes to the Service",
    content: (
      <>
        <p>
          The Healing Mat may improve, modify or update its website and services
          from time to time.
        </p>
        <p>This may include changes to:</p>
        <ul>
          <li>Daily Class schedules</li>
          <li>Class topics</li>
          <li>Trainers</li>
          <li>Programs</li>
          <li>Website features</li>
          <li>Resources</li>
          <li>Membership offerings</li>
        </ul>
        <p>
          We will make reasonable efforts to ensure that material changes do not
          unfairly deprive a customer of the service they have purchased.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "18. Privacy",
    content: (
      <>
        <p>
          Your personal information is handled in accordance with our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>The Privacy Policy explains:</p>
        <ul>
          <li>What information we collect</li>
          <li>Why we collect it</li>
          <li>How we use it</li>
          <li>When we share it</li>
          <li>Your applicable choices and rights</li>
        </ul>
        <p>You can view the Privacy Policy from the website footer.</p>
      </>
    ),
  },
  {
    id: "health-safety",
    title: "19. Health & Safety Information",
    content: (
      <>
        <p>
          The detailed Health &amp; Safety guidance available on our website
          forms an important part of your understanding of how to participate
          safely.
        </p>
        <p>
          Please read it before beginning a physical practice.
        </p>
        <p>
          However, the{" "}
          <Link href="/health-and-safety">Health &amp; Safety page</Link> does
          not replace professional medical advice.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "20. No Guarantee of Continuous Availability",
    content: (
      <>
        <p>
          We aim to keep The Healing Mat services available and reliable.
        </p>
        <p>However, temporary interruptions may occur because of:</p>
        <ul>
          <li>Technical problems</li>
          <li>Internet or hosting failures</li>
          <li>Maintenance</li>
          <li>Third-party service failures</li>
          <li>Events outside our reasonable control</li>
        </ul>
        <p>
          We will make reasonable efforts to restore affected services where
          possible.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "21. Limitation of Liability",
    content: (
      <>
        <p>
          To the extent permitted by applicable law, The Healing Mat will not be
          responsible for indirect, incidental, special or consequential loss
          arising from your use of the website or services.
        </p>
        <p>
          The Healing Mat&apos;s liability, where legally permitted to be limited,
          will be subject to applicable law and the circumstances of the claim.
        </p>
        <p>
          Nothing in these Terms is intended to exclude or limit liability that
          cannot legally be excluded or limited.
        </p>
        <p className="text-[13px] italic text-[#5f6f64]">
          The final wording of this section must be reviewed and approved by a
          qualified lawyer.
        </p>
      </>
    ),
  },
  {
    id: "terms-changes",
    title: "22. Changes to These Terms",
    content: (
      <>
        <p>We may update these Terms from time to time.</p>
        <p>
          When we make significant changes, we may provide appropriate notice
          through the website or other suitable communication.
        </p>
        <p>
          The updated Terms will be published on this page with the revised Last
          Updated date.
        </p>
        <p>
          Your continued use of the services after the effective date of updated
          Terms will be subject to the updated Terms, to the extent permitted by
          applicable law.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "23. Governing Law",
    content: (
      <>
        <p>These Terms will be governed by the applicable laws of India.</p>
        <p>
          The appropriate jurisdiction and dispute-resolution provisions will be
          confirmed by The Healing Mat&apos;s legal counsel.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "24. Contact Us",
    content: (
      <>
        <p>
          If you have questions about these Terms, your membership or our
          services, please contact:
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

export function TermsAndConditionsContent() {
  return (
    <LegalDocumentPage
      title="Terms & Conditions"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>Welcome to The Healing Mat.</p>
          <p>
            These Terms &amp; Conditions govern your use of The Healing Mat
            website, account, Free Trial and paid membership.
          </p>
          <p>
            By creating an account, registering for a Free Trial or purchasing a
            membership, you agree to these Terms &amp; Conditions.
          </p>
          <p>
            If you do not agree with these Terms, please do not use the services.
          </p>
        </>
      }
      sections={sections}
      afterSections={
        <>
          <div className="mt-10 rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] px-5 py-5 sm:px-6">
            <h2 className="font-serif text-[1.15rem] font-bold text-[#1f6b3a] sm:text-[1.25rem]">
              Before You Purchase
            </h2>
            <p className="mt-3">
              When you create an account or purchase a membership, you will be
              asked to confirm your acceptance of these Terms.
            </p>
            <p className="mt-3 font-medium text-[#3d4a3c]">
              ☐ I agree to the Terms &amp; Conditions.
            </p>
            <p className="mt-2 text-[13px] text-[#5f6f64]">
              The checkbox must be unticked by default. The user must actively
              select it before completing the applicable registration or purchase
              step.
            </p>
          </div>

          <div className="mt-8 rounded-[18px] border border-[#e6ebe3] px-5 py-5 sm:px-6">
            <h2 className="font-serif text-[1.15rem] font-bold text-[#1f6b3a] sm:text-[1.25rem]">
              Important
            </h2>
            <p className="mt-3">
              These Terms are a V1 working draft prepared for legal review.
            </p>
            <p className="mt-3">
              They should be reviewed by a qualified lawyer before publication,
              particularly for:
            </p>
            <ul>
              <li>Consumer protection requirements</li>
              <li>Digital personal-data requirements</li>
              <li>Health/wellness liability</li>
              <li>Refund and cancellation provisions</li>
              <li>Liability limitations</li>
              <li>Minor/child participation</li>
              <li>Jurisdiction and dispute resolution</li>
              <li>Enforceability of the account/content provisions</li>
            </ul>
          </div>
        </>
      }
    />
  );
}
