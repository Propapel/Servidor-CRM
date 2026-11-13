import 'reflect-metadata';
import { LeadPushService, wallClockAsUtcMs } from './lead-push.service';
import { PushService } from './push.service';
import { TicketPushService } from './ticket-push.service';

describe('wallClockAsUtcMs', () => {
  it('escribe la hora de México como si fuera UTC (como guarda la app las citas)', () => {
    // 2026-11-13 18:30 UTC = 12:30 en Ciudad de México (UTC-6)
    const encoded = wallClockAsUtcMs(new Date(Date.UTC(2026, 10, 13, 18, 30)), 'America/Mexico_City');
    expect(new Date(encoded).toISOString()).toBe('2026-11-13T12:30:00.000Z');
  });
});

describe('LeadPushService', () => {
  const flush = () => new Promise((r) => setImmediate(r));

  it('avisa de la cita próxima al dueño del lead y la marca para no repetir', async () => {
    const now = wallClockAsUtcMs();
    const reminder = {
      reminder_id: 7, reminder_date: String(now + 10 * 60_000), typeAppointment: 'Llamada', description: 'Cotización',
      customer: { customer_id: 3, company_name: 'Hotel Caribe', user: { id: 42 } },
    };
    const qb: any = {};
    for (const k of ['innerJoinAndSelect', 'innerJoin', 'addSelect', 'where', 'andWhere', 'take']) qb[k] = () => qb;
    qb.getMany = async () => [reminder];
    const repo: any = { createQueryBuilder: () => qb, update: jest.fn() };
    const push = { sendToUsers: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }) } as any;
    await new LeadPushService(repo, push).notifyUpcomingReminders();
    expect(repo.update).toHaveBeenCalledWith({ reminder_id: 7 }, expect.objectContaining({ push_notified_at: expect.any(Date) }));
    const [ids, payload] = push.sendToUsers.mock.calls[0];
    expect(ids).toEqual([42]);
    expect(payload.title).toMatch(/^Llamada en 10 min: Hotel Caribe$/);
    expect(payload.data).toMatchObject({ type: 'REMINDER_DUE', customerId: '3', reminderId: '7' });
    expect(payload.category).toBe('leads');
  });

  it('mensaje de conversación: a los demás participantes, nunca a quien lo envió', async () => {
    const push = { sendToUsers: jest.fn().mockResolvedValue({}) } as any;
    new LeadPushService({} as any, push).leadMessage({
      conversationId: 5, customerId: 3, companyName: 'Hotel Caribe', senderId: 1, senderName: 'Ana', recipientIds: [1, 2, 2, 9], content: 'Hola',
    });
    await flush();
    expect(push.sendToUsers.mock.calls[0][0]).toEqual([2, 9]);
    expect(push.sendToUsers.mock.calls[0][1].category).toBe('chat');
  });

  it('nota y revisión: solo al dueño y no cuando el autor es el dueño', async () => {
    const push = { sendToUsers: jest.fn().mockResolvedValue({}) } as any;
    const svc = new LeadPushService({} as any, push);
    svc.leadNote({ customerId: 3, companyName: 'X', ownerId: 4, authorId: 4, authorName: 'Yo', content: 'a' });
    svc.leadReviewed({ customerId: 3, companyName: 'X', ownerId: 4, status: 'DISCARDED', managerId: 8 });
    await flush();
    expect(push.sendToUsers).toHaveBeenCalledTimes(1);
    expect(push.sendToUsers.mock.calls[0][1].title).toBe('Tu lead fue descartado');
  });
});

describe('TicketPushService: comentario', () => {
  it('avisa al que levantó el ticket y a los técnicos, menos al autor; las notas internas no le llegan a quien reportó', async () => {
    const ticket = { id: 1, ticketNumber: 'MER-1', status: 'EN_PROCESO', createdBy: { id: 10 }, assigmentsTechnical: [{ id: 20 }, { id: 21 }], cliente: null, nameCommercial: 'H', reasonReport: 'x' };
    const qb: any = {};
    for (const k of ['leftJoin', 'addSelect', 'where']) qb[k] = () => qb;
    qb.getOne = async () => ticket;
    const push = { sendToUsers: jest.fn().mockResolvedValue({}) } as any;
    const svc = new TicketPushService({ createQueryBuilder: () => qb } as any, {} as any, push);
    await svc.notify('TICKET_COMMENT', 1, { authorId: 20, authorName: 'Luis', preview: 'Voy en camino' });
    expect(push.sendToUsers.mock.calls[0][0].sort()).toEqual([10, 21]);
    expect(push.sendToUsers.mock.calls[0][1].title).toBe('Luis comentó en el ticket #MER-1');
    await svc.notify('TICKET_COMMENT', 1, { authorId: 20, authorName: 'Luis', preview: 'nota', isInternal: true });
    expect(push.sendToUsers.mock.calls[1][0]).toEqual([21]);
  });
});

describe('PushService: bandeja', () => {
  it('guarda un aviso por usuario aunque Firebase no esté configurado', async () => {
    const inbox: any = { insert: jest.fn() };
    const svc = new PushService({ find: jest.fn() } as any, { find: jest.fn() } as any, inbox);
    await svc.sendToUsers([1, 2, 2], { title: 'T', body: 'B', data: { type: 'NEW_TICKET' }, category: 'tickets' });
    const rows = inbox.insert.mock.calls[0][0];
    expect(rows.map((r: any) => r.userId)).toEqual([1, 2]);
    expect(rows[0]).toMatchObject({ category: 'tickets', type: 'NEW_TICKET', title: 'T', data: { type: 'NEW_TICKET', category: 'tickets' } });
  });

  it('la prueba de notificación no se guarda en la bandeja', async () => {
    const inbox: any = { insert: jest.fn() };
    const svc = new PushService({ find: jest.fn() } as any, { find: jest.fn() } as any, inbox);
    await svc.sendToUsers([1], { title: 'T', body: 'B', inbox: false });
    expect(inbox.insert).not.toHaveBeenCalled();
  });
});
