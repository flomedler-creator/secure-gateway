import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { Role } from "@/utils/roles";

interface Props {
  allowed: Role[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowed, children }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        navigate({ to: "/login", replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      const role = (profile?.role ?? "pc") as Role;

      if (!allowed.includes(role)) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      setLoading(false);
    };

    check();
  }, []);

  if (loading) return null;

  return <>{children}</>;
}
