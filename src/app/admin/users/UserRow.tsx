"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";

import { api } from "@/lib/basePath";
const ALL_ROLES = ["author", "reviewer", "editor", "eic", "admin"];

export default function UserRow({
  user,
  isSelf,
  registered,
}: {
  user: { id: number; email: string; name: string; affiliation: string; roles: string; active: number };
  isSelf: boolean;
  registered: string;
}) {
  const [roles, setRoles] = useState(user.roles.split(",").map((r) => r.trim()).filter(Boolean));
  const [active, setActive] = useState(user.active === 1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    const res = await fetch(api(`/api/admin/users/${user.id}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return null;
    }
    return data;
  }

  async function toggleRole(role: string, on: boolean) {
    const next = on ? [...roles, role] : roles.filter((r) => r !== role);
    if (next.length === 0) {
      setMessage("At least one role is required");
      return;
    }
    setRoles(next);
    await call({ roles: next });
  }

  async function resetPassword() {
    const data = await call({ resetPassword: true });
    if (data?.tempPassword) {
      prompt(
        `Temporary password for ${user.email} (share it securely — it is shown only once):`,
        data.tempPassword
      );
    }
  }

  async function toggleActive() {
    if (
      active &&
      !confirm(`Deactivate ${user.email}? They will no longer be able to sign in.`)
    )
      return;
    const next = !active;
    setActive(next);
    await call({ active: next });
  }

  return (
    <tr className={active ? "hover:bg-gray-50" : "bg-gray-50 opacity-60"}>
      <td className="px-5 py-3">
        <p className="font-medium text-gray-900">
          {user.name}
          {isSelf && <span className="ml-1 text-xs text-gray-400">(you)</span>}
        </p>
        <p className="text-xs text-gray-500">
          {user.email}
          {user.affiliation ? ` · ${user.affiliation}` : ""}
        </p>
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-1.5">
          {ALL_ROLES.map((r) => {
            const on = roles.includes(r);
            return (
              <button
                key={r}
                type="button"
                disabled={busy || (isSelf && r === "admin")}
                onClick={() => toggleRole(r, !on)}
                aria-pressed={on}
                title={isSelf && r === "admin" ? "You cannot remove your own admin role" : `Toggle ${r}`}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                  on
                    ? "bg-primary-700 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-5 py-3 text-gray-600">{registered}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetPassword}
            disabled={busy}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            Reset password
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={toggleActive}
              disabled={busy}
              className={`rounded border px-2 py-1 text-xs ${
                active
                  ? "border-red-200 text-red-600 hover:bg-red-50"
                  : "border-teal-200 text-teal-700 hover:bg-teal-50"
              }`}
            >
              {active ? "Deactivate" : "Reactivate"}
            </button>
          )}
          {!active && <Badge className="bg-gray-200 text-gray-600">Inactive</Badge>}
          <span className="text-xs text-red-600" aria-live="polite">{message}</span>
        </div>
      </td>
    </tr>
  );
}
