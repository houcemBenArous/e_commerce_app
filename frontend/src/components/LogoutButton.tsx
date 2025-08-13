"use client";

import { useRouter } from "next/navigation";
import { clearTokens, getAccessToken } from "../lib/auth";
import { API_BASE } from "../lib/config";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        const at = getAccessToken();
        if (at) {
          fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${at}` },
          }).catch(() => {});
        }
        clearTokens();
        router.replace("/login");
      }}
      className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
    >
      Logout
    </button>
  );
}
