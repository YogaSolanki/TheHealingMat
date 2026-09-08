"use client";

import { useEffect, useState } from "react";
import {
  emptyMemberAccess,
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
  greetingForName,
  mapMembershipAccess,
  membershipStatusLabel,
};

export function clearMemberAccessCache() {
  sessionStore.invalidateAccess();
}

export function useMemberAccess() {
  const { access, ready } = useSessionAccess();
  const [loading, setLoading] = useState(!ready);

  useEffect(() => {
    if (ready) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void sessionStore.ensureAccess().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  return { access, loading: loading && !ready };
}
