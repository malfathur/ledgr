export const dynamic = "force-dynamic";

import Link from "next/link";
import UserManagement from "./UserManagement";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Users</h2>
        <UserManagement />
      </section>
    </main>
  );
}
