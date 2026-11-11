import { SetMetadata } from '@nestjs/common';

/** Permisos que abren cada pantalla de Administración (se asignan a roles o usuarios). */
export const ADMIN_PERMISSIONS = {
  NOTIFICATIONS: 'administracion-notificaciones',
  ROLES_AND_PERMISSIONS: 'administracion-roles-y-permisos',
  BRANCHES: 'administracion-sucursales',
  /** Mesa de ayuda > Clientes: crear, editar, eliminar e importar. */
  HELPDESK_CLIENTS: 'helpdesk-clientes-admin',
} as const;
export type AdminPermissionName = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const ADMIN_PERMISSION_KEY = 'adminPermission';
/** Permiso que exige el controlador o endpoint (lo valida AdminRolesGuard). */
export const RequireAdminPermission = (permission: AdminPermissionName) => SetMetadata(ADMIN_PERMISSION_KEY, permission);

/**
 * El rol "Administrador" es especial: tiene todos los permisos, no se edita, no se elimina
 * y no se asigna desde la app (solo desde la base de datos). Se reconoce por su nombre;
 * SUPER_ADMIN_ROLE_IDS (ids separados por coma) permite fijarlo por id.
 */
const SUPER_ADMIN_NAMES = ['administrador', 'administradora', 'admin', 'administrator', 'superadmin', 'super admin', 'super administrador'];

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export function superAdminRoleIds(): string[] {
  return (process.env.SUPER_ADMIN_ROLE_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function isSuperAdminRole(rol: { id?: string | number | null; name?: string | null } | null | undefined): boolean {
  if (!rol) return false;
  if (rol.id != null && superAdminRoleIds().includes(String(rol.id))) return true;
  return !!rol.name && SUPER_ADMIN_NAMES.includes(normalize(rol.name));
}

export function hasSuperAdminRole(roles: { id?: string | number | null; name?: string | null }[] | null | undefined): boolean {
  return (roles ?? []).some(isSuperAdminRole);
}
