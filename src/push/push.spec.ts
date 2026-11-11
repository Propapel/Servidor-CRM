import 'reflect-metadata';
import * as admin from 'firebase-admin';
import { PushService } from './push.service';
import { TicketPushService } from './ticket-push.service';
import { NotificationEvent } from '../notifications/notification-events';
import { TicketNotificationsService } from '../notifications/ticket-notifications.service';

jest.mock('firebase-admin', () => {
  const sendEachForMulticast = jest.fn();
  return { apps: [] as unknown[], messaging: () => ({ sendEachForMulticast }), __send: sendEachForMulticast };
});
const send = (admin as any).__send as jest.Mock;
const setFirebaseReady = (ready: boolean) => { (admin as any).apps.length = 0; if (ready) (admin as any).apps.push({}); };

function makePush(devices: string[], legacy: (string | null)[] = []) {
  const deviceRepo: any = { find: jest.fn().mockResolvedValue(devices.map((token) => ({ token }))), delete: jest.fn() };
  const execute = jest.fn();
  const qb: any = { update: () => qb, set: () => qb, where: () => qb, execute };
  const userRepo: any = {
    find: jest.fn().mockResolvedValue(legacy.map((fcmToken, i) => ({ id: i + 1, fcmToken }))),
    createQueryBuilder: () => qb,
  };
  return { svc: new PushService(deviceRepo, userRepo), deviceRepo, execute };
}

describe('PushService', () => {
  beforeEach(() => send.mockReset());

  it('sin Firebase configurado no intenta enviar ni falla', async () => {
    setFirebaseReady(false);
    const { svc } = makePush(['t1']);
    await expect(svc.sendToUsers([1], { title: 'x', body: 'y' })).resolves.toEqual({ sent: 0, failed: 0 });
    expect(send).not.toHaveBeenCalled();
  });

  it('junta tokens de push_device y el campo antiguo fcmToken, sin repetir; escritorio va como Web Push urgente', async () => {
    setFirebaseReady(true);
    send.mockResolvedValue({ successCount: 3, failureCount: 0, responses: [{ success: true }, { success: true }, { success: true }] });
    const { svc } = makePush(['desk-1', 'phone-1'], ['phone-1', 'legacy-2', null]);
    await expect(svc.sendToUsers([1, 2], { title: 'T', body: 'B', data: { a: '1' } })).resolves.toEqual({ sent: 3, failed: 0 });
    const msg = send.mock.calls[0][0];
    expect(msg.tokens).toEqual(['desk-1', 'phone-1', 'legacy-2']);
    expect(msg.webpush.headers).toEqual({ TTL: '86400', Urgency: 'high' });
    expect(msg.notification).toEqual({ title: 'T', body: 'B' });
  });

  it('borra los tokens que FCM dice que ya no existen', async () => {
    setFirebaseReady(true);
    send.mockResolvedValue({
      successCount: 1, failureCount: 1,
      responses: [{ success: true }, { success: false, error: { code: 'messaging/registration-token-not-registered' } }],
    });
    const { svc, deviceRepo, execute } = makePush(['ok', 'dead']);
    await svc.sendToUsers([1], { title: 'T', body: 'B' });
    expect(deviceRepo.delete).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalled(); // también limpia users.fcmToken
  });

  it('si Firebase lanza error no se propaga', async () => {
    setFirebaseReady(true);
    send.mockRejectedValue(new Error('quota'));
    const { svc } = makePush(['t1']);
    await expect(svc.sendToUsers([1], { title: 'T', body: 'B' })).resolves.toMatchObject({ sent: 0 });
  });
});

describe('TicketPushService: a quién avisa', () => {
  const ticket = {
    id: 9, ticketNumber: 'MER-9', status: 'EN_PROCESO', reasonReport: 'No imprime',
    sucursal: { id: 3 }, cliente: { razonSocial: 'ACME' }, createdBy: { id: 50 }, assigmentsTechnical: [{ id: 7 }, { id: 8 }],
  };
  const tqb: any = { leftJoin: () => tqb, addSelect: () => tqb, where: () => tqb, getOne: async () => ticket };
  const uqb: any = { select: () => uqb, innerJoin: () => uqb, where: () => uqb, getMany: async () => [{ id: 7 }, { id: 50 }, { id: 12 }] };
  const run = async (event: any) => {
    const push = { sendToUsers: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }) };
    await new TicketPushService({ createQueryBuilder: () => tqb } as any, { createQueryBuilder: () => uqb } as any, push as any).notify(event, 9);
    return push.sendToUsers.mock.calls[0];
  };

  it('creado: técnicos y gerentes de soporte de la sucursal, menos quien lo creó', async () => {
    const [ids, payload] = await run('TICKET_CREATED');
    expect(ids).toEqual([7, 12]);
    expect(payload).toMatchObject({ title: 'Nuevo ticket #MER-9', data: { type: 'NEW_TICKET', ticketId: '9' } });
  });

  it('asignado: los técnicos asignados', async () => {
    const [ids] = await run('TICKET_ASSIGNED');
    expect(ids).toEqual([7, 8]);
  });

  it('cerrado: quien creó el ticket', async () => {
    const [ids, payload] = await run('TICKET_CLOSED');
    expect(ids).toEqual([50]);
    expect(payload.title).toBe('Tu ticket #MER-9 se cerró');
  });
});

describe('el push nunca afecta al ticket', () => {
  it('aunque el push lance, dispatch regresa y no hay rechazos sin manejar', async () => {
    const unhandled: unknown[] = [];
    const h = (e: unknown) => unhandled.push(e);
    process.on('unhandledRejection', h);
    const svc = new TicketNotificationsService(
      { createQueryBuilder: () => { throw new Error('db'); } } as any,
      {} as any,
      { notify: () => { throw new Error('firebase'); } } as any,
    );
    expect(() => svc.dispatch(NotificationEvent.TICKET_CREATED, 1)).not.toThrow();
    await new Promise((r) => setTimeout(r, 30));
    process.off('unhandledRejection', h);
    expect(unhandled).toHaveLength(0);
  });
});
