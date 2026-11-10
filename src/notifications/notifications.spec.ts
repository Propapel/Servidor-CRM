import 'reflect-metadata';
import * as nodemailer from 'nodemailer';
import { decryptSecret, encryptSecret } from './crypto.util';
import { NotificationsService } from './notifications.service';
import { NotificationLogStatus } from './entities/notification-log.entity';
import { NotificationEvent } from './notification-events';
import { TicketNotificationsService } from './ticket-notifications.service';

jest.mock('nodemailer');

process.env.NOTIFICATIONS_SECRET = 'test-secret';

/** QueryBuilder falso: getOne devuelve la config indicada. */
const qbReturning = (config: any) => ({
  addSelect: () => qbReturning(config),
  where: () => qbReturning(config),
  getOne: async () => config,
});

function makeService(config: any) {
  const logs: any[] = [];
  const service = new NotificationsService(
    { createQueryBuilder: () => qbReturning(config), update: jest.fn(), findOneBy: async () => config } as any,
    { find: async () => [] } as any,
    { insert: async (row: any) => logs.push(row) } as any,
    {} as any,
  );
  return { service, logs };
}

const branchConfig = (over: any = {}) => ({
  id: 1, branchId: 7, enabled: true, host: 'smtp.sucursal.mx', port: 587, secure: false, username: 'user',
  passwordEncrypted: encryptSecret('clave-secreta'), fromEmail: 'avisos@sucursal.mx', fromName: 'Mesa Sucursal',
  replyTo: null, updatedAt: new Date('2026-01-01'), ...over,
});

describe('cifrado de contraseñas SMTP', () => {
  it('cifra y descifra sin guardar el texto plano', () => {
    const enc = encryptSecret('mi-clave');
    expect(enc).not.toContain('mi-clave');
    expect(decryptSecret(enc)).toBe('mi-clave');
    expect(encryptSecret('mi-clave')).not.toBe(enc); // IV aleatorio
  });
});

describe('NotificationsService.send', () => {
  const sendMail = jest.fn();
  beforeEach(() => {
    sendMail.mockReset().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReset().mockReturnValue({ sendMail, verify: jest.fn() });
    delete process.env.MAIL_HOST; delete process.env.MAIL_USER; delete process.env.MAIL_PASS;
  });

  it('usa el SMTP de la sucursal con la contraseña descifrada y registra el envío', async () => {
    const { service, logs } = makeService(branchConfig());
    const ok = await service.send({ branchId: 7, event: NotificationEvent.TICKET_CREATED, to: ['A@x.mx', 'b@x.mx', 'a@x.mx'], subject: 'S', html: '<p/>' });
    expect(ok).toBe(true);
    expect((nodemailer.createTransport as jest.Mock).mock.calls[0][0]).toMatchObject({ host: 'smtp.sucursal.mx', auth: { user: 'user', pass: 'clave-secreta' } });
    expect(sendMail.mock.calls[0][0]).toMatchObject({ from: '"Mesa Sucursal" <avisos@sucursal.mx>', to: 'a@x.mx', bcc: ['b@x.mx'] });
    expect(logs[0]).toMatchObject({ status: NotificationLogStatus.SENT, smtpSource: 'branch', recipients: 'a@x.mx, b@x.mx' });
  });

  it('sin configuración usa la cuenta general de las variables de entorno', async () => {
    Object.assign(process.env, { MAIL_HOST: 'smtp.general.mx', MAIL_USER: 'general@x.mx', MAIL_PASS: 'p' });
    const { service, logs } = makeService(null);
    await service.send({ branchId: 7, event: 'X', to: ['a@x.mx'], subject: 'S', html: '' });
    expect(logs[0]).toMatchObject({ status: NotificationLogStatus.SENT, smtpSource: 'default' });
  });

  it('sucursal apagada: no envía y lo deja en el historial', async () => {
    const { service, logs } = makeService(branchConfig({ enabled: false }));
    expect(await service.send({ branchId: 7, event: 'X', to: ['a@x.mx'], subject: 'S', html: '' })).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
    expect(logs[0].status).toBe(NotificationLogStatus.SKIPPED);
  });

  it('un error de credenciales no lanza y se guarda con mensaje entendible', async () => {
    sendMail.mockRejectedValue(Object.assign(new Error('535 auth'), { code: 'EAUTH' }));
    const { service, logs } = makeService(branchConfig());
    expect(await service.send({ branchId: 7, event: 'X', to: ['a@x.mx'], subject: 'S', html: '' })).toBe(false);
    expect(logs[0]).toMatchObject({ status: NotificationLogStatus.FAILED, error: 'Usuario o contraseña del correo incorrectos' });
  });

  it('sin destinatarios no hace nada', async () => {
    const { service, logs } = makeService(branchConfig());
    expect(await service.send({ branchId: 7, event: 'X', to: [], subject: 'S', html: '' })).toBe(false);
    expect(logs).toHaveLength(0);
  });
});

describe('TicketNotificationsService', () => {
  const ticket = {
    id: 10, ticketNumber: 'MER-15', status: 'ASIGNADO', reasonReport: 'No imprime', nameReported: 'Ana',
    emailReport: 'ana@cliente.mx', statusToken: 'tok', sucursal: { id: 7, nombre: 'Mérida' },
    cliente: { numberOfClient: '100', razonSocial: 'ACME' },
    assigmentsTechnical: [{ name: 'Luis', lastname: 'P', email: 'luis@propapel.mx' }],
  };
  const qb: any = { leftJoinAndSelect: () => qb, leftJoin: () => qb, addSelect: () => qb, where: () => qb, getOne: async () => ticket };

  async function run(event: NotificationEvent, options: any, staff: string[]) {
    const notifications = {
      recipientsFor: jest.fn().mockResolvedValue(staff),
      getBranchOptions: jest.fn().mockResolvedValue(options),
      send: jest.fn().mockResolvedValue(true),
    };
    const svc = new TicketNotificationsService({ createQueryBuilder: () => qb } as any, notifications as any);
    await (svc as any).handle(event, 10);
    return notifications.send.mock.calls.map((c) => c[0]);
  }

  it('creado: avisa al personal configurado y, si se pidió, a quien reportó con su enlace', async () => {
    const sent = await run(NotificationEvent.TICKET_CREATED, { notifyReporter: true }, ['jefe@propapel.mx']);
    expect(sent[0]).toMatchObject({ branchId: 7, to: ['jefe@propapel.mx'], subject: 'Nuevo ticket #MER-15' });
    expect(sent[1]).toMatchObject({ to: ['ana@cliente.mx'], event: 'TICKET_CREATED_REPORTER' });
    expect(sent[1].html).toContain('/ticket/checkStatus/tok');
  });

  it('asignado: incluye al técnico si la sucursal lo tiene activado; no avisa a quien reportó', async () => {
    const sent = await run(NotificationEvent.TICKET_ASSIGNED, { notifyAssignedTechnician: true, notifyReporter: true }, []);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toEqual(['luis@propapel.mx']);
  });

  it('sin configuración de la sucursal no avisa a quien reportó', async () => {
    const sent = await run(NotificationEvent.TICKET_CLOSED, null, ['jefe@propapel.mx']);
    expect(sent).toHaveLength(1);
  });
});
