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

const sections: LegalDocumentSection[] = [
  {
    id: "not-medical-treatment",
    title: "1. The Healing Mat Is Not Medical Treatment",
    content: (
      <>
        <p>
          The Healing Mat provides yoga, movement, relaxation and wellness
          practices for general health and wellbeing.
        </p>
        <p>
          Our classes, programs, videos, guides and other resources are not
          medical advice, diagnosis or treatment.
        </p>
        <p>We do not claim that yoga or any THM program can:</p>
        <ul>
          <li>Diagnose a disease or medical condition</li>
          <li>Cure a disease or medical condition</li>
          <li>Replace medical treatment</li>
          <li>Replace medication prescribed by your doctor</li>
          <li>Guarantee a particular health outcome</li>
        </ul>
        <p>
          If you have a medical concern, please consult an appropriately
          qualified healthcare professional.
        </p>
      </>
    ),
  },
  {
    id: "know-your-health",
    title: "2. Know Your Own Health",
    content: (
      <>
        <p>
          Before beginning any physical activity, consider whether the activity
          is appropriate for your current health and fitness level.
        </p>
        <p>Please take additional care if you:</p>
        <ul>
          <li>Have a medical condition</li>
          <li>Have an injury or ongoing pain</li>
          <li>Have recently had surgery</li>
          <li>Are pregnant or have recently given birth</li>
          <li>Have been advised to restrict physical activity</li>
          <li>Are recovering from an illness or injury</li>
          <li>
            Have any other concern about whether yoga or exercise is suitable for
            you
          </li>
        </ul>
        <p>
          When in doubt, speak with your doctor or another appropriately
          qualified healthcare professional before participating.
        </p>
      </>
    ),
  },
  {
    id: "practise-within-ability",
    title: "3. Practise Within Your Ability",
    content: (
      <>
        <p>
          Our Daily Classes may include different levels and types of movement.
        </p>
        <p>You should:</p>
        <ul>
          <li>Follow the instructions at your own comfortable pace</li>
          <li>Avoid forcing a movement</li>
          <li>Modify or skip an exercise if necessary</li>
          <li>Take breaks when you need them</li>
          <li>Practise in a safe and suitable space</li>
          <li>Keep enough room around you to move safely</li>
        </ul>
        <p>You do not need to complete every movement.</p>
        <p>Yoga is not a competition.</p>
      </>
    ),
  },
  {
    id: "stop-if-not-right",
    title: "4. Stop If Something Does Not Feel Right",
    content: (
      <>
        <p>If you experience:</p>
        <ul>
          <li>Sharp or unusual pain</li>
          <li>Dizziness</li>
          <li>Difficulty breathing</li>
          <li>Chest pain</li>
          <li>Feeling faint</li>
          <li>Significant discomfort</li>
          <li>Any other concerning symptom</li>
        </ul>
        <p>
          stop the activity and seek appropriate medical attention if necessary.
        </p>
        <p>Do not continue simply because the class is still in progress.</p>
      </>
    ),
  },
  {
    id: "older-adults-beginners",
    title: "5. Special Care for Older Adults and Beginners",
    content: (
      <>
        <p>
          The Healing Mat welcomes beginners and people of different ages and
          fitness levels.
        </p>
        <p>
          However, being a beginner or older adult does not mean that every
          exercise is suitable for everyone.
        </p>
        <p>
          Start gradually and choose movements appropriate to your ability.
        </p>
        <p>
          If you have concerns about your health or physical limitations, consult
          an appropriate healthcare professional before beginning.
        </p>
      </>
    ),
  },
  {
    id: "therapeutic-programs",
    title: "6. Therapeutic & Health-Related Programs",
    content: (
      <>
        <p>Some THM content may focus on areas such as:</p>
        <ul>
          <li>Back comfort</li>
          <li>Stress management</li>
          <li>Flexibility</li>
          <li>Mobility</li>
          <li>Healthy ageing</li>
          <li>Relaxation</li>
          <li>Lifestyle wellbeing</li>
        </ul>
        <p>These programs are intended to support general wellbeing.</p>
        <p>
          The word &ldquo;therapeutic&rdquo; or similar health-related terminology
          does not mean that The Healing Mat is providing medical treatment or
          guaranteeing a medical result.
        </p>
      </>
    ),
  },
  {
    id: "individual-results",
    title: "7. Individual Results May Vary",
    content: (
      <>
        <p>People respond differently to yoga and physical activity.</p>
        <p>The Healing Mat does not guarantee:</p>
        <ul>
          <li>Weight loss</li>
          <li>Pain relief</li>
          <li>Increased flexibility</li>
          <li>Improvement in a medical condition</li>
          <li>Any particular physical or mental health result</li>
        </ul>
        <p>
          Consistency, individual circumstances, health status and many other
          factors can affect results.
        </p>
      </>
    ),
  },
  {
    id: "emergency",
    title: "8. Emergency Situations",
    content: (
      <>
        <p>
          The Healing Mat&apos;s classes and support channels are not intended to
          provide emergency medical assistance.
        </p>
        <p>
          If you experience a medical emergency, stop the activity and contact
          the appropriate emergency or medical service.
        </p>
      </>
    ),
  },
  {
    id: "your-responsibility",
    title: "9. Your Responsibility",
    content: (
      <>
        <p>
          By participating in The Healing Mat&apos;s Daily Classes and wellness
          activities, you are responsible for:
        </p>
        <ul>
          <li>Providing accurate information when it is requested</li>
          <li>Considering your own health and limitations</li>
          <li>Following appropriate safety precautions</li>
          <li>Practising within your ability</li>
          <li>Seeking professional medical advice where appropriate</li>
        </ul>
        <p>
          The Healing Mat will take reasonable steps to provide its services
          responsibly, but participation in physical activity always carries some
          inherent risk.
        </p>
        <p>
          Nothing on this page or elsewhere on the website should be interpreted
          as a guarantee that an injury or adverse health event cannot occur.
        </p>
      </>
    ),
  },
  {
    id: "questions",
    title: "10. Questions Before You Start?",
    content: (
      <>
        <p>
          If you are unsure whether a particular practice is appropriate for you,
          please consult an appropriately qualified healthcare professional before
          participating.
        </p>
        <p>
          If you have a question about a THM class or program, you can contact
          us:
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

export function HealthAndSafetyContent() {
  return (
    <LegalDocumentPage
      title="Health & Safety"
      intro={
        <>
          <p className="font-semibold text-[#1f6b3a]">Your health comes first.</p>
          <p>
            Yoga and movement can be an enjoyable way to support general health
            and wellbeing. However, every person&apos;s body and health
            circumstances are different.
          </p>
          <p>
            Please read these guidelines before participating in The Healing
            Mat&apos;s Daily Classes.
          </p>
        </>
      }
      sections={sections}
      afterSections={
        <div className="mt-10 rounded-[18px] border border-[#e6ebe3] px-5 py-5 sm:px-6">
          <h2 className="font-serif text-[1.15rem] font-bold text-[#1f6b3a] sm:text-[1.25rem]">
            Important
          </h2>
          <p className="mt-3">
            This page provides general health and safety guidance. The{" "}
            <Link href="/terms">Terms &amp; Conditions</Link> contain the
            contractual health and liability provisions applicable to your use of
            The Healing Mat.
          </p>
          <p className="mt-3">
            The final wording of both documents should be reviewed by a qualified
            lawyer before publication.
          </p>
        </div>
      }
    />
  );
}
