import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/lib/admin-users.functions";
import { ASSIGNABLE_ROLES, Role, roleBadgeClass } from "@/utils/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Search, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  component: AdminPage,
});

type AdminUser = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

function AdminPage() {
  const navigate = useNavigate();
  const list = useServerFn(listAdminUsers);
  const create = useServerFn(createAdminUser);
  const update = useServerFn(updateAdminUser);
  const remove = useServerFn(deleteAdminUser);

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  // Authorize: must be admin
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/login", replace: true });
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.user.id)
        .single();
      if (p?.role !== "admin") {
        toast.error("Acceso denegado: requiere rol admin");
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      setAuthorized(true);
    })();
  }, [navigate]);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await list();
      setUsers(data as AdminUser[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (search && !u.email.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [users, search, roleFilter]);

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">/</span>
            <h1 className="font-semibold">Admin · Usuarios</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo usuario
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
              <SelectItem value="user">user</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground">
            {filtered.length} de {users.length}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="font-mono text-xs">ID</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Sin resultados
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${roleBadgeClass(
                          u.role,
                        )}`}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {u.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(u)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(u)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (payload) => {
          await create({ data: payload });
          toast.success("Usuario creado");
          await reload();
        }}
      />

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSave={async (payload) => {
          await update({ data: payload });
          toast.success("Usuario actualizado");
          await reload();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <b>{deleting?.email}</b> de autenticación y de
              perfiles. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                try {
                  await remove({ data: { id: deleting.id } });
                  toast.success("Usuario eliminado");
                  setDeleting(null);
                  await reload();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (p: { email: string; password: string; role: Role; full_name?: string }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("pc");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail(""); setPassword(""); setFullName(""); setRole("pc");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>
          <div>
            <Label>Nombre completo (opcional)</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={submitting || !email || password.length < 6}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onCreate({ email, password, role, full_name: fullName });
                onOpenChange(false);
                reset();
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSave: (p: { id: string; role?: Role; email?: string }) => Promise<void>;
}) {
  const [role, setRole] = useState<Role>("pc");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setRole((user.role as Role) ?? "pc");
      setEmail(user.email);
    }
  }, [user]);

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={submitting}
            onClick={async () => {
              if (!user) return;
              setSubmitting(true);
              try {
                const payload: { id: string; role?: Role; email?: string } = { id: user.id, role };
                if (email && email !== user.email) payload.email = email;
                await onSave(payload);
                onClose();
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
