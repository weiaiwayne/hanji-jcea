"use client";

import { useState } from "react";
import Link from "next/link";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function RegisterForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(api("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.href = api(data.redirect || "/author");
    } else {
      setError(data.error || "Registration failed");
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
        <label htmlFor="name" className={labelCls}>
          Full name *
        </label>
        <input id="name" name="name" required className={inputCls} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="email" className={labelCls}>
          Email address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputCls}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>
          Password * <span className="font-normal text-gray-500">(min. 8 characters)</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className={inputCls}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="affiliation" className={labelCls}>
          Affiliation
        </label>
        <input
          id="affiliation"
          name="affiliation"
          className={inputCls}
          placeholder="University or organization"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="country" className={labelCls}>
            Country
          </label>
          <input id="country" name="country" className={inputCls} />
        </div>
        <div>
          <label htmlFor="orcid" className={labelCls}>
            ORCID iD
          </label>
          <input
            id="orcid"
            name="orcid"
            className={inputCls}
            placeholder="0000-0000-0000-0000"
            pattern="\d{4}-\d{4}-\d{4}-\d{3}[\dX]"
          />
        </div>
      </div>
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "Creating account…" : "Create Account"}
      </button>
      <p className="text-center text-sm text-gray-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-primary-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
