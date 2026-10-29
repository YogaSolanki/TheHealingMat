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
          <li>Free trial access.</li>
          <li>Paid memberships.</li>
          <li>Daily Classes.</li>
          <li>Yoga and movement practices.</li>
          <li>Wellness programs.</li>
          <li>Health and wellness resources.</li>
          <li>Articles, videos and other material.</li>
        </ul>
        <p>
          The Healing Mat is a wellness service, not a medical service.
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
          purchasing a membership and keep your account information reasonably up
          to date.
        </p>
        <p>
          The Healing Mat&apos;s online membership service is intended for adults
          aged 18 years and above. You must be legally capable of entering into
          the applicable agreement.
        </p>
        <p>Use of the services remains subject to applicable law.</p>
      </>
    ),
  },
  {
    id: "account",
    title: "3. Your The Healing Mat Account",
    content: (
      <>
        <p>Some services require you to create an account.</p>
        <p>Your account may be associated with:</p>
        <ul>
          <li>Your name.</li>
          <li>Your registered mobile number or email address.</li>
          <li>Your personal The Healing Mat access link.</li>
          <li>Your referral code.</li>
          <li>Membership information.</li>
          <li>Transaction history.</li>
        </ul>
        <p>
          You must not knowingly provide false information or create duplicate
          accounts to misuse a free trial, referral benefit, coupon or other
          offer.
        </p>
        <p>
          You are responsible for keeping your account access secure. Do not
          share your password or OTP with anyone.
        </p>
        <p>
          If you believe someone has accessed your account without permission,
          please contact us promptly.
        </p>
      </>
    ),
  },
  {
    id: "free-trial",
    title: "4. Free Trial",
    content: (
      <>
        <p>
          The Healing Mat may offer free trials to eligible users so that they
          can experience our classes before deciding whether to purchase a
          membership.
        </p>
        <p>
          Taking a free trial is optional. You may choose whether to participate
          before purchasing a paid membership.
        </p>
        <p>
          The availability, duration, start date and other conditions of a free
          trial will be communicated through the applicable registration or trial
          information.
        </p>
        <p>
          A person who has already used a free trial is not automatically
          entitled to another trial. The Healing Mat may refuse or withdraw a
          trial where it reasonably believes that the offer is being misused.
        </p>
        <p>A free trial does not itself constitute a paid membership.</p>
      </>
    ),
  },
  {
    id: "membership",
    title: "5. Membership",
    content: (
      <>
        <p>
          A membership provides access to Daily Classes and other benefits
          included in the plan purchased by you.
        </p>
        <p>
          The membership period begins according to the membership start date
          recorded and displayed during the purchase process.
        </p>
        <p>
          Before completing your purchase, you should be able to review the
          relevant membership information, including:
        </p>
        <ul>
          <li>Plan and duration.</li>
          <li>Membership start date and end date.</li>
          <li>Price and applicable taxes or charges.</li>
          <li>Included benefits.</li>
          <li>Applicable cancellation and refund terms.</li>
        </ul>
        <p>
          A membership does not automatically renew unless The Healing Mat
          specifically offers an automatic-renewal arrangement and you expressly
          agree to it.
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
          classes may change from time to time.
        </p>
        <p>
          The Healing Mat may modify, replace or discontinue a particular class,
          program or resource where reasonably necessary. We will make reasonable
          efforts to provide the services included with your membership.
        </p>
        <p>
          We do not promise that a particular trainer, class, topic or session
          will always be available.
        </p>
      </>
    ),
  },
  {
    id: "health-safety",
    title: "7. Health, Safety and Medical Disclaimer",
    content: (
      <>
        <p className="font-semibold text-[#1f6b3a]">7.1 General Wellness Service</p>
        <p>
          The Healing Mat provides online yoga, movement, stretching, breathing,
          relaxation and wellness sessions for general health and wellbeing. Our
          services are not medical services and do not provide medical advice,
          diagnosis or treatment.
        </p>

        <p className="font-semibold text-[#1f6b3a]">
          7.2 Consult a Healthcare Professional
        </p>
        <p>
          You are advised to consult a qualified healthcare professional before
          beginning our sessions, particularly if you have a medical condition,
          heart or blood pressure concerns, diabetes, an injury, balance
          difficulties, are pregnant or have recently given birth, have recently
          undergone surgery, or have been advised to restrict physical activity.
        </p>
        <p>
          Do not stop, change or delay prescribed medical treatment or medication
          on the basis of information provided through The Healing Mat.
        </p>

        <p className="font-semibold text-[#1f6b3a]">
          7.3 One-Way Online Instruction
        </p>
        <p>
          Our sessions are delivered online and are primarily one-way
          demonstrations and instructions. Unless expressly stated otherwise, our
          instructors do not continuously observe participants, monitor their
          physical condition, assess their individual capabilities, or correct
          each participant&apos;s posture and movements in real time.
        </p>
        <p>
          We may demonstrate alternative versions or modifications of an
          exercise. However, we cannot determine which version is suitable for
          every participant. You are responsible for selecting only movements and
          variations that are appropriate for your health, strength, flexibility,
          balance and physical ability. If you are unsure whether an exercise is
          suitable for you, skip it and seek appropriate professional advice.
        </p>

        <p className="font-semibold text-[#1f6b3a]">
          7.4 Practise Safely and Within Your Ability
        </p>
        <p>
          You must participate at your own pace and avoid overexertion. Do not
          force a movement, attempt a difficult variation merely to keep up with
          the instructor, or continue exercising when you feel exhausted, unwell
          or uncomfortable.
        </p>
        <p>
          Choose the easier option, take breaks or stop whenever necessary.
          Ensure that you have a safe practice area and suitable support where
          required.
        </p>

        <p className="font-semibold text-[#1f6b3a]">
          7.5 Stop if You Experience Symptoms
        </p>
        <p>
          Stop the session immediately if you experience pain, dizziness, unusual
          breathlessness, chest discomfort, weakness, nausea or any other
          concerning symptom. Do not resume until it is safe to do so. Seek
          advice from a qualified healthcare professional where appropriate.
        </p>
        <p>
          If you experience severe or potentially life-threatening symptoms, seek
          emergency medical assistance immediately.
        </p>

        <p className="font-semibold text-[#1f6b3a]">
          7.6 Risks and Personal Responsibility
        </p>
        <p>
          Like other physical activities, yoga involves certain risks, which may
          include muscle strain, falls, aggravation of an existing condition,
          injury or other adverse health events. In some circumstances, strenuous
          physical activity may contribute to a serious medical emergency,
          particularly where an underlying health condition is present.
        </p>
        <p>
          By participating, you acknowledge that you are responsible for
          assessing your own readiness to exercise, following appropriate safety
          precautions, choosing suitable exercises and stopping when necessary.
          You should not assume that an exercise is safe for you simply because
          it is demonstrated during a THM session.
        </p>

        <p className="font-semibold text-[#1f6b3a]">
          7.7 Limitation of Responsibility
        </p>
        <p>
          To the extent permitted by applicable law, The Healing Mat is not
          responsible for injury, loss or harm arising from a participant&apos;s
          failure to follow safety guidance, selection of exercises beyond their
          ability, overexertion, failure to stop when experiencing concerning
          symptoms, or failure to seek appropriate medical advice.
        </p>
        <p>
          The Healing Mat does not guarantee that participation will be free from
          risk or that any particular health outcome will be achieved. Our
          sessions are not individually supervised medical or exercise
          consultations.
        </p>
        <p>
          Nothing in these Terms excludes or limits any liability, duty, right or
          remedy that cannot lawfully be excluded or limited under applicable
          law.
        </p>

        <p className="font-semibold text-[#1f6b3a]">7.8 No Guaranteed Results</p>
        <p>
          Individual responses to yoga and physical activity vary. The Healing
          Mat does not guarantee weight loss, cure or reversal of disease,
          prevention of medical conditions, or any specific physical or mental
          health outcome.
        </p>
      </>
    ),
  },
  {
    id: "individual-results",
    title: "8. Individual Results",
    content: (
      <>
        <p>
          People respond differently to yoga and physical activity.
        </p>
        <p>
          The Healing Mat does not guarantee weight loss, pain relief, increased
          flexibility, improvement in a medical condition, stress reduction or
          any other particular physical or mental health result.
        </p>
        <p>
          Testimonials, examples and general wellness information should not be
          understood as guarantees of your individual results.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "9. Payments",
    content: (
      <>
        <p>
          Membership prices and applicable taxes or charges will be displayed
          before payment.
        </p>
        <p>
          You are responsible for paying the amount shown during checkout.
        </p>
        <p>
          Payments may be processed through third-party payment providers,
          including Razorpay, and may also be subject to the applicable terms of
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
    title: "10. Cancellation and Refunds",
    content: (
      <>
        <p>
          Membership cancellations and refunds are governed by The Healing
          Mat&apos;s separate{" "}
          <Link href="/refund">Refund &amp; Cancellation Policy</Link>, which
          forms part of the information governing your purchase.
        </p>
        <p>
          Under the standard cancellation policy, you may request cancellation
          before your membership start date or within 3 calendar days of the
          membership start date recorded in our system.
        </p>
        <p>
          Cancellation requests are handled manually through the support channels
          specified in the Refund &amp; Cancellation Policy.
        </p>
        <p>
          Where a refund is approved, The Healing Mat will initiate it within 10
          working days, subject to the applicable payment mechanism. The time
          taken for the amount to reach your account may depend on your payment
          provider or bank.
        </p>
        <p>
          Genuine payment errors, duplicate payments, failure to activate paid
          membership access and other service-related problems may be reviewed
          individually.
        </p>
        <p>
          Nothing in these Terms or the Refund &amp; Cancellation Policy is
          intended to exclude, restrict or override consumer rights or remedies
          that cannot lawfully be excluded or restricted under applicable law.
        </p>
        <p>
          Please read the full{" "}
          <Link href="/refund">Refund &amp; Cancellation Policy</Link> before
          purchasing a membership.
        </p>
      </>
    ),
  },
  {
    id: "referrals-coupons",
    title: "11. Referrals, Coupons and Promotional Offers",
    content: (
      <>
        <p>
          The Healing Mat may offer referral benefits, coupons, discounts or
          other promotions from time to time.
        </p>
        <p>
          Each offer may have its own eligibility conditions, validity period and
          usage rules. These conditions will be communicated with the applicable
          offer.
        </p>
        <p>
          You must not misuse, manipulate or attempt to obtain unauthorised
          benefits through referral codes, coupons or promotional offers.
        </p>
        <p>
          Where a membership purchased using a referral benefit or coupon is
          cancelled or refunded, the associated benefit or reward may be affected
          in accordance with the applicable offer terms and applicable law.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "12. Acceptable Use",
    content: (
      <>
        <p>
          You agree to use The Healing Mat website and services lawfully and
          responsibly.
        </p>
        <p>You must not:</p>
        <ul>
          <li>Use the services for unlawful purposes.</li>
          <li>
            Attempt to gain unauthorised access to accounts, systems or
            restricted areas.
          </li>
          <li>Interfere with the operation or security of the website.</li>
          <li>
            Deliberately misuse free trials, referral benefits, coupons or
            promotional offers.
          </li>
          <li>
            Copy, distribute, sell or commercially exploit member-only content
            without permission.
          </li>
          <li>
            Misrepresent yourself or provide information intended to deceive The
            Healing Mat or other users.
          </li>
        </ul>
        <p>
          We may take reasonable action where we identify misuse, security risks
          or a breach of these Terms. Any action affecting paid access will be
          subject to applicable law and the circumstances involved.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "13. Website Content and Intellectual Property",
    content: (
      <>
        <p>
          Unless otherwise stated, the content provided by The Healing Mat,
          including its branding, text, videos, class materials, graphics, guides
          and other resources, is owned by or used with permission by The Healing
          Mat or the relevant rights holder.
        </p>
        <p>
          You may use the content for your own personal, non-commercial wellness
          activities in accordance with your membership and these Terms.
        </p>
        <p>
          You must not reproduce, distribute, publicly republish, sell, record
          for redistribution or commercially exploit our content without prior
          written permission, except where permitted by law.
        </p>
        <p>
          Purchasing a membership gives you access to the included services; it
          does not transfer ownership of the underlying content or intellectual
          property.
        </p>
      </>
    ),
  },
  {
    id: "personal-access-links",
    title: "14. Personal Access Links and Member Access",
    content: (
      <>
        <p>
          The Healing Mat may provide a personal access link or other means of
          accessing classes and member services.
        </p>
        <p>
          You are responsible for keeping your access details secure and must not
          knowingly share or misuse them in a way that enables unauthorised
          access to member-only services.
        </p>
        <p>
          Access is subject to your trial or membership status and the applicable
          service rules.
        </p>
        <p>
          If you believe your access link has been misused or exposed, contact us
          so that we can review the issue.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "15. Third-Party Services",
    content: (
      <>
        <p>
          The Healing Mat may rely on third-party services for payments,
          communications, website hosting, video delivery and other operational
          functions.
        </p>
        <p>
          Your use of a third-party service may be subject to that
          provider&apos;s own terms and policies.
        </p>
        <p>
          The Healing Mat is not responsible for independent failures or policies
          of third-party services. However, we will make reasonable efforts to
          address issues affecting our services where possible.
        </p>
      </>
    ),
  },
  {
    id: "service-changes",
    title: "16. Changes to the Service",
    content: (
      <>
        <p>
          The Healing Mat may improve, modify or update its website and services
          from time to time.
        </p>
        <p>Changes may include updates to:</p>
        <ul>
          <li>Daily Class schedules.</li>
          <li>Class topics and trainers.</li>
          <li>Programs and resources.</li>
          <li>Website features.</li>
          <li>Membership offerings.</li>
        </ul>
        <p>
          We will make reasonable efforts to ensure that material changes do not
          unfairly deprive a customer of the service they have purchased. Where a
          change materially affects a purchased service, we will consider the
          circumstances and applicable legal requirements.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "17. Privacy",
    content: (
      <>
        <p>
          Your personal information is handled in accordance with our separate{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          The Privacy Policy explains what information we collect, why we collect
          it, how we use it, when we share it, how long we retain it and how you
          can exercise applicable privacy rights.
        </p>
        <p>
          Please review the Privacy Policy available through our website footer.
        </p>
      </>
    ),
  },
  {
    id: "service-availability",
    title: "18. Service Availability",
    content: (
      <>
        <p>
          We aim to keep The Healing Mat&apos;s services available and reliable.
          However, temporary interruptions may occur because of technical
          problems, internet or hosting failures, maintenance, third-party
          service failures or events outside our reasonable control.
        </p>
        <p>
          We will make reasonable efforts to restore affected services where
          possible.
        </p>
        <p>
          This section does not remove any rights you may have under applicable
          law if a paid service is not provided as agreed.
        </p>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "19. Limitation of Liability",
    content: (
      <>
        <p>
          To the extent permitted by applicable law, The Healing Mat will not be
          responsible for indirect, incidental, special or consequential loss
          arising from your use of the website or services.
        </p>
        <p>
          Any limitation of liability is subject to applicable law and the
          circumstances of the claim.
        </p>
        <p>
          Nothing in these Terms is intended to exclude or limit liability or
          consumer rights that cannot lawfully be excluded or limited.
        </p>
      </>
    ),
  },
  {
    id: "terms-changes",
    title: "20. Changes to These Terms",
    content: (
      <>
        <p>
          We may update these Terms to reflect changes in our services,
          technology, business practices or legal requirements.
        </p>
        <p>
          The updated version will be published on this page with the revised
          effective or last-updated date. Where appropriate, we may also provide
          notice through the website or another suitable communication channel.
        </p>
        <p>
          Changes will apply in accordance with applicable law. We will not rely
          solely on continued use of the website to obtain consent where fresh
          consent is legally required.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "21. Governing Law and Disputes",
    content: (
      <>
        <p>These Terms are governed by the applicable laws of India.</p>
        <p>
          Disputes will be handled in accordance with applicable law. Nothing in
          these Terms prevents you from exercising any consumer rights or
          approaching a consumer forum or other competent authority where legally
          available.
        </p>
        <p>
          Any additional jurisdiction or dispute-resolution provisions will be
          subject to applicable law.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "22. Contact Us",
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
            Address: <span className="font-semibold">{CONTACT_ADDRESS}</span>
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
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>Welcome to The Healing Mat.</p>
          <p>
            These Terms &amp; Conditions govern your use of The Healing Mat
            website, account, free trial and paid membership.
          </p>
          <p>
            By creating an account, registering for a free trial or purchasing a
            membership, you agree to the applicable terms set out here. Where
            acceptance is required, you must take an affirmative action to
            indicate your agreement.
          </p>
          <p>
            If you do not agree with these Terms, please do not use the services.
          </p>
        </>
      }
      sections={sections}
      afterSections={
        <div className="mt-10 rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] px-5 py-5 sm:px-6">
          <h2 className="font-serif text-[1.15rem] font-bold text-[#1f6b3a] sm:text-[1.25rem]">
            Before You Register or Purchase
          </h2>
          <p className="mt-3">
            Please review the applicable membership details, price, start date,
            benefits and cancellation terms before completing a purchase.
          </p>
          <p className="mt-3">
            Where the website requires acceptance of these Terms, the acceptance
            checkbox must be unticked by default. You must actively select it
            before completing the applicable registration or purchase step.
          </p>
        </div>
      }
    />
  );
}
