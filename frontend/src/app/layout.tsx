import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { AuthModalProvider } from "@/components/auth-modal-provider";
import { PageTransition } from "@/components/page-transition";
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
      <body className="flex min-h-full flex-col items-center bg-white text-[#243028]">
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
