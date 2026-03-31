// app/admin/users/page.tsx  — FIXED VERSION
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Loading } from "@/app/components/ui/Loading";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { userApi } from "@/lib/api";
import { User } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

const loadUsers = async () => {
  try {
    const res = await userApi.getAll();
    setUsers(Array.isArray(res.data) ? res.data : []);
  } catch (error: any) {
    toast.error(error.message || "Failed to load users");
    setUsers([]);
  } finally {
    setLoading(false);
  }
};
  const handleToggleBlock = async (user: User) => {
    const action = user.is_blocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    setTogglingId(user.id);
    try {
      await userApi.toggleBlock(user.id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u
        )
      );

      toast.success(`User ${action}ed successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} user`);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <Loading size="lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600">Manage all registered users</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Wallet</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Users will appear here once they register
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* FIX: removed user.photo — not returned by backend */}
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                          {user.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || "?"}                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.phone}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.email || <span className="text-gray-400 text-sm">No email</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.wallet_balance_aed !== undefined ? (
                        <span className="font-semibold text-green-600">
                          AED {Number(user.wallet_balance_aed).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.is_blocked ? (
                        <Badge variant="danger">Blocked</Badge>
                      ) : user.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="gray">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {user.created_at ? formatDate(user.created_at) : "-"}                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {/* FIX: View button now navigates to user detail page */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          View
                        </Button>
                        {/* FIX: added Block/Unblock action */}
                        <Button
                          variant={user.is_blocked ? "primary" : "danger"}
                          size="sm"
                          onClick={() => handleToggleBlock(user)}
                          disabled={togglingId === user.id}
                        >
                          {togglingId === user.id
                            ? "..."
                            : user.is_blocked
                              ? "Unblock"
                              : "Block"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {users.length > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-600">
            Showing {users.length} user{users.length !== 1 ? "s" : ""}
          </div>
        )}
      </Card>
    </div>
  );
}