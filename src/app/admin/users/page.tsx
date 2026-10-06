import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { PageTitle, Card } from "@/components/ui";
import UserRow from "./UserRow";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await requireUser("admin");
  const users = getDb()
    .prepare("SELECT id, email, name, affiliation, roles, active, created_at FROM users ORDER BY created_at DESC")
    .all() as {
    id: number;
    email: string;
    name: string;
    affiliation: string;
    roles: string;
    active: number;
    created_at: string;
  }[];

  return (
    <>
      <PageTitle
        title="User Management"
        subtitle="Grant roles, reset passwords, and deactivate accounts. Admins implicitly hold every role."
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Roles</th>
                <th className="px-5 py-3">Registered</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isSelf={u.id === me.id}
                  registered={fmtDate(u.created_at)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
