"use client";

import { useEffect } from "react";
import {
  emptyMemberAccess,
  daypartYogaMessage,
  greetingForName,
  mapMembershipAccess,
  membershipStatusLabel,
  type MemberAccess,
  type MemberAccessState,
} from "@/lib/member-access-model";
import { sessionStore, useSessionAccess } from "@/lib/session-store";

export type { MemberAccess, MemberAccessState };
export {
  emptyMemberAccess,
  daypartYogaMessage,
  greetingForName,
  mapMembershipAccess,
  membershipStatusLabel,
};

export function clearMemberAccessCache() {
  sessionStore.invalidateAccess();
}

export function useMemberAccess() {
  const { access, ready } = useSessionAccess();

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    void sessionStore.ensureAccess().finally(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  return { access, loading: !ready };
}
