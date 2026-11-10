/** Roles que el código de la app y del backend usa por id: se pueden editar y asignar, no eliminar. */
export const SYSTEM_ROLE_IDS = ['1', '2', '3', '4', '5', '6', '7'];

/** Gerente regional (2) y gerente de soporte técnico (6) administran roles, permisos y sucursales. */
export const ADMIN_ROLE_IDS = ['2', '6'];

/**
 * Permisos que la app usa por nombre para mostrar módulos (navigationPermissions).
 * Se pueden asignar y cambiar su descripción, pero no renombrar ni eliminar.
 */
export const SYSTEM_PERMISSION_NAMES = [
  'billing', 'calendar', 'calendar-manager-sale', 'calendar-sale-executive', 'chats', 'chats-manager-sale',
  'chats-sale-executive', 'counters', 'crm-reports', 'crm-reports-manager-sale', 'crm_activities', 'crm_projects',
  'dashboard-global', 'dashboard-manager-sale', 'dashboard-sale-executive', 'deals', 'helpdesk-branches-reports',
  'helpdesk-dashboard', 'helpdesk-licences', 'helpdesk-my-reports', 'helpdesk-reports', 'helpdesk-ticket-assigned',
  'helpdesk-users', 'leads', 'logs', 'mi-perfil', 'sucursales', 'to-do', 'usuarios', 'usuarios-manager-sale',
];
