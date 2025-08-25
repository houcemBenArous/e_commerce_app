"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { API_BASE } from "../../../lib/config";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const resetId = useMemo(() => sp.get("resetId") || "", [sp]);
  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; link?: string }>({});
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const linkInvalid = !resetId || !token;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const nextErrors: typeof errors = {};
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (confirm !== password) nextErrors.confirm = "Passwords do not match";
    if (linkInvalid) nextErrors.link = "Invalid or missing reset link";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetId, token, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Invalid or expired reset link");
      }
      setMessage("Password reset successful. You can now sign in.");
    } catch (err: any) {
      setMessage(err?.message || "Invalid or expired reset link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Already know your password?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>

      {linkInvalid && (
        <p className="text-sm text-red-600 mb-4">Invalid or missing reset link.</p>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby="password-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors.confirm}
            aria-describedby="confirm-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {errors.confirm && (
            <p id="confirm-error" className="text-sm text-red-600">
              {errors.confirm}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || linkInvalid}
          className="w-full rounded-xl bg-foreground text-background px-4 py-2 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        >
          {submitting ? "Resetting..." : "Reset password"}
        </button>

        {message && (
          <div className="space-y-2">
            <p className="text-sm text-green-600" role="status">{message}</p>
            <Link href="/login" className="text-sm text-indigo-600 hover:underline">Go to sign in</Link>
          </div>
        )}
      </form>
    </div>
  );
}
