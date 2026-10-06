import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LoginForm from "./LoginForm";
import DemoAccess from "@/components/DemoAccess";
import { getSetting } from "@/lib/db";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  if (!EDITORIAL_SYSTEM_ENABLED) notFound();
  const { denied } = await searchParams;
  const demoMode = getSetting("demo_mode", "yes").toLowerCase() !== "no";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl font-bold text-primary-900">Sign In</h1>
      <p className="mt-2 text-sm text-gray-600">
        Access your author, reviewer, or editorial dashboard.
      </p>
      {denied && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          You don&apos;t have permission to access that area. Sign in with an
          account that has the required role.
        </p>
      )}
      {demoMode && (
        <div className="mt-6">
          <DemoAccess />
        </div>
      )}
      <div className="mt-6 rounded-xl border border-gray-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
        <LoginForm />
      </div>
    </div>
  );
}
