import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Mail, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("pc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          navigate({ to: "/login", replace: true });
          return;
        }

        const user = userData.user;
        setEmail(user.email ?? "");

        console.log("USER ID:", user.id);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("🔥 PROFILE ERROR:", error);
          alert("PROFILE ERROR: " + JSON.stringify(error));
          setRole("pc");
        } else {
          console.log("PROFILE DATA:", profile);
          setRole(profile?.role ?? "pc");
        }

      } catch (err) {
        console.error("UNEXPECTED ERROR:", err);
        toast.error("Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10" />
            <span className="font-semibold">CRM</span>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold mb-8">Dashboard</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">

            {/* EMAIL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm">{email}</p>
              </CardContent>
            </Card>

            {/* ROLE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="capitalize">
                  {role}
                </Badge>
              </CardContent>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}
