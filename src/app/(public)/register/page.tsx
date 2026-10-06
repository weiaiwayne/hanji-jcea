import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RegisterForm from "./RegisterForm";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  if (!EDITORIAL_SYSTEM_ENABLED) notFound();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl font-bold text-primary-900">
        Create an Account
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Register to submit manuscripts to the Journal of Contemporary Eastern
        Asia. Reviewer and editor roles are granted by the editorial office.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
        <RegisterForm />
      </div>
    </div>
  );
}
