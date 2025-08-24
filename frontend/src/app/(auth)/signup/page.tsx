"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../../lib/config";
import { COUNTRIES } from "../../../lib/countries";

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    password?: string;
    confirmPassword?: string;
    agree?: string;
  }>({});
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!validateEmail(email)) nextErrors.email = "Enter a valid email";
    if (!phone.trim()) nextErrors.phone = "Phone number is required";
    if (!addressLine1.trim()) nextErrors.addressLine1 = "Address Line 1 is required";
    if (!city.trim()) nextErrors.city = "City is required";
    if (!stateRegion.trim()) nextErrors.state = "State/Province/Region is required";
    if (!postalCode.trim()) nextErrors.postalCode = "Postal/ZIP code is required";
    if (!country.trim()) nextErrors.country = "Country is required";
    if (password.length < 8)
      nextErrors.password = "Password must be at least 8 characters";
    if (confirmPassword !== password)
      nextErrors.confirmPassword = "Passwords do not match";
    if (!agree) nextErrors.agree = "You must accept the terms";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state: stateRegion,
          postalCode,
          country,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to initiate signup");
      }
      const data = (await res.json()) as { verificationId: string; email: string; expiresAt?: string; ttlSec?: number };
      const exp = data.expiresAt ? `&exp=${encodeURIComponent(data.expiresAt)}` : "";
      router.push(`/verify?id=${encodeURIComponent(data.verificationId)}&email=${encodeURIComponent(data.email)}&source=local${exp}`);
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Already have an account? {" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby="name-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Jane Doe"
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

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

        {/* Phone */}
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={!!errors.phone}
            aria-describedby="phone-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="+1 555 123 4567"
          />
          {errors.phone && (
            <p id="phone-error" className="text-sm text-red-600">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <label htmlFor="country" className="text-sm font-medium">
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-invalid={!!errors.country}
            aria-describedby="country-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white text-neutral-900 dark:bg-white dark:text-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            autoComplete="country-name"
            style={{ colorScheme: "light" }}
          >
            <option value="" className="text-neutral-500" disabled>
              Select a country
            </option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c} className="text-neutral-900">
                {c}
              </option>
            ))}
          </select>
          {errors.country && (
            <p id="country-error" className="text-sm text-red-600">
              {errors.country}
            </p>
          )}
        </div>

        {/* Address Line 1 */}
        <div className="space-y-2">
          <label htmlFor="addressLine1" className="text-sm font-medium">
            Street address (Line 1)
          </label>
          <input
            id="addressLine1"
            type="text"
            autoComplete="address-line1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            aria-invalid={!!errors.addressLine1}
            aria-describedby="addressLine1-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="123 Main St"
          />
          {errors.addressLine1 && (
            <p id="addressLine1-error" className="text-sm text-red-600">
              {errors.addressLine1}
            </p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="space-y-2">
          <label htmlFor="addressLine2" className="text-sm font-medium">
            Street address (Line 2)
          </label>
          <input
            id="addressLine2"
            type="text"
            autoComplete="address-line2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            aria-invalid={!!errors.addressLine2}
            aria-describedby="addressLine2-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Apt, suite, unit, etc. (optional)"
          />
          {errors.addressLine2 && (
            <p id="addressLine2-error" className="text-sm text-red-600">
              {errors.addressLine2}
            </p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium">
            City
          </label>
          <input
            id="city"
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-invalid={!!errors.city}
            aria-describedby="city-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="San Francisco"
          />
          {errors.city && (
            <p id="city-error" className="text-sm text-red-600">
              {errors.city}
            </p>
          )}
        </div>

        {/* State/Province/Region */}
        <div className="space-y-2">
          <label htmlFor="state" className="text-sm font-medium">
            State/Province/Region
          </label>
          <input
            id="state"
            type="text"
            autoComplete="address-level1"
            value={stateRegion}
            onChange={(e) => setStateRegion(e.target.value)}
            aria-invalid={!!errors.state}
            aria-describedby="state-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="CA"
          />
          {errors.state && (
            <p id="state-error" className="text-sm text-red-600">
              {errors.state}
            </p>
          )}
        </div>

        {/* Postal code */}
        <div className="space-y-2">
          <label htmlFor="postalCode" className="text-sm font-medium">
            ZIP/Postal code
          </label>
          <input
            id="postalCode"
            type="text"
            autoComplete="postal-code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            aria-invalid={!!errors.postalCode}
            aria-describedby="postalCode-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="94107"
          />
          {errors.postalCode && (
            <p id="postalCode-error" className="text-sm text-red-600">
              {errors.postalCode}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-xs text-indigo-600 hover:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby="password-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="At least 8 characters"
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirm-password-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Re-enter your password"
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <input
            id="agree"
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 size-4 accent-indigo-600"
          />
          <label htmlFor="agree" className="text-sm text-neutral-700 dark:text-neutral-300">
            I agree to the {" "}
            <a href="#" className="text-indigo-600 hover:underline">Terms</a> and {" "}
            <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
          </label>
        </div>
        {errors.agree && (
          <p className="text-sm text-red-600">{errors.agree}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-foreground text-background px-4 py-2 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>

        {message && (
          <p className="text-sm text-green-600" role="status">
            {message}
          </p>
        )}
      </form>

      <div className="mt-6">
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/10 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-transparent px-2 text-neutral-500">or continue with</span>
          </div>
        </div>
        <a
          href={`${API_BASE}/auth/google`}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Continue with Google
        </a>
      </div>

      <p className="text-xs text-neutral-500 mt-6">
        We will never share your email. You can delete your account at any time.
      </p>
    </div>
  );
}
