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
    id: "general-disclaimer",
    title: "1. General Disclaimer",
    content: (
      <>
        <p>
          The Healing Mat provides online yoga, movement, stretching, breathing,
          relaxation and wellness sessions intended to support general health and
          wellbeing.
        </p>
        <p>
          Our services, classes, videos, articles and other resources are for
          general wellness purposes only. They are not a substitute for
          professional medical advice, diagnosis or treatment.
        </p>
        <p>
          The information provided through The Healing Mat should not be
          interpreted as a medical prescription or as a guarantee of any
          particular health outcome.
        </p>
      </>
    ),
  },
  {
    id: "consult-healthcare",
    title: "2. Consult a Healthcare Professional",
    content: (
      <>
        <p>
          We recommend consulting a qualified healthcare professional before
          starting our sessions, particularly if you:
        </p>
        <ul>
          <li>
            Have a medical condition, including diabetes, heart disease, high or
            low blood pressure, or a respiratory condition.
          </li>
          <li>
            Have an injury, persistent pain, balance difficulties or a condition
            affecting your ability to exercise.
          </li>
          <li>Are pregnant or have recently given birth.</li>
          <li>
            Have recently undergone surgery or are recovering from an illness.
          </li>
          <li>
            Have been advised to restrict or modify your physical activity.
          </li>
          <li>
            Are unsure whether yoga or a particular exercise is suitable for you.
          </li>
        </ul>
        <p>
          Do not stop, change or delay prescribed medication or medical treatment
          based on information provided through The Healing Mat.
        </p>
      </>
    ),
  },
  {
    id: "online-classes",
    title: "3. Online Classes and Limited Supervision",
    content: (
      <>
        <p>
          The Healing Mat provides online classes that are primarily one-way
          demonstrations and instructions.
        </p>
        <p>
          Unless expressly stated otherwise, our instructors do not continuously
          observe participants, monitor their physical condition, assess their
          individual capabilities or correct each participant&apos;s posture and
          movements in real time.
        </p>
        <p>
          You should not assume that the instructor can see whether you are
          exercising correctly, experiencing discomfort or pushing beyond your
          limits.
        </p>
        <p>
          Our sessions are designed to offer general guidance to adults with
          different levels of ability. However, not every exercise or variation
          will be suitable for every person.
        </p>
      </>
    ),
  },
  {
    id: "choose-exercises",
    title: "4. Choose Exercises Suitable for You",
    content: (
      <>
        <p>
          Some sessions may demonstrate easier versions, modifications or
          alternative movements.
        </p>
        <p>
          You are responsible for choosing the version that suits your strength,
          flexibility, balance, health and physical ability.
        </p>
        <ul>
          <li>Start gently and progress at your own pace.</li>
          <li>
            Do not force a stretch or attempt a difficult movement simply to keep
            up with the instructor.
          </li>
          <li>Take breaks whenever necessary.</li>
          <li>
            Use a stable chair, wall or other suitable support where appropriate.
          </li>
          <li>
            Skip any movement that you are unsure about or cannot perform
            comfortably.
          </li>
          <li>
            Do not continue exercising when you feel exhausted, unwell or
            uncomfortable.
          </li>
        </ul>
        <p>
          If you are unsure whether an exercise is appropriate for you, do not
          attempt it until you have obtained suitable professional advice.
        </p>
      </>
    ),
  },
  {
    id: "risks",
    title: "5. Risks Associated with Physical Activity",
    content: (
      <>
        <p>
          Like other physical activities, yoga involves certain risks, which may
          include muscle strain, falls, aggravation of an existing condition,
          injury or other adverse health events.
        </p>
        <p>
          In some circumstances, strenuous physical activity may contribute to a
          serious medical emergency, particularly where an underlying health
          condition is present.
        </p>
        <p>
          You are responsible for assessing your readiness to exercise, following
          appropriate safety precautions and participating within your abilities.
        </p>
        <p>
          Participation in a THM session does not guarantee that an activity will
          be free from risk.
        </p>
      </>
    ),
  },
  {
    id: "stop-if-unwell",
    title: "6. Stop if You Feel Unwell",
    content: (
      <>
        <p>
          Stop exercising immediately if you experience pain, dizziness, unusual
          breathlessness, chest discomfort, weakness, nausea or any other
          concerning symptom.
        </p>
        <p>
          Do not resume until it is safe to do so. Seek advice from a qualified
          healthcare professional where appropriate.
        </p>
        <p>
          If you experience severe or potentially life-threatening symptoms, seek
          emergency medical assistance immediately.
        </p>
      </>
    ),
  },
  {
    id: "no-guaranteed-outcomes",
    title: "7. No Guaranteed Health Outcomes",
    content: (
      <>
        <p>
          People respond differently to yoga and physical activity. Results may
          vary depending on individual health, physical ability, consistency,
          lifestyle and other circumstances.
        </p>
        <p>The Healing Mat does not guarantee:</p>
        <ul>
          <li>Weight loss or a particular body shape.</li>
          <li>A cure, reversal or prevention of any disease.</li>
          <li>Relief from pain or improvement in a medical condition.</li>
          <li>A particular level of flexibility, strength or fitness.</li>
          <li>Any specific physical or mental health outcome.</li>
        </ul>
        <p>
          Our services are intended to support general wellness and should not be
          considered a replacement for medical care or an individually prescribed
          treatment programme.
        </p>
      </>
    ),
  },
  {
    id: "limitation-of-responsibility",
    title: "8. Limitation of Responsibility",
    content: (
      <>
        <p>
          To the extent permitted by applicable law, The Healing Mat is not
          responsible for injury, loss or harm arising from a participant&apos;s
          failure to follow safety guidance, selection of exercises beyond their
          ability, overexertion, failure to stop when experiencing concerning
          symptoms, or failure to seek appropriate medical advice.
        </p>
        <p>
          The Healing Mat does not provide individually supervised medical or
          exercise consultations unless expressly stated otherwise.
        </p>
        <p>
          Nothing in this Disclaimer excludes or limits any liability, duty,
          right or remedy that cannot lawfully be excluded or limited under
          applicable law.
        </p>
      </>
    ),
  },
  {
    id: "read-alongside",
    title: "9. Read Alongside Our Terms & Conditions",
    content: (
      <>
        <p>
          This Disclaimer should be read alongside The Healing Mat&apos;s{" "}
          <Link href="/terms">Terms &amp; Conditions</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          In the event of any inconsistency, the applicable Terms &amp;
          Conditions and relevant legal requirements will govern to the extent
          permitted by law.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "10. Contact Us",
    content: (
      <>
        <p>
          If you have questions about this Disclaimer or our services, please
          contact us.
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
            Website:{" "}
            <a
              href="https://www.thehealingmat.yoga"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold"
            >
              https://www.thehealingmat.yoga
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

export function HealthAndSafetyContent() {
  return (
    <LegalDocumentPage
      title="Disclaimer"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          This Disclaimer explains important health, safety and wellness
          information about participating in The Healing Mat sessions and using
          our resources.
        </p>
      }
      sections={sections}
    />
  );
}
