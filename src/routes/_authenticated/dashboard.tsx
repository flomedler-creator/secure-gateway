import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setEmail(userData.user.email ?? "");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (error) {
        toast.error("Could not load profile");
      } else {
        setRole(profile?.role ?? "user");
      }
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 ring-1 ring-primary/30" />
            <span className="font-semibold tracking-tight">Console</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You're signed in. Here's your account at a glance.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading account…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </CardTitle>
                <CardDescription>Your signed-in identity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm text-foreground">{email}</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Role
                </CardTitle>
                <CardDescription>From your profile record</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
                  {role ?? "unknown"}
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
