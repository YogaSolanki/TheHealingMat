"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SiteLoader } from "@/components/site-loader";
import { clearMemberAccessCache } from "@/lib/member-access";
import { getAuthMe, type PublicUser } from "@/lib/api";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";

const USER_CACHE_KEY = "thm_public_user";

let cachedUser: PublicUser | null = null;

function readStoredUser(): PublicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

function writeStoredUser(user: PublicUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.sessionStorage.removeItem(USER_CACHE_KEY);
    return;
  }
  window.sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

export function clearMemberAuthCache() {
  cachedUser = null;
  writeStoredUser(null);
  clearMemberAccessCache();
}

export function updateMemberAuthCache(user: PublicUser) {
  cachedUser = user;
  writeStoredUser(user);
}

type MemberAuthGateProps = {
  children: (props: { user: PublicUser; signOut: () => void }) => ReactNode;
  loadingLabel?: string;
};

export function MemberAuthGate({
  children,
  loadingLabel = "Loading",
}: MemberAuthGateProps) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(() => {
    if (cachedUser) return cachedUser;
    const stored = readStoredUser();
    if (stored) cachedUser = stored;
    return stored;
  });
  const [bootstrapping, setBootstrapping] = useState(() => !cachedUser);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      clearMemberAuthCache();
      setUser(null);
      setBootstrapping(false);
      router.replace("/?auth=login");
      return;
    }

    const stored = cachedUser ?? readStoredUser();
    if (stored) {
      cachedUser = stored;
      setUser(stored);
      setBootstrapping(false);
    }

    getAuthMe(token)
      .then((me) => {
        updateMemberAuthCache(me);
        setUser(me);
        setBootstrapping(false);
      })
      .catch(() => {
        clearMemberAuthCache();
        clearStoredToken();
        setUser(null);
        setBootstrapping(false);
        router.replace("/?auth=login");
      });
  }, [router]);

  function signOut() {
    clearMemberAuthCache();
    clearStoredToken();
    router.replace("/");
  }

  if (bootstrapping || !user) {
    return (
      <main className="min-h-screen bg-[#FBF9F5]">
        <SiteLoader variant="page" pageClassName="min-h-screen" label={loadingLabel} />
      </main>
    );
  }

  return <>{children({ user, signOut })}</>;
}
