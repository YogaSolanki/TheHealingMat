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

const sections: LegalDocumentSection[] = [
  {
    id: "about",
    title: "1. About This Policy",
    content: (
      <>
        <p>
          The Healing Mat (&quot;THM&quot;, &quot;we&quot;, &quot;our&quot; or
          &quot;us&quot;) uses cookies and similar browser technologies to help
          our website function, support member access and enable certain
          third-party services.
        </p>
        <p>
          This Cookie Policy explains what these technologies are, how they may
          be used on our website, and what choices you have.
        </p>
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
      </>
    ),
  },
  {
    id: "what-are-cookies",
    title: "2. What Are Cookies and Similar Technologies?",
    content: (
      <>
        <p>
          Cookies are small text files that websites may store in your browser or
          on your device.
        </p>
        <p>
          Similar technologies include local storage, which allows a website to
          store information in your browser. These technologies can support
          functions such as keeping you logged in, remembering preferences and
          enabling third-party services.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How The Healing Mat Uses These Technologies",
    content: (
      <>
        <p>
          We may use cookies or similar technologies for the following purposes:
        </p>
        <p className="font-semibold text-[#1f6b3a]">
          A. Essential Website Functionality
        </p>
        <p>
          Our website uses browser storage, including local storage, to support
          login and member access.
        </p>
        <p>
          These technologies help the website function and allow members to
          access the services associated with their accounts.
        </p>
        <p className="font-semibold text-[#1f6b3a]">B. Payments</p>
        <p>
          When you make a payment through Razorpay Checkout, Razorpay may use
          cookies or similar technologies to support payment processing, security
          and related functions.
        </p>
        <p>
          The use of these technologies by Razorpay is subject to its own
          policies and practices.
        </p>
        <p className="font-semibold text-[#1f6b3a]">C. Embedded Videos</p>
        <p>
          Some pages may contain videos embedded from YouTube. When you access or
          play embedded content, YouTube or Google may use cookies or similar
          technologies in accordance with their own policies and settings.
        </p>
        <p className="font-semibold text-[#1f6b3a]">
          D. Analytics and Advertising
        </p>
        <p>
          As of the date of this policy, The Healing Mat does not use its own
          Google Analytics or Meta Pixel tracking scripts on the website.
        </p>
        <p>
          If we introduce analytics, advertising or other non-essential tracking
          technologies in the future, we will update this policy and implement
          any consent or choice mechanism required by applicable law before
          activating such technologies where consent is required.
        </p>
      </>
    ),
  },
  {
    id: "cookies-we-use",
    title: "4. Cookies and Browser Storage We Use",
    content: (
      <>
        <p>
          The technologies used may vary depending on the page you visit and the
          services you access.
        </p>
        <p>
          The Healing Mat does not currently maintain a separate list of every
          cookie that may be set by third-party services. The exact cookies and
          their duration may depend on the relevant provider, your browser and
          the features you use.
        </p>
      </>
    ),
  },
  {
    id: "your-choices",
    title: "5. Your Choices",
    content: (
      <>
        <p>
          You can manage cookies through your browser settings. Depending on your
          browser, you may be able to block cookies, delete stored cookies or
          clear other website data.
        </p>
        <p>Please note:</p>
        <ul>
          <li>
            Blocking or clearing essential browser storage may affect login and
            member access.
          </li>
          <li>
            Removing stored website data may require you to log in again.
          </li>
          <li>
            Third-party services, including Razorpay and YouTube, may provide
            their own privacy and cookie controls.
          </li>
          <li>
            Browser settings may not provide the same controls for every type of
            storage technology.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "third-party",
    title: "6. Third-Party Services",
    content: (
      <>
        <p>
          Our website may use third-party services to support payments,
          communications, hosting and embedded content.
        </p>
        <p>
          These providers may process technical information or use their own
          cookies and similar technologies when you interact with their services.
          Their practices are governed by their respective privacy policies.
        </p>
        <p>
          We encourage you to review the relevant provider&apos;s privacy
          information when using those services.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "7. Changes to This Policy",
    content: (
      <>
        <p>
          We may update this Cookie Policy when our website, technologies or
          legal obligations change.
        </p>
        <p>
          The latest version will be published on our website with its updated
          date.
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
          If you have questions about this Cookie Policy or our use of cookies
          and similar technologies, contact us:
        </p>
        <p className="font-semibold text-[#1f6b3a]">The Healing Mat</p>
        <ul className="list-none pl-0">
          <li>Contact Person: Pradeep Singh Solanki, Partner</li>
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
            Address:{" "}
            <span className="font-semibold">
              GC 51, 5th Floor, Aditya Gold Crest, Vaibhav Khand, Indirapuram,
              Ghaziabad, Uttar Pradesh 201014, India
            </span>
          </li>
        </ul>
      </>
    ),
  },
];

export function CookiePolicyContent() {
  return (
    <LegalDocumentPage
      title="Cookie Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          This Cookie Policy explains how The Healing Mat uses cookies and
          similar technologies on our website, and the choices available to you.
        </p>
      }
      sections={sections}
    />
  );
}
