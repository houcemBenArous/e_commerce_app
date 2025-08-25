"use client";

import Link from "next/link";
import { useState } from "react";
import { API_BASE } from "../../../lib/config";

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const nextErrors: typeof errors = {};
    if (!validateEmail(email)) nextErrors.email = "Enter a valid email";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      // Always pretend success to avoid user enumeration
      if (!res.ok) {
        // best-effort parse but ignore message to keep generic UX
        await res.json().catch(() => ({}));
      }
      setMessage("If an account exists for this email, we sent a reset link.");
    } catch {
      setMessage("If an account exists for this email, we sent a reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Remembered it?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-foreground text-background px-4 py-2 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        >
          {submitting ? "Sending..." : "Send reset link"}
        </button>

        {message && (
          <p className="text-sm text-green-600" role="status">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
