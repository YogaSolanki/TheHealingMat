"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteLoader } from "@/components/site-loader";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
import { resolveAccessLink } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

export default function PersonalAccessPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Access link not found.");
      return;
    }

    let cancelled = false;

    resolveAccessLink(slug)
      .then(() => {
        if (cancelled) return;
        if (getStoredToken()) {
          router.replace("/dashboard");
          return;
        }
        router.replace(`/?auth=login&next=${encodeURIComponent(`/u/${slug}`)}`);
      })
      .catch(() => {
        if (!cancelled) setError("Access link not found.");
      });

    return () => {
      cancelled = true;
    };
  }, [router, slug]);

  if (error) {
    return (
      <div className="w-full bg-[#FBF9F5]">
        <div className="mx-auto w-full max-w-[560px] px-4 py-12 sm:px-6">
          <h1 className="font-serif text-[1.75rem] font-bold text-[#243028]">
            Access link not found
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64]">
            This Personal THM Access Link is not valid. Sign in to open your Member Area.
          </p>
          <Link href="/?auth=login" className={`${memberPrimaryBtnClass} mt-6 px-5 py-3 text-[14px]`}>
            Member Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[50vh] bg-[#FBF9F5]">
      <SiteLoader variant="page" label="Opening your access" />
    </main>
  );
}
