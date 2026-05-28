import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ROLES = ["admin", "tecnico", "captacion", "pc", "user"] as const;

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data || data.role !== "admin") {
    throw new Error("Forbidden: admin role required");
  }
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: authData, error: authErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (authErr) throw new Error(authErr.message);

    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, full_name, created_at");
    if (profErr) throw new Error(profErr.message);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return authData.users.map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? p?.email ?? "",
        role: (p?.role ?? "user") as string,
        full_name: p?.full_name ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      };
    });
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6).max(72),
        role: z.enum(ROLES),
        full_name: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name ?? "" },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Create failed");

    // Trigger creates the profile; ensure role is what admin chose.
    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: created.user.id,
        email: data.email,
        full_name: data.full_name ?? "",
        role: data.role,
      });
    if (upErr) throw new Error(upErr.message);

    return { id: created.user.id };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        role: z.enum(ROLES).optional(),
        email: z.string().email().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    if (data.email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        email: data.email,
      });
      if (error) throw new Error(error.message);
    }

    const patch: { role?: (typeof ROLES)[number]; email?: string } = {};
    if (data.role) patch.role = data.role;
    if (data.email) patch.email = data.email;
    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(patch)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.id === context.userId) {
      throw new Error("You cannot delete your own account");
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (authErr) throw new Error(authErr.message);

    await supabaseAdmin.from("profiles").delete().eq("id", data.id);
    return { ok: true };
  });
