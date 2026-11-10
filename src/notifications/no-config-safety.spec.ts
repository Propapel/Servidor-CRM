import 'reflect-metadata';
import { NotificationsService } from './notifications.service';
import { NotificationEvent } from './notification-events';
import { TicketNotificationsService } from './ticket-notifications.service';

/**
 * Garantía: sin configuración (o con fallas) las notificaciones nunca rompen ni retrasan
 * la creación/edición de tickets.
 */
const tick = () => new Promise((r) => setImmediate(r)).then(() => new Promise((r) => setTimeout(r, 20)));

describe('notificaciones sin configuración o con fallas', () => {
  let unhandled: unknown[] = [];
  const onUnhandled = (e: unknown) => unhandled.push(e);
  beforeAll(() => process.on('unhandledRejection', onUnhandled));
  afterAll(() => process.off('unhandledRejection', onUnhandled));
  beforeEach(() => {
    unhandled = [];
    delete process.env.MAIL_HOST; delete process.env.MAIL_USER; delete process.env.MAIL_PASS;
    delete process.env.NOTIFICATIONS_SECRET; delete process.env.JWT_ACCESS_SECRET;
  });

  const qbTicket = (ticket: any) => {
    const qb: any = { leftJoinAndSelect: () => qb, leftJoin: () => qb, addSelect: () => qb, where: () => qb, getOne: async () => ticket };
    return qb;
  };
  const ticket = { id: 1, ticketNumber: 'T-1', status: 'SIN_ASIGNAR', emailReport: 'a@b.mx', sucursal: { id: 3, nombre: 'X' } };

  it('dispatch regresa de inmediato aunque todo falle después', async () => {
    const svc = new TicketNotificationsService(
      { createQueryBuilder: () => { throw new Error('la tabla no existe'); } } as any,
      {} as any,
    );
    expect(() => svc.dispatch(NotificationEvent.TICKET_CREATED, 1)).not.toThrow();
    await tick();
    expect(unhandled).toHaveLength(0);
  });

  it('dispatch sin id de ticket no hace nada', () => {
    const svc = new TicketNotificationsService({} as any, {} as any);
    expect(() => svc.dispatch(NotificationEvent.TICKET_CREATED, undefined)).not.toThrow();
  });

  it('sucursal sin configuración ni destinatarios: no envía nada y no falla', async () => {
    const notifications = new NotificationsService(
      { findOneBy: async () => null, createQueryBuilder: () => ({ addSelect() { return this; }, where() { return this; }, getOne: async () => null }) } as any,
      { find: async () => [] } as any,               // sin destinatarios
      { insert: jest.fn() } as any,
      {} as any,
    );
    const send = jest.spyOn(notifications, 'send');
    const svc = new TicketNotificationsService({ createQueryBuilder: () => qbTicket(ticket) } as any, notifications);
    svc.dispatch(NotificationEvent.TICKET_CREATED, 1);
    await tick();
    expect(send).toHaveBeenCalledTimes(1);
    await expect(send.mock.results[0].value).resolves.toBe(false); // sin destinatarios: no se envía
    expect(unhandled).toHaveLength(0);
  });

  it('las tablas de notificaciones aún no existen: el error se registra en log y no se propaga', async () => {
    const boom = async () => { throw new Error("Table 'notification_recipient' doesn't exist"); };
    const notifications = new NotificationsService(
      { findOneBy: boom } as any, { find: boom } as any, { insert: boom } as any, {} as any,
    );
    const svc = new TicketNotificationsService({ createQueryBuilder: () => qbTicket(ticket) } as any, notifications);
    expect(() => svc.dispatch(NotificationEvent.TICKET_CLOSED, 1)).not.toThrow();
    await tick();
    expect(unhandled).toHaveLength(0);
  });

  it('con destinatarios pero sin ningún servidor de correo: se omite y se anota en el historial', async () => {
    const logs: any[] = [];
    const notifications = new NotificationsService(
      { createQueryBuilder: () => ({ addSelect() { return this; }, where() { return this; }, getOne: async () => null }) } as any,
      {} as any,
      { insert: async (row: any) => logs.push(row) } as any,
      {} as any,
    );
    await expect(notifications.send({ branchId: 3, event: 'X', to: ['a@b.mx'], subject: 'S', html: '' })).resolves.toBe(false);
    expect(logs[0].status).toBe('SKIPPED');
  });

  it('SMTP guardado pero sin llave para descifrar: falla el correo, no el ticket', async () => {
    const logs: any[] = [];
    const config = { id: 1, branchId: 3, enabled: true, passwordEncrypted: 'v1:a:b:c', updatedAt: new Date(), fromName: 'X', fromEmail: 'x@x.mx' };
    const notifications = new NotificationsService(
      { createQueryBuilder: () => ({ addSelect() { return this; }, where() { return this; }, getOne: async () => config }) } as any,
      {} as any,
      { insert: async (row: any) => logs.push(row) } as any,
      {} as any,
    );
    await expect(notifications.send({ branchId: 3, event: 'X', to: ['a@b.mx'], subject: 'S', html: '' })).resolves.toBe(false);
    expect(logs[0].status).toBe('FAILED');
  });
});
