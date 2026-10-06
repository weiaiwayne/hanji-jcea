"use client";

import { useState } from "react";
import Link from "next/link";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(api("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.href = api(data.redirect || "/author");
    } else {
      setError(data.error || "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className={labelCls}>
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputCls}
        />
      </div>
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "Signing in…" : "Sign In"}
      </button>
      <p className="text-center text-sm text-gray-600">
        New to JCEA?{" "}
        <Link href="/register" className="font-medium text-primary-700 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
