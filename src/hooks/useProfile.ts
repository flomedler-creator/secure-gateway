import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      setProfile(data);
      setLoading(false);
    };

    getProfile();
  }, []);

  return { profile, loading };
}
