"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { attemptRefresh, decodeJwt, routeForRoles } from "../../../lib/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await attemptRefresh();
      if (!token) {
        router.replace("/login?error=oauth_failed");
        return;
      }
      const payload = decodeJwt<{ roles?: string[] }>(token);
      const dest = routeForRoles(payload?.roles);
      router.replace(dest);
    })();
  }, [router]);

  return (
    <div className="p-6 text-sm text-neutral-500">Finalizing sign-in…</div>
  );
}
