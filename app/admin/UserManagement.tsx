"use client";

import { useState, useEffect, useCallback } from "react";

type User = {
  id: number;
  username: string;
  is_admin: number;
  created_at: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    });

    setCreating(false);
    if (res.ok) {
      setShowCreate(false);
      setNewUsername("");
      setNewPassword("");
      fetchUsers();
    } else {
      const data = await res.json();
      setCreateError(data.error ?? "Failed to create user");
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    fetchUsers();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetId) return;
    setResetError("");
    setResetting(true);

    const res = await fetch(`/api/admin/users/${resetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });

    setResetting(false);
    if (res.ok) {
      setResetId(null);
      setResetPassword("");
    } else {
      const data = await res.json();
      setResetError(data.error ?? "Failed to reset password");
    }
  }

  return (
    <div>
      {/* Users table */}
      <div className="overflow-hidden rounded-xl bg-gray-900">
        {loading ? (
          <p className="px-4 py-6 text-sm text-gray-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="py-3 pl-4 text-left font-medium">Username</th>
                <th className="py-3 text-left font-medium">Role</th>
                <th className="py-3 text-left font-medium">Created</th>
                <th className="py-3 pr-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/30">
                  <td className="py-3 pl-4 font-medium text-gray-200">{u.username}</td>
                  <td className="py-3 text-gray-400">
                    {u.is_admin ? (
                      <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-xs text-indigo-300">admin</span>
                    ) : (
                      <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">user</span>
                    )}
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString("en-MY")}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {u.username !== "admin" && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setResetId(u.id); setResetError(""); setResetPassword(""); }}
                          className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                        >
                          Reset pw
                        </button>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create user button */}
      <button
        onClick={() => { setShowCreate(true); setCreateError(""); }}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
      >
        + Create user
      </button>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">Create user</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                autoFocus
                className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
              />
              {createError && <p className="text-xs text-red-400">{createError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg bg-gray-800 py-2.5 text-sm hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">Reset password</h2>
            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="New password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                autoFocus
                className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
              />
              {resetError && <p className="text-xs text-red-400">{resetError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResetId(null)}
                  className="flex-1 rounded-lg bg-gray-800 py-2.5 text-sm hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
                >
                  {resetting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6">
            <h2 className="mb-2 text-lg font-semibold">Delete user?</h2>
            <p className="mb-4 text-sm text-gray-400">
              Their transactions will be reassigned to admin. Their budgets will be deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg bg-gray-800 py-2.5 text-sm hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
