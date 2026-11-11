/**
 * Notificaciones usa el mismo guard de Administración; el controlador pide el permiso
 * 'administracion-notificaciones' con @RequireAdminPermission.
 */
export { AdminRolesGuard as NotificationsAdminGuard } from '../../admin/guards/admin-roles.guard';

/** Gerente regional (2) y gerente de soporte técnico (6): acceso mientras el permiso no esté asignado a nadie. */
export const NOTIFICATION_ADMIN_ROLE_IDS = ['2', '6'];
