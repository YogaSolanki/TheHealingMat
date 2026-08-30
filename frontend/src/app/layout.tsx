import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Healing Mat | Everyday Health For Every Body",
  description:
    "Simple yoga. Consistent guidance. Real results. Daily yoga sessions for all age groups and experience levels.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-[#243028]">
        <SiteHeader />
        <div className="flex-1">
          <PageTransition>{children}</PageTransition>
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
