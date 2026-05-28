import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Role } from "@/utils/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <ProtectedRoute allowed={["admin"]}>
      <AdminPanel />
    </ProtectedRoute>
  );
}

function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      if (error) {
        toast.error("Error loading users");
      } else {
        setUsers(data || []);
      }

      setLoading(false);
    };

    fetchUsers();
  }, []);

  const updateRole = async (id: string, role: Role) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      toast.error("Error updating role");
    } else {
      toast.success("Role updated");
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role } : u))
      );
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>{user.email}</span>
                  <Badge className="capitalize">{user.role}</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex gap-2 flex-wrap">
                {(["admin", "tecnico", "captacion", "pc"] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => updateRole(user.id, r)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    {r}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
