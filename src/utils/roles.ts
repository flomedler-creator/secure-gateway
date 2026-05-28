export type Role = "admin" | "tecnico" | "captacion" | "pc" | "user";

export const ASSIGNABLE_ROLES: Role[] = ["admin", "tecnico", "captacion", "pc"];

export function canAccess(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}

export function roleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-red-500/15 text-red-400 border border-red-500/30";
    case "tecnico":
      return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
    case "captacion":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    case "pc":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}
