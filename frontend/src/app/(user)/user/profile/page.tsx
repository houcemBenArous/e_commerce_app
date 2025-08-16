"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../lib/config";
import { attemptRefresh, getAccessToken } from "../../../../lib/auth";
import type { Profile } from "../../../../types/profile";
import { COUNTRIES } from "../../../../lib/countries";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [form, setForm] = useState<Partial<Profile>>({});

  const token = useMemo(() => getAccessToken(), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      let at = getAccessToken();
      if (!at) {
        at = await attemptRefresh();
        if (!at) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }
      }
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${at}` },
        credentials: "include",
      });
      if (res.status === 401) {
        const refreshed = await attemptRefresh();
        if (!refreshed) {
          setError("Session expired. Please sign in again.");
          setLoading(false);
          return;
        }
        const retry = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${refreshed}` },
          credentials: "include",
        });
        if (!retry.ok) {
          setError("Failed to load profile");
          setLoading(false);
          return;
        }
        const data = (await retry.json()) as Profile;
        setForm(data);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Failed to load profile");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as Profile;
      setForm(data);
      setLoading(false);
    };
    void load();
  }, []);

  const update = (k: keyof Profile, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    let at = getAccessToken();
    if (!at) at = await attemptRefresh();
    if (!at) {
      setSaving(false);
      setError("Not authenticated");
      return;
    }

    const payload: any = {
      name: form.name,
      phone: form.phone,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || undefined,
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      country: form.country,
    };

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${at}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        const refreshed = await attemptRefresh();
        if (!refreshed) throw new Error("Session expired. Please sign in again.");
        const retry = await fetch(`${API_BASE}/users/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshed}`,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!retry.ok) throw new Error("Failed to save profile");
        const data = (await retry.json()) as Profile;
        setForm(data);
        setSuccess("Profile updated");
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to save profile");
      const data = (await res.json()) as Profile;
      setForm(data);
      setSuccess("Profile updated");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-neutral-500">Loading profile…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <section className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Full name</label>
            <input id="name" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={form.name || ""} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" disabled className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900/50 px-3 py-2" value={form.email || ""} />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">Phone</label>
            <input id="phone" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-medium">Country</label>
            <select id="country" value={form.country || ""} onChange={(e) => update("country", e.target.value)} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white text-neutral-900 dark:bg-white dark:text-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" style={{ colorScheme: "light" }}>
              <option value="" disabled>Select a country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="text-neutral-900">{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="address1" className="text-sm font-medium">Address line 1</label>
            <input id="address1" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={form.addressLine1 || ""} onChange={(e) => update("addressLine1", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="address2" className="text-sm font-medium">Address line 2</label>
            <input id="address2" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={form.addressLine2 || ""} onChange={(e) => update("addressLine2", e.target.value)} placeholder="Apt, suite, unit (optional)" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">City</label>
              <input id="city" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={form.city || ""} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium">State/Province</label>
              <input id="state" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={form.state || ""} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="postal" className="text-sm font-medium">Postal code</label>
              <input id="postal" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={form.postalCode || ""} onChange={(e) => update("postalCode", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-xl bg-foreground text-background px-4 py-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {success && <span className="text-sm text-green-600">{success}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </section>
  );
}
