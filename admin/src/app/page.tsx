import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <RedirectIfSignedIn />
      <div className="w-full max-w-md rounded-2xl border border-[#e6ebe3] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#1f6b3a]">
          The Healing Mat
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.15] tracking-tight text-[#243028] sm:text-[2.125rem]">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-[#5f6f64]">
          Sign in with your admin email and password.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
