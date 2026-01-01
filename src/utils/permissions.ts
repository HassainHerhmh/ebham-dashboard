// ===============================
// 🔐 Types
// ===============================

export type PermissionAction =
  | "view"
  | "add"
  | "edit"
  | "delete"
  | "print";

export interface User {
  role?: string | { name?: string };
  permissions?: Record<string, Record<string, boolean>>;
}

// ===============================
// 🔐 Permission Checker
// ===============================

export function hasPermission(
  user: User | null,
  section: string,
  action: PermissionAction = "view"
): boolean {
  if (!user) return false;

  // 🟢 دعم role كنص أو كائن
  const role =
    typeof user.role === "string"
      ? user.role.toLowerCase()
      : user.role?.name?.toLowerCase?.();

  // ✅ الأدمن له كل الصلاحيات
  if (role && ["admin", "superadmin", "manager"].includes(role)) {
    return true;
  }

  // 🟢 صلاحيات الأقسام
  const permissions = user.permissions ?? {};

  return permissions?.[section]?.[action] === true;
}
