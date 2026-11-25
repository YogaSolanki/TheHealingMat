import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/app-shell";
import { AuthModalProvider } from "@/components/auth-modal-provider";
import { PageTransition } from "@/components/page-transition";
import "./globals.css";

const GTM_ID = "GTM-NBVJ7VS6";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thehealingmat.yoga"),
  title: "The Healing Mat | Daily Yoga for Better Health",
  description:
    "Simple Yoga. Consistent Guidance. Real Results Daily yoga sessions for all age groups and experience levels.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col items-center bg-white text-[#243028]"
        suppressHydrationWarning
      >
        <Script id="gtm-datalayer" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        `}</Script>
        <Script
          src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
          strategy="afterInteractive"
        />
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <AuthModalProvider>
          <div className="site-shell flex min-h-full w-full flex-1 flex-col bg-[#FBF9F5]">
            <AppShell>
              <PageTransition>{children}</PageTransition>
            </AppShell>
          </div>
        </AuthModalProvider>
      </body>
    </html>
  );
}
