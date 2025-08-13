import type { Metadata } from "next";
import { AuthGate } from "../../../components/AuthGate";
import { LogoutButton } from "../../../components/LogoutButton";

export const metadata: Metadata = {
  title: "Admin | App",
  description: "Admin area",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-black/10 dark:border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-indigo-600 text-white grid place-items-center">
            <span className="text-sm font-semibold">A</span>
          </div>
          <h1 className="text-lg font-semibold">Admin</h1>
        </div>
        <LogoutButton />
      </header>
      <main className="p-6">
        <div className="mx-auto max-w-6xl">
          <AuthGate requireAdmin>{children}</AuthGate>
        </div>
      </main>
    </div>
  );
}
