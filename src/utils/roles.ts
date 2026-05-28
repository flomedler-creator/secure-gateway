export type Role = "admin" | "tecnico" | "captacion" | "pc";

export function canAccess(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}
