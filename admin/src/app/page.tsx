import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e5de] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#6d8474]">
          The Healing Mat
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.15] tracking-tight text-[#1f2a24] sm:text-[2.125rem]">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-[#5c6b5d]">
          Sign in with your admin email and password.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
